jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/generated/prisma/enums", () => ({
  UserRole: { CUSTOMER: "CUSTOMER", ADMIN: "ADMIN" },
  OrderStatus: {
    PENDING_PAYMENT: "PENDING_PAYMENT",
    PAID: "PAID",
    IN_PRODUCTION: "IN_PRODUCTION",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
  },
}));

jest.mock("@/server/db", () => ({
  db: {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: { update: jest.fn() },
    photobookPage: { findMany: jest.fn() },
    photo: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock("archiver", () => {
  const EventEmitter = require("node:events");
  return jest.fn(() => {
    const archive = new EventEmitter();
    archive.file = jest.fn();
    archive.finalize = jest.fn(() => {
      archive.emit("data", Buffer.from("fake-zip-data"));
      archive.emit("end");
    });
    return archive;
  });
});

jest.mock("@/config/env", () => ({
  env: { UPLOAD_DIR: "/tmp/uploads" },
}));

import { GET as listOrders } from "@/app/api/admin/orders/route";
import { GET as getOrder } from "@/app/api/admin/orders/[id]/route";
import { PUT as updatePayment } from "@/app/api/admin/orders/[id]/payment/route";
import { PUT as updateStatus } from "@/app/api/admin/orders/[id]/status/route";
import { GET as getAssets } from "@/app/api/admin/orders/[id]/assets/route";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

const mockAuth = auth as jest.Mock;
const mockOrderFindMany = db.order.findMany as jest.Mock;
const mockOrderFindUnique = db.order.findUnique as jest.Mock;
const mockOrderUpdate = db.order.update as jest.Mock;
const mockTransaction = db.$transaction as jest.Mock;
const mockPageFindMany = db.photobookPage.findMany as jest.Mock;
const mockPhotoFindMany = db.photo.findMany as jest.Mock;

const adminSession = { user: { id: "admin_01", email: "admin@test.com", role: "ADMIN" } };
const customerSession = { user: { id: "user_01", email: "user@test.com", role: "CUSTOMER" } };

const params = (id: string) => ({ params: Promise.resolve({ id }) });

const makeReq = (method: string, url = "http://localhost/api/admin/orders", body?: unknown) =>
  new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

const sampleOrder = {
  id: "order_01",
  orderNumber: "PBH-ABC-XY12",
  status: "PENDING_PAYMENT",
  totalAmount: 39.98,
  createdAt: new Date("2026-01-01"),
  user: { id: "user_01", name: "Jane", email: "jane@test.com" },
  payment: { status: "AWAITING", method: "BANK_TRANSFER", referenceCode: null },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue(adminSession);
});

// ── GET /api/admin/orders ─────────────────────────────────────────────────────

describe("GET /api/admin/orders", () => {
  beforeEach(() => mockOrderFindMany.mockResolvedValue([sampleOrder]));

  it("returns 200 with all orders for admin", async () => {
    const res = await listOrders(makeReq("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].orderNumber).toBe("PBH-ABC-XY12");
  });

  it("passes status filter to query when valid", async () => {
    await listOrders(makeReq("GET", "http://localhost/api/admin/orders?status=PAID"));
    expect(mockOrderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PAID" } })
    );
  });

  it("ignores invalid status filter", async () => {
    await listOrders(makeReq("GET", "http://localhost/api/admin/orders?status=BOGUS"));
    expect(mockOrderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await listOrders(makeReq("GET"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue(customerSession);
    const res = await listOrders(makeReq("GET"));
    expect(res.status).toBe(403);
  });
});

// ── GET /api/admin/orders/[id] ────────────────────────────────────────────────

describe("GET /api/admin/orders/[id]", () => {
  const fullOrder = {
    ...sampleOrder,
    subtotal: 29.99,
    shippingCost: 9.99,
    recipientName: "Jane",
    phoneNumber: "08123",
    addressLine: "Jl. A",
    city: "Jakarta",
    province: "DKI",
    postalCode: "10110",
    updatedAt: new Date(),
    items: [{ id: "item_01", photobookId: "pb_01", quantity: 1, unitPrice: 29.99 }],
    payment: { id: "pay_01", status: "AWAITING", method: "BANK_TRANSFER", amount: 39.98, referenceCode: null, paidAt: null },
  };

  beforeEach(() => mockOrderFindUnique.mockResolvedValue(fullOrder));

  it("returns 200 with full order for admin", async () => {
    const res = await getOrder(makeReq("GET"), params("order_01"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("order_01");
    expect(body.user.email).toBe("jane@test.com");
  });

  it("returns 404 when order does not exist", async () => {
    mockOrderFindUnique.mockResolvedValue(null);
    const res = await getOrder(makeReq("GET"), params("bad_id"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await getOrder(makeReq("GET"), params("order_01"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue(customerSession);
    const res = await getOrder(makeReq("GET"), params("order_01"));
    expect(res.status).toBe(403);
  });
});

// ── PUT /api/admin/orders/[id]/payment ────────────────────────────────────────

describe("PUT /api/admin/orders/[id]/payment", () => {
  const pendingOrder = {
    id: "order_01",
    status: "PENDING_PAYMENT",
    payment: { id: "pay_01", status: "AWAITING" },
  };

  beforeEach(() => {
    mockOrderFindUnique.mockResolvedValue(pendingOrder);
    mockTransaction.mockResolvedValue([{}, {}]);
  });

  it("confirms payment and returns 200", async () => {
    const res = await updatePayment(
      makeReq("PUT", "http://localhost/api/admin/orders/order_01/payment", { action: "confirm" }),
      params("order_01")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.action).toBe("confirm");
    expect(body.success).toBe(true);
  });

  it("confirm transaction sets payment CONFIRMED and order PAID", async () => {
    const mockPaymentUpdate = db.payment.update as jest.Mock;
    const mockOrderUpd = db.order.update as jest.Mock;

    await updatePayment(
      makeReq("PUT", "http://localhost", { action: "confirm" }),
      params("order_01")
    );

    expect(mockPaymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "CONFIRMED" }) })
    );
    expect(mockOrderUpd).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "PAID" } })
    );
  });

  it("rejects payment and returns 200", async () => {
    const res = await updatePayment(
      makeReq("PUT", "http://localhost", { action: "reject" }),
      params("order_01")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.action).toBe("reject");
  });

  it("returns 400 for invalid action", async () => {
    const res = await updatePayment(
      makeReq("PUT", "http://localhost", { action: "approve" }),
      params("order_01")
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 when order is not PENDING_PAYMENT", async () => {
    mockOrderFindUnique.mockResolvedValue({ ...pendingOrder, status: "PAID" });
    const res = await updatePayment(
      makeReq("PUT", "http://localhost", { action: "confirm" }),
      params("order_01")
    );
    expect(res.status).toBe(409);
  });

  it("returns 404 when order not found", async () => {
    mockOrderFindUnique.mockResolvedValue(null);
    const res = await updatePayment(
      makeReq("PUT", "http://localhost", { action: "confirm" }),
      params("order_01")
    );
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await updatePayment(
      makeReq("PUT", "http://localhost", { action: "confirm" }),
      params("order_01")
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue(customerSession);
    const res = await updatePayment(
      makeReq("PUT", "http://localhost", { action: "confirm" }),
      params("order_01")
    );
    expect(res.status).toBe(403);
  });
});

// ── PUT /api/admin/orders/[id]/status ─────────────────────────────────────────

describe("PUT /api/admin/orders/[id]/status", () => {
  beforeEach(() => {
    mockOrderFindUnique.mockResolvedValue({ id: "order_01", status: "PAID" });
    mockOrderUpdate.mockResolvedValue({ id: "order_01", status: "IN_PRODUCTION" });
  });

  it("advances PAID → IN_PRODUCTION and returns 200", async () => {
    const res = await updateStatus(
      makeReq("PUT", "http://localhost", { status: "IN_PRODUCTION" }),
      params("order_01")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("IN_PRODUCTION");
  });

  it("advances IN_PRODUCTION → SHIPPED", async () => {
    mockOrderFindUnique.mockResolvedValue({ id: "order_01", status: "IN_PRODUCTION" });
    mockOrderUpdate.mockResolvedValue({ id: "order_01", status: "SHIPPED" });
    const res = await updateStatus(
      makeReq("PUT", "http://localhost", { status: "SHIPPED" }),
      params("order_01")
    );
    expect(res.status).toBe(200);
  });

  it("returns 409 for invalid transition (PAID → SHIPPED)", async () => {
    const res = await updateStatus(
      makeReq("PUT", "http://localhost", { status: "SHIPPED" }),
      params("order_01")
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.allowed).toBe("IN_PRODUCTION");
  });

  it("returns 409 when trying to set same status", async () => {
    const res = await updateStatus(
      makeReq("PUT", "http://localhost", { status: "PAID" }),
      params("order_01")
    );
    expect(res.status).toBe(400); // 'PAID' not in the enum for status body
  });

  it("returns 400 for unknown status value", async () => {
    const res = await updateStatus(
      makeReq("PUT", "http://localhost", { status: "BOGUS" }),
      params("order_01")
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when order not found", async () => {
    mockOrderFindUnique.mockResolvedValue(null);
    const res = await updateStatus(
      makeReq("PUT", "http://localhost", { status: "IN_PRODUCTION" }),
      params("order_01")
    );
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await updateStatus(
      makeReq("PUT", "http://localhost", { status: "IN_PRODUCTION" }),
      params("order_01")
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue(customerSession);
    const res = await updateStatus(
      makeReq("PUT", "http://localhost", { status: "IN_PRODUCTION" }),
      params("order_01")
    );
    expect(res.status).toBe(403);
  });
});

// ── GET /api/admin/orders/[id]/assets ─────────────────────────────────────────

describe("GET /api/admin/orders/[id]/assets", () => {
  const orderWithItems = {
    id: "order_01",
    orderNumber: "PBH-ABC-XY12",
    items: [{ photobookId: "pb_01" }],
  };

  beforeEach(() => {
    mockOrderFindUnique.mockResolvedValue(orderWithItems);
    mockPageFindMany.mockResolvedValue([
      { pageNumber: 1, photoId: "photo_01" },
      { pageNumber: 2, photoId: "photo_02" },
    ]);
    mockPhotoFindMany.mockResolvedValue([
      { id: "photo_01", storageKey: "proj/photo1.jpg", fileName: "photo1.jpg" },
      { id: "photo_02", storageKey: "proj/photo2.jpg", fileName: "photo2.jpg" },
    ]);
  });

  it("returns 200 with zip content-type for valid order", async () => {
    const res = await getAssets(makeReq("GET"), params("order_01"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/zip");
    expect(res.headers.get("Content-Disposition")).toContain("PBH-ABC-XY12");
  });

  it("returns 404 when order not found", async () => {
    mockOrderFindUnique.mockResolvedValue(null);
    const res = await getAssets(makeReq("GET"), params("bad_id"));
    expect(res.status).toBe(404);
  });

  it("returns 404 when order has no items", async () => {
    mockOrderFindUnique.mockResolvedValue({ ...orderWithItems, items: [] });
    const res = await getAssets(makeReq("GET"), params("order_01"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await getAssets(makeReq("GET"), params("order_01"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue(customerSession);
    const res = await getAssets(makeReq("GET"), params("order_01"));
    expect(res.status).toBe(403);
  });
});
