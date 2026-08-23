import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const APP_ROUTE = /^\/(dashboard|projects|orders|checkout)(\/|$)/;

export default auth((req) => {
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  if (APP_ROUTE.test(req.nextUrl.pathname) && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
