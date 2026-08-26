import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";

const { auth } = NextAuth(authConfig);

const APP_ROUTE = /^\/(dashboard|projects|orders|checkout|admin)(\/|$)/;
const ADMIN_ROUTE = /^\/admin(\/|$)/;

export default auth((req) => {
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

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
