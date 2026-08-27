import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { checkRateLimit } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

const APP_ROUTE = /^\/(dashboard|projects|orders|checkout|admin)(\/|$)/;
const ADMIN_ROUTE = /^\/admin(\/|$)/;
// POST endpoints that accept credentials — rate-limited to 10 req/min per IP
const AUTH_WRITE = /^\/api\/auth\/(register|callback\/credentials)$/;

export default auth((req) => {
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  if (req.method === "POST" && AUTH_WRITE.test(req.nextUrl.pathname)) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";
    if (!checkRateLimit(`auth:${ip}`, 10, 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "x-request-id": requestId,
          },
        }
      );
    }
  }

  if (APP_ROUTE.test(req.nextUrl.pathname) && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    ADMIN_ROUTE.test(req.nextUrl.pathname) &&
    req.auth?.user?.role !== UserRole.ADMIN
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
