// Mock next-auth so NextAuth(authConfig) returns a fake auth wrapper,
// and mock auth.config so the middleware module loads without any imports
// that require Node.js-only modules.
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    auth: jest.fn(
      (handler: (req: unknown) => unknown) => handler
    ),
    handlers: { GET: jest.fn(), POST: jest.fn() },
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));

jest.mock("@/lib/auth.config", () => ({
  authConfig: {},
}));

jest.mock("@/generated/prisma/enums", () => ({
  UserRole: { CUSTOMER: "CUSTOMER", ADMIN: "ADMIN" },
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn().mockReturnValue(true),
}));

import middleware from "@/middleware";
import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const mockCheckRateLimit = checkRateLimit as jest.Mock;

type AuthRequest = NextRequest & { auth: unknown };

const makeReq = (
  pathname: string,
  authenticated: boolean,
  role = "CUSTOMER",
  method = "GET"
): AuthRequest => {
  const req = new NextRequest(`http://localhost${pathname}`, { method }) as AuthRequest;
  req.auth = authenticated ? { user: { id: "u1", email: "a@b.com", role } } : null;
  return req;
};

const invoke = (
  pathname: string,
  authenticated: boolean,
  role = "CUSTOMER",
  method = "GET"
): Response =>
  (middleware as unknown as (req: AuthRequest) => Response)(
    makeReq(pathname, authenticated, role, method)
  );

describe("middleware", () => {
  describe("protected app routes", () => {
    it("redirects unauthenticated /dashboard → /login", () => {
      const res = invoke("/dashboard", false);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("passes authenticated /dashboard through", () => {
      const res = invoke("/dashboard", true);
      expect(res.status).not.toBe(307);
    });

    it("redirects unauthenticated /projects → /login", () => {
      const res = invoke("/projects", false);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("redirects unauthenticated /orders → /login", () => {
      const res = invoke("/orders", false);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });
  });

  describe("public routes", () => {
    it("passes unauthenticated /login through", () => {
      const res = invoke("/login", false);
      expect(res.status).not.toBe(307);
    });

    it("passes unauthenticated /register through", () => {
      const res = invoke("/register", false);
      expect(res.status).not.toBe(307);
    });

    it("passes unauthenticated /api/auth/session through", () => {
      const res = invoke("/api/auth/session", false);
      expect(res.status).not.toBe(307);
    });
  });

  describe("admin routes", () => {
    it("redirects unauthenticated /admin → /login", () => {
      const res = invoke("/admin", false);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    });

    it("redirects authenticated CUSTOMER /admin → /dashboard", () => {
      const res = invoke("/admin", true, "CUSTOMER");
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/dashboard");
    });

    it("redirects authenticated CUSTOMER /admin/orders → /dashboard", () => {
      const res = invoke("/admin/orders", true, "CUSTOMER");
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/dashboard");
    });

    it("passes authenticated ADMIN /admin through", () => {
      const res = invoke("/admin", true, "ADMIN");
      expect(res.status).not.toBe(307);
    });

    it("passes authenticated ADMIN /admin/orders through", () => {
      const res = invoke("/admin/orders", true, "ADMIN");
      expect(res.status).not.toBe(307);
    });
  });

  describe("rate limiting on auth POST endpoints", () => {
    beforeEach(() => mockCheckRateLimit.mockReturnValue(true));

    it("returns 429 on POST /api/auth/register when rate limit exceeded", () => {
      mockCheckRateLimit.mockReturnValueOnce(false);
      const res = invoke("/api/auth/register", false, "CUSTOMER", "POST");
      expect(res.status).toBe(429);
    });

    it("returns 429 on POST /api/auth/callback/credentials when rate limit exceeded", () => {
      mockCheckRateLimit.mockReturnValueOnce(false);
      const res = invoke("/api/auth/callback/credentials", false, "CUSTOMER", "POST");
      expect(res.status).toBe(429);
    });

    it("passes POST /api/auth/register through when under limit", () => {
      const res = invoke("/api/auth/register", false, "CUSTOMER", "POST");
      expect(res.status).not.toBe(429);
    });

    it("does not rate-limit GET requests on auth paths", () => {
      mockCheckRateLimit.mockReturnValueOnce(false);
      const res = invoke("/api/auth/register", false, "CUSTOMER", "GET");
      expect(res.status).not.toBe(429);
    });
  });

  describe("x-request-id header", () => {
    it("is set on authenticated app route responses", () => {
      const res = invoke("/dashboard", true);
      expect(res.headers.get("x-request-id")).toBeTruthy();
    });

    it("is set on public route responses", () => {
      const res = invoke("/login", false);
      expect(res.headers.get("x-request-id")).toBeTruthy();
    });
  });
});
