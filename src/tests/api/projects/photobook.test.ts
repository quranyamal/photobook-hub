jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    project: { findFirst: jest.fn() },
    photo: { findMany: jest.fn() },
    photobook: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    photobookPage: { updateMany: jest.fn() },
  },
}));

jest.mock("@/server/storage", () => ({
  storage: { getUrl: jest.fn((key: string) => `/api/files/${key}`) },
}));

import { POST, GET, PUT } from "@/app/api/projects/[id]/photobook/route";
import { PUT as putPage } from "@/app/api/projects/[id]/photobook/pages/[num]/route";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

const mockAuth = auth as jest.Mock;
const mockProjectFindFirst = db.project.findFirst as jest.Mock;
const mockPhotoFindMany = db.photo.findMany as jest.Mock;
const mockPhotobookFindUnique = db.photobook.findUnique as jest.Mock;
const mockPhotobookCreate = db.photobook.create as jest.Mock;
const mockPhotobookUpdate = db.photobook.update as jest.Mock;
const mockPageUpdateMany = db.photobookPage.updateMany as jest.Mock;

const authedSession = { user: { id: "user_01", email: "a@b.com" } };
const project = { id: "proj_01" };

const makeReq = (method: string, body?: unknown) =>
  new Request("http://localhost/api/projects/proj_01/photobook", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

const photobookParams = { params: Promise.resolve({ id: "proj_01" }) };
const pageParams = (num: string) =>
  ({ params: Promise.resolve({ id: "proj_01", num }) });

const photobook = {
  id: "pb_01",
  title: "My Photobook",
  size: "A4",
  coverType: "SOFTCOVER",
  pageCount: 2,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue(authedSession);
  mockProjectFindFirst.mockResolvedValue(project);
  mockPhotobookFindUnique.mockResolvedValue(null);
  mockPhotoFindMany.mockResolvedValue([
    { id: "photo_01" },
    { id: "photo_02" },
  ]);
  mockPhotobookCreate.mockResolvedValue(photobook);
});

// ── POST /api/projects/[id]/photobook ────────────────────────────────────────

describe("POST /api/projects/[id]/photobook", () => {
  it("returns 201 and creates photobook with pages from project photos", async () => {
    const res = await POST(makeReq("POST"), photobookParams);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("pb_01");
    expect(body.pageCount).toBe(2);
  });

  it("creates one page per photo in upload order", async () => {
    await POST(makeReq("POST"), photobookParams);
    expect(mockPhotobookCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pageCount: 2,
          pages: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({ pageNumber: 1, photoId: "photo_01" }),
              expect.objectContaining({ pageNumber: 2, photoId: "photo_02" }),
            ]),
          }),
        }),
      })
    );
  });

  it("returns 409 when photobook already exists", async () => {
    mockPhotobookFindUnique.mockResolvedValue({ id: "pb_01" });
    const res = await POST(makeReq("POST"), photobookParams);
    expect(res.status).toBe(409);
  });

  it("returns 404 when project not found", async () => {
    mockProjectFindFirst.mockResolvedValue(null);
    const res = await POST(makeReq("POST"), photobookParams);
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeReq("POST"), photobookParams);
    expect(res.status).toBe(401);
  });
});

// ── GET /api/projects/[id]/photobook ────────────────────────────────────────

describe("GET /api/projects/[id]/photobook", () => {
  const photobookWithPages = {
    ...photobook,
    pages: [
      {
        id: "page_01",
        pageNumber: 1,
        photoId: "photo_01",
        layout: { type: "single", photoId: "photo_01" },
      },
    ],
  };

  beforeEach(() => {
    mockPhotobookFindUnique.mockResolvedValue(photobookWithPages);
    mockPhotoFindMany.mockResolvedValue([
      { id: "photo_01", storageKey: "projects/p/photos/a.jpg", fileName: "a.jpg" },
    ]);
  });

  it("returns 200 with photobook and pages", async () => {
    const res = await GET(makeReq("GET"), photobookParams);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("pb_01");
    expect(body.pages).toHaveLength(1);
    expect(body.pages[0].photo.url).toMatch(/^\/api\/files\//);
  });

  it("returns 404 when photobook not found", async () => {
    mockPhotobookFindUnique.mockResolvedValue(null);
    const res = await GET(makeReq("GET"), photobookParams);
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeReq("GET"), photobookParams);
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/projects/[id]/photobook ────────────────────────────────────────

describe("PUT /api/projects/[id]/photobook", () => {
  beforeEach(() =>
    mockPhotobookUpdate.mockResolvedValue({ ...photobook, size: "A5" })
  );

  it("returns 200 with updated photobook", async () => {
    const res = await PUT(makeReq("PUT", { size: "A5" }), photobookParams);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.size).toBe("A5");
  });

  it("returns 400 for invalid size value", async () => {
    const res = await PUT(makeReq("PUT", { size: "INVALID" }), photobookParams);
    expect(res.status).toBe(400);
  });

  it("returns 404 when project not found", async () => {
    mockProjectFindFirst.mockResolvedValue(null);
    const res = await PUT(makeReq("PUT", { size: "A5" }), photobookParams);
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(makeReq("PUT", { size: "A5" }), photobookParams);
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/projects/[id]/photobook/pages/[num] ─────────────────────────────

describe("PUT /api/projects/[id]/photobook/pages/[num]", () => {
  beforeEach(() => {
    mockPhotobookFindUnique.mockResolvedValue({ id: "pb_01" });
    mockPageUpdateMany.mockResolvedValue({ count: 1 });
  });

  const makePageReq = (body: unknown) =>
    new Request("http://localhost/api/projects/proj_01/photobook/pages/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("returns 200 on valid page update", async () => {
    const res = await putPage(makePageReq({ photoId: "photo_02" }), pageParams("1"));
    expect(res.status).toBe(200);
  });

  it("accepts null photoId to clear a page", async () => {
    const res = await putPage(makePageReq({ photoId: null }), pageParams("1"));
    expect(res.status).toBe(200);
  });

  it("returns 404 when page number not found", async () => {
    mockPageUpdateMany.mockResolvedValue({ count: 0 });
    const res = await putPage(makePageReq({ photoId: "photo_02" }), pageParams("99"));
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid page number", async () => {
    const res = await putPage(makePageReq({ photoId: "photo_02" }), pageParams("abc"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await putPage(makePageReq({ photoId: "photo_02" }), pageParams("1"));
    expect(res.status).toBe(401);
  });
});
