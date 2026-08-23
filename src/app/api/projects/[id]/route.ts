import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  createRequestLogger,
  getRequestId,
  tagActiveSpan,
  logResponse,
} from "@/lib/request-logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, { method: "GET", path: `/api/projects/${id}` });
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
      where: { id, userId: session.user.id },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        photos: {
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
        },
      },
    });

    if (!project) {
      logResponse(log, 404, start, { projectId: id });
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    logResponse(log, 200, start, { projectId: id });
    return NextResponse.json(project);
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
