import { auth } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

type AdminAuthResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.user.role !== UserRole.ADMIN) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, session };
}
