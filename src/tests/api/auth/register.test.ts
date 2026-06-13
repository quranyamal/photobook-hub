import { POST } from "@/app/api/auth/register/route";

jest.mock("@/server/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
  compare: jest.fn(),
}));

import { db } from "@/server/db";

const mockFindUnique = db.user.findUnique as jest.Mock;
const mockCreate = db.user.create as jest.Mock;

const makeRequest = (body: unknown) =>
  new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const validUser = {
  id: "user_01",
  email: "jane@example.com",
  name: "Jane Doe",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFindUnique.mockResolvedValue(null);
  mockCreate.mockResolvedValue(validUser);
});

describe("POST /api/auth/register", () => {
  describe("success", () => {
    it("returns 201 with user data on valid registration", async () => {
      const res = await POST(makeRequest({ email: "jane@example.com", password: "securepass", name: "Jane Doe" }));

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBe("user_01");
      expect(body.email).toBe("jane@example.com");
      expect(body.name).toBe("Jane Doe");
      expect(body.createdAt).toBeDefined();
    });

    it("does not expose hashedPassword in the response", async () => {
      const res = await POST(makeRequest({ email: "jane@example.com", password: "securepass" }));

      const body = await res.json();
      expect(body).not.toHaveProperty("hashedPassword");
      expect(body).not.toHaveProperty("password");
    });

    it("accepts registration without an optional name", async () => {
      mockCreate.mockResolvedValue({ ...validUser, name: null });

      const res = await POST(makeRequest({ email: "jane@example.com", password: "securepass" }));

      expect(res.status).toBe(201);
    });
  });

  describe("validation errors (400)", () => {
    it("returns 400 when email is missing", async () => {
      const res = await POST(makeRequest({ password: "securepass" }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Validation failed");
      expect(body.details.email).toBeDefined();
    });

    it("returns 400 when password is missing", async () => {
      const res = await POST(makeRequest({ email: "jane@example.com" }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Validation failed");
      expect(body.details.password).toBeDefined();
    });

    it("returns 400 when email format is invalid", async () => {
      const res = await POST(makeRequest({ email: "not-an-email", password: "securepass" }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.details.email).toBeDefined();
    });

    it("returns 400 when password is shorter than 8 characters", async () => {
      const res = await POST(makeRequest({ email: "jane@example.com", password: "short" }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.details.password).toBeDefined();
    });

    it("returns 400 when request body is empty", async () => {
      const res = await POST(makeRequest({}));

      expect(res.status).toBe(400);
    });
  });

  describe("conflict (409)", () => {
    it("returns 409 when email is already registered", async () => {
      mockFindUnique.mockResolvedValue(validUser);

      const res = await POST(makeRequest({ email: "jane@example.com", password: "securepass" }));

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe("Email already registered");
    });
  });
});
