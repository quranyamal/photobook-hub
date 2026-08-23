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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id: projectId, photoId } = await params;
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "DELETE",
    path: `/api/projects/${projectId}/photos/${photoId}`,
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
    const photo = await db.photo.findFirst({
      where: { id: photoId, project: { id: projectId, userId: session.user.id } },
      select: { id: true, storageKey: true },
    });

    if (!photo) {
      logResponse(log, 404, start, { photoId });
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    await storage.delete(photo.storageKey);
    await db.photo.delete({ where: { id: photoId } });

    logResponse(log, 204, start, { photoId });
    return new Response(null, { status: 204 });
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
