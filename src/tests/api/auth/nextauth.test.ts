// Mock next-auth before any import that pulls it in transitively
jest.mock("@/lib/auth", () => ({
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
  auth: jest.fn(),
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/auth/[...nextauth]/route";
import { handlers } from "@/lib/auth";

const mockGet = handlers.GET as jest.Mock;
const mockPost = handlers.POST as jest.Mock;

const makeRequest = (path: string, method = "GET") =>
  new NextRequest(`http://localhost/api/auth/${path}`, { method });

beforeEach(() => jest.clearAllMocks());

describe("GET /api/auth/[...nextauth]", () => {
  describe("/api/auth/session", () => {
    it("delegates to the Auth.js GET handler", async () => {
      mockGet.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

      const req = makeRequest("session");
      await GET(req);

      expect(mockGet).toHaveBeenCalledWith(req);
    });

    it("returns 200 with empty session when unauthenticated", async () => {
      mockGet.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

      const res = await GET(makeRequest("session"));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({});
    });
  });

  describe("/api/auth/providers", () => {
    it("delegates to the Auth.js GET handler", async () => {
      const providers = {
        credentials: { id: "credentials", name: "Credentials", type: "credentials" },
      };
      mockGet.mockResolvedValue(new Response(JSON.stringify(providers), { status: 200 }));

      const req = makeRequest("providers");
      await GET(req);

      expect(mockGet).toHaveBeenCalledWith(req);
    });

    it("returns 200 with credentials provider in the list", async () => {
      const providers = {
        credentials: { id: "credentials", name: "Credentials", type: "credentials" },
      };
      mockGet.mockResolvedValue(new Response(JSON.stringify(providers), { status: 200 }));

      const res = await GET(makeRequest("providers"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("credentials");
    });
  });

  describe("/api/auth/csrf", () => {
    it("delegates to the Auth.js GET handler", async () => {
      mockGet.mockResolvedValue(
        new Response(JSON.stringify({ csrfToken: "token_abc" }), { status: 200 })
      );

      const req = makeRequest("csrf");
      await GET(req);

      expect(mockGet).toHaveBeenCalledWith(req);
    });

    it("returns 200 with a csrfToken field", async () => {
      mockGet.mockResolvedValue(
        new Response(JSON.stringify({ csrfToken: "token_abc" }), { status: 200 })
      );

      const res = await GET(makeRequest("csrf"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("csrfToken");
      expect(typeof body.csrfToken).toBe("string");
    });
  });
});

describe("POST /api/auth/[...nextauth]", () => {
  describe("/api/auth/signin", () => {
    it("delegates to the Auth.js POST handler", async () => {
      mockPost.mockResolvedValue(new Response(null, { status: 200 }));

      const req = makeRequest("signin", "POST");
      await POST(req);

      expect(mockPost).toHaveBeenCalledWith(req);
    });
  });

  describe("/api/auth/signout", () => {
    it("delegates to the Auth.js POST handler", async () => {
      mockPost.mockResolvedValue(new Response(null, { status: 200 }));

      const req = makeRequest("signout", "POST");
      await POST(req);

      expect(mockPost).toHaveBeenCalledWith(req);
    });
  });
});
