import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/server/db";
import { createRequestLogger, getRequestId } from "@/lib/request-logger";
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

  log.info("Incoming request");

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    log.warn({ details: parsed.error.flatten().fieldErrors }, "Validation failed");
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password, name } = parsed.data;

  const existing = await withSpan("db.user.findUnique", () =>
    db.user.findUnique({ where: { email } })
  );

  if (existing) {
    log.warn({ email }, "Registration attempt with already registered email");
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

  log.info({ userId: user.id }, "User registered successfully");

  return NextResponse.json(user, { status: 201 });
}
