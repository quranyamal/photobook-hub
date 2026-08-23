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

const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, { method: "POST", path: "/api/projects" });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const session = await auth();
  if (!session?.user) {
    logResponse(log, 401, start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.flatten().fieldErrors;
      logResponse(log, 400, start, { details });
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    const project = await db.project.create({
      data: { userId: session.user.id, title: parsed.data.title },
      select: { id: true, title: true, status: true, createdAt: true, updatedAt: true },
    });

    logResponse(log, 201, start, { projectId: project.id });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, { method: "GET", path: "/api/projects" });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const session = await auth();
  if (!session?.user) {
    logResponse(log, 401, start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await db.project.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    logResponse(log, 200, start, { count: projects.length });
    return NextResponse.json(projects);
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
