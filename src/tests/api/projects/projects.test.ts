jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

import { POST, GET } from "@/app/api/projects/route";
import { GET as getById } from "@/app/api/projects/[id]/route";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

const mockAuth = auth as jest.Mock;
const mockCreate = db.project.create as jest.Mock;
const mockFindMany = db.project.findMany as jest.Mock;
const mockFindFirst = db.project.findFirst as jest.Mock;

const authedSession = { user: { id: "user_01", email: "a@b.com" } };

const makeRequest = (method: string, body?: unknown) =>
  new Request("http://localhost/api/projects", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

const makeIdRequest = (id: string) =>
  new Request(`http://localhost/api/projects/${id}`);

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue(authedSession);
});

// ── POST /api/projects ───────────────────────────────────────────────────────

describe("POST /api/projects", () => {
  const project = {
    id: "proj_01",
    title: "My Photobook",
    status: "DRAFT",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  beforeEach(() => mockCreate.mockResolvedValue(project));

  it("returns 201 with project on valid creation", async () => {
    const res = await POST(makeRequest("POST", { title: "My Photobook" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("proj_01");
    expect(body.title).toBe("My Photobook");
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest("POST", { title: "X" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when title is missing", async () => {
    const res = await POST(makeRequest("POST", {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body.details.title).toBeDefined();
  });

  it("returns 400 when title is empty", async () => {
    const res = await POST(makeRequest("POST", { title: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when title exceeds 100 characters", async () => {
    const res = await POST(makeRequest("POST", { title: "a".repeat(101) }));
    expect(res.status).toBe(400);
  });
});

// ── GET /api/projects ────────────────────────────────────────────────────────

describe("GET /api/projects", () => {
  const projects = [
    {
      id: "proj_01",
      title: "My Photobook",
      status: "DRAFT",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      _count: { photos: 3 },
    },
  ];

  beforeEach(() => mockFindMany.mockResolvedValue(projects));

  it("returns 200 with list of projects", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("proj_01");
    expect(body[0]._count.photos).toBe(3);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("only queries projects belonging to the current user", async () => {
    await GET(makeRequest("GET"));
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_01" } })
    );
  });
});

// ── GET /api/projects/[id] ───────────────────────────────────────────────────

describe("GET /api/projects/[id]", () => {
  const project = {
    id: "proj_01",
    title: "My Photobook",
    status: "DRAFT",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    photos: [],
  };

  it("returns 200 with project and photos", async () => {
    mockFindFirst.mockResolvedValue(project);
    const res = await getById(makeIdRequest("proj_01"), {
      params: Promise.resolve({ id: "proj_01" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("proj_01");
  });

  it("returns 404 when project not found", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await getById(makeIdRequest("proj_xx"), {
      params: Promise.resolve({ id: "proj_xx" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when project belongs to another user", async () => {
    // findFirst with userId filter returns null for other user's projects
    mockFindFirst.mockResolvedValue(null);
    const res = await getById(makeIdRequest("proj_other"), {
      params: Promise.resolve({ id: "proj_other" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await getById(makeIdRequest("proj_01"), {
      params: Promise.resolve({ id: "proj_01" }),
    });
    expect(res.status).toBe(401);
  });
});
