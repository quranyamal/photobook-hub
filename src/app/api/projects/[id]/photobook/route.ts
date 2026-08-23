import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { storage } from "@/server/storage";
import { PhotobookSize, CoverType } from "@/generated/prisma/enums";
import {
  createRequestLogger,
  getRequestId,
  tagActiveSpan,
  logResponse,
} from "@/lib/request-logger";

const updatePhotobookSchema = z.object({
  size: z.nativeEnum(PhotobookSize).optional(),
  coverType: z.nativeEnum(CoverType).optional(),
});

async function resolveProject(projectId: string, userId: string) {
  return db.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "POST",
    path: `/api/projects/${projectId}/photobook`,
  });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const session = await auth();
  if (!session?.user) {
    logResponse(log, 401, start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const project = await resolveProject(projectId, session.user.id);
    if (!project) {
      logResponse(log, 404, start, { projectId });
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const existing = await db.photobook.findUnique({
      where: { projectId },
      select: { id: true },
    });
    if (existing) {
      logResponse(log, 409, start, { photobookId: existing.id });
      return NextResponse.json(
        { error: "Photobook already exists for this project" },
        { status: 409 }
      );
    }

    const photos = await db.photo.findMany({
      where: { projectId },
      select: { id: true },
      orderBy: { uploadedAt: "asc" },
    });

    const photobook = await db.photobook.create({
      data: {
        projectId,
        title: "My Photobook",
        pageCount: photos.length,
        pages: {
          create: photos.map((p, i) => ({
            pageNumber: i + 1,
            photoId: p.id,
            layout: { type: "single", photoId: p.id },
          })),
        },
      },
      select: {
        id: true,
        title: true,
        size: true,
        coverType: true,
        pageCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logResponse(log, 201, start, { photobookId: photobook.id });
    return NextResponse.json(photobook, { status: 201 });
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "GET",
    path: `/api/projects/${projectId}/photobook`,
  });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const session = await auth();
  if (!session?.user) {
    logResponse(log, 401, start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const project = await resolveProject(projectId, session.user.id);
    if (!project) {
      logResponse(log, 404, start, { projectId });
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [photobook, projectPhotos] = await Promise.all([
      db.photobook.findUnique({
        where: { projectId },
        select: {
          id: true,
          title: true,
          size: true,
          coverType: true,
          pageCount: true,
          createdAt: true,
          updatedAt: true,
          pages: {
            select: { id: true, pageNumber: true, photoId: true, layout: true },
            orderBy: { pageNumber: "asc" },
          },
        },
      }),
      db.photo.findMany({
        where: { projectId },
        select: { id: true, storageKey: true, fileName: true },
      }),
    ]);

    if (!photobook) {
      logResponse(log, 404, start, { projectId });
      return NextResponse.json({ error: "Photobook not found" }, { status: 404 });
    }

    const photoMap = new Map(
      projectPhotos.map((p) => [p.id, { ...p, url: storage.getUrl(p.storageKey) }])
    );

    const pages = photobook.pages.map((page) => ({
      ...page,
      photo: page.photoId ? (photoMap.get(page.photoId) ?? null) : null,
    }));

    logResponse(log, 200, start, { photobookId: photobook.id });
    return NextResponse.json({ ...photobook, pages });
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "PUT",
    path: `/api/projects/${projectId}/photobook`,
  });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const session = await auth();
  if (!session?.user) {
    logResponse(log, 401, start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const project = await resolveProject(projectId, session.user.id);
    if (!project) {
      logResponse(log, 404, start, { projectId });
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updatePhotobookSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.flatten().fieldErrors;
      logResponse(log, 400, start, { details });
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    const photobook = await db.photobook.update({
      where: { projectId },
      data: parsed.data,
      select: {
        id: true,
        title: true,
        size: true,
        coverType: true,
        pageCount: true,
        updatedAt: true,
      },
    });

    logResponse(log, 200, start, { photobookId: photobook.id });
    return NextResponse.json(photobook);
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
