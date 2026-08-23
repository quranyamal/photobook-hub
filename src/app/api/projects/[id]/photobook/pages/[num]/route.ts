import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  createRequestLogger,
  getRequestId,
  tagActiveSpan,
  logResponse,
} from "@/lib/request-logger";

const updatePageSchema = z.object({
  photoId: z.string().nullable(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; num: string }> }
) {
  const { id: projectId, num } = await params;
  const pageNumber = parseInt(num, 10);
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "PUT",
    path: `/api/projects/${projectId}/photobook/pages/${num}`,
  });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const session = await auth();
  if (!session?.user) {
    logResponse(log, 401, start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(pageNumber) || pageNumber < 1) {
    logResponse(log, 400, start);
    return NextResponse.json({ error: "Invalid page number" }, { status: 400 });
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

    const photobook = await db.photobook.findUnique({
      where: { projectId },
      select: { id: true },
    });
    if (!photobook) {
      logResponse(log, 404, start, { projectId });
      return NextResponse.json({ error: "Photobook not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updatePageSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.flatten().fieldErrors;
      logResponse(log, 400, start, { details });
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    const page = await db.photobookPage.updateMany({
      where: { photobookId: photobook.id, pageNumber },
      data: {
        photoId: parsed.data.photoId,
        layout: { type: "single", photoId: parsed.data.photoId },
      },
    });

    if (page.count === 0) {
      logResponse(log, 404, start, { pageNumber });
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    logResponse(log, 200, start, { photobookId: photobook.id, pageNumber });
    return NextResponse.json({ photobookId: photobook.id, pageNumber, ...parsed.data });
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
