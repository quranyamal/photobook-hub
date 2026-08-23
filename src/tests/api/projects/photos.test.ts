jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    project: { findFirst: jest.fn() },
    photo: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
  },
}));

jest.mock("@/server/storage", () => ({
  storage: {
    upload: jest.fn().mockResolvedValue(undefined),
    getUrl: jest.fn((key: string) => `/api/files/${key}`),
    delete: jest.fn().mockResolvedValue(undefined),
  },
}));

import { POST, GET } from "@/app/api/projects/[id]/photos/route";
import { DELETE } from "@/app/api/projects/[id]/photos/[photoId]/route";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { storage } from "@/server/storage";

const mockAuth = auth as jest.Mock;
const mockProjectFindFirst = db.project.findFirst as jest.Mock;
const mockPhotoCreate = db.photo.create as jest.Mock;
const mockPhotoFindMany = db.photo.findMany as jest.Mock;
const mockPhotoFindFirst = db.photo.findFirst as jest.Mock;
const mockPhotoDelete = db.photo.delete as jest.Mock;
const mockStorageUpload = storage.upload as jest.Mock;
const mockStorageDelete = storage.delete as jest.Mock;

const authedSession = { user: { id: "user_01", email: "a@b.com" } };
const project = { id: "proj_01" };

const makePhotoRequest = (
  fileName = "photo.jpg",
  size = 1024,
  mimeType = "image/jpeg"
) => {
  const file = new File([new Uint8Array(size)], fileName, { type: mimeType });
  const formData = new FormData();
  formData.append("file", file);
  return new Request("http://localhost/api/projects/proj_01/photos", {
    method: "POST",
    body: formData,
  });
};

const photosParams = { params: Promise.resolve({ id: "proj_01" }) };
const photoParams = (photoId: string) => ({
  params: Promise.resolve({ id: "proj_01", photoId }),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue(authedSession);
  mockProjectFindFirst.mockResolvedValue(project);
});

// ── POST /api/projects/[id]/photos ───────────────────────────────────────────

describe("POST /api/projects/[id]/photos", () => {
  const createdPhoto = {
    id: "photo_01",
    fileName: "photo.jpg",
    storageKey: "projects/proj_01/photos/abc.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1024,
    width: null,
    height: null,
    uploadedAt: new Date("2026-01-01"),
  };

  beforeEach(() => mockPhotoCreate.mockResolvedValue(createdPhoto));

  it("returns 201 with photo and url on valid JPEG upload", async () => {
    const res = await POST(makePhotoRequest(), photosParams);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("photo_01");
    expect(body.url).toMatch(/^\/api\/files\//);
  });

  it("returns 201 on valid PNG upload", async () => {
    const res = await POST(makePhotoRequest("photo.png", 1024, "image/png"), photosParams);
    expect(res.status).toBe(201);
  });

  it("calls storage.upload with the file buffer", async () => {
    await POST(makePhotoRequest(), photosParams);
    expect(mockStorageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^projects\/proj_01\/photos\/.+\.jpg$/),
      expect.any(Buffer),
      "image/jpeg"
    );
  });

  it("returns 400 when no file is provided", async () => {
    const req = new Request("http://localhost/api/projects/proj_01/photos", {
      method: "POST",
      body: new FormData(),
    });
    const res = await POST(req, photosParams);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/no file/i);
  });

  it("returns 400 for unsupported file type (GIF)", async () => {
    const res = await POST(makePhotoRequest("anim.gif", 1024, "image/gif"), photosParams);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid file type/i);
  });

  it("returns 400 when file exceeds 20 MB", async () => {
    const res = await POST(
      makePhotoRequest("big.jpg", 21 * 1024 * 1024, "image/jpeg"),
      photosParams
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/too large/i);
  });

  it("returns 404 when project does not exist", async () => {
    mockProjectFindFirst.mockResolvedValue(null);
    const res = await POST(makePhotoRequest(), photosParams);
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makePhotoRequest(), photosParams);
    expect(res.status).toBe(401);
  });
});

// ── GET /api/projects/[id]/photos ────────────────────────────────────────────

describe("GET /api/projects/[id]/photos", () => {
  const photos = [
    {
      id: "photo_01",
      fileName: "photo.jpg",
      storageKey: "projects/proj_01/photos/abc.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      width: null,
      height: null,
      uploadedAt: new Date("2026-01-01"),
    },
  ];

  beforeEach(() => mockPhotoFindMany.mockResolvedValue(photos));

  it("returns 200 with photos and urls", async () => {
    const res = await GET(
      new Request("http://localhost/api/projects/proj_01/photos"),
      photosParams
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].url).toBe("/api/files/projects/proj_01/photos/abc.jpg");
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/projects/proj_01/photos"),
      photosParams
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when project does not exist", async () => {
    mockProjectFindFirst.mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/projects/proj_01/photos"),
      photosParams
    );
    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/projects/[id]/photos/[photoId] ───────────────────────────────

describe("DELETE /api/projects/[id]/photos/[photoId]", () => {
  const photo = { id: "photo_01", storageKey: "projects/proj_01/photos/abc.jpg" };

  beforeEach(() => mockPhotoFindFirst.mockResolvedValue(photo));

  it("returns 204 on successful deletion", async () => {
    const res = await DELETE(
      new Request("http://localhost/api/projects/proj_01/photos/photo_01", {
        method: "DELETE",
      }),
      photoParams("photo_01")
    );
    expect(res.status).toBe(204);
  });

  it("deletes the file from storage and the DB record", async () => {
    await DELETE(
      new Request("http://localhost/api/projects/proj_01/photos/photo_01", {
        method: "DELETE",
      }),
      photoParams("photo_01")
    );
    expect(mockStorageDelete).toHaveBeenCalledWith("projects/proj_01/photos/abc.jpg");
    expect(mockPhotoDelete).toHaveBeenCalledWith({ where: { id: "photo_01" } });
  });

  it("returns 404 when photo does not exist", async () => {
    mockPhotoFindFirst.mockResolvedValue(null);
    const res = await DELETE(
      new Request("http://localhost/api/projects/proj_01/photos/bad_id", {
        method: "DELETE",
      }),
      photoParams("bad_id")
    );
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(
      new Request("http://localhost/api/projects/proj_01/photos/photo_01", {
        method: "DELETE",
      }),
      photoParams("photo_01")
    );
    expect(res.status).toBe(401);
  });
});
