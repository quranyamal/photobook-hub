import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/server/db";
import {
  createRequestLogger,
  getRequestId,
  tagActiveSpan,
  logResponse,
} from "@/lib/request-logger";
import { withSpan } from "@/lib/tracer";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "POST",
    path: "/api/auth/register",
  });
  const start = Date.now();

  log.info("Incoming request");
  tagActiveSpan(requestId);

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const details = parsed.error.flatten().fieldErrors;
      logResponse(log, 400, start, { details });
      return NextResponse.json(
        { error: "Validation failed", details },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    const existing = await withSpan("db.user.findUnique", () =>
      db.user.findUnique({ where: { email } })
    );

    if (existing) {
      logResponse(log, 409, start, { email });
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await withSpan(
      "db.user.create",
      () =>
        db.user.create({
          data: { email, hashedPassword, name },
          select: { id: true, email: true, name: true, createdAt: true },
        }),
      { "user.email": email }
    );

    logResponse(log, 201, start, { userId: user.id });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, {
      error: { message: err.message, stack: err.stack },
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
