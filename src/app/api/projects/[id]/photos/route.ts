import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { storage } from "@/server/storage";
import {
  createRequestLogger,
  getRequestId,
  tagActiveSpan,
  logResponse,
} from "@/lib/request-logger";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
};
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "POST",
    path: `/api/projects/${projectId}/photos`,
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
    const project = await db.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true },
    });
    if (!project) {
      logResponse(log, 404, start, { projectId });
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      logResponse(log, 400, start);
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      logResponse(log, 400, start, { mimeType: file.type });
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG and PNG are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      logResponse(log, 400, start, { sizeBytes: file.size });
      return NextResponse.json(
        { error: "File too large. Maximum size is 20 MB." },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXT[file.type];
    const storageKey = `projects/${projectId}/photos/${crypto.randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await storage.upload(storageKey, buffer, file.type);

    const photo = await db.photo.create({
      data: {
        projectId,
        fileName: file.name,
        storageKey,
        mimeType: file.type,
        sizeBytes: file.size,
      },
      select: {
        id: true,
        fileName: true,
        storageKey: true,
        mimeType: true,
        sizeBytes: true,
        width: true,
        height: true,
        uploadedAt: true,
      },
    });

    const responseBody = { ...photo, url: storage.getUrl(storageKey) };
    logResponse(log, 201, start, { photoId: photo.id });
    return NextResponse.json(responseBody, { status: 201 });
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
    path: `/api/projects/${projectId}/photos`,
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
    const project = await db.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true },
    });
    if (!project) {
      logResponse(log, 404, start, { projectId });
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const photos = await db.photo.findMany({
      where: { projectId },
      select: {
        id: true,
        fileName: true,
        storageKey: true,
        mimeType: true,
        sizeBytes: true,
        width: true,
        height: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: "asc" },
    });

    const responseBody = photos.map((p) => ({ ...p, url: storage.getUrl(p.storageKey) }));
    logResponse(log, 200, start, { count: photos.length });
    return NextResponse.json(responseBody);
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
