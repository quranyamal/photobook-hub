jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    photobook: { findFirst: jest.fn() },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    payment: { update: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { POST, GET } from "@/app/api/orders/route";
import { GET as getOrder } from "@/app/api/orders/[id]/route";
import { POST as submitPayment } from "@/app/api/orders/[id]/payment/route";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

const mockAuth = auth as jest.Mock;
const mockPhotobookFindFirst = db.photobook.findFirst as jest.Mock;
const mockOrderCreate = db.order.create as jest.Mock;
const mockOrderFindMany = db.order.findMany as jest.Mock;
const mockOrderFindFirst = db.order.findFirst as jest.Mock;
const mockTransaction = db.$transaction as jest.Mock;

const authedSession = { user: { id: "user_01", email: "a@b.com" } };

const validAddress = {
  photobookId: "pb_01",
  recipientName: "Jane Doe",
  phoneNumber: "08123456789",
  addressLine: "Jl. Sudirman No. 1",
  city: "Jakarta",
  province: "DKI Jakarta",
  postalCode: "10110",
};

const makeReq = (method: string, body?: unknown) =>
  new Request("http://localhost/api/orders", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

const makeIdReq = (id: string, method = "GET", body?: unknown) =>
  new Request(`http://localhost/api/orders/${id}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

const orderParams = (id: string) => ({ params: Promise.resolve({ id }) });

const createdOrder = {
  id: "order_01",
  orderNumber: "PBH-ABC-XY12",
  status: "PENDING_PAYMENT",
  subtotal: 29.99,
  shippingCost: 9.99,
  totalAmount: 39.98,
  createdAt: new Date("2026-01-01"),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue(authedSession);
  mockPhotobookFindFirst.mockResolvedValue({
    id: "pb_01",
    size: "A4",
    coverType: "SOFTCOVER",
    pageCount: 10,
  });
  mockOrderCreate.mockResolvedValue(createdOrder);
});

// ── POST /api/orders ─────────────────────────────────────────────────────────

describe("POST /api/orders", () => {
  it("returns 201 with order on valid checkout", async () => {
    const res = await POST(makeReq("POST", validAddress));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.orderNumber).toBeTruthy();
    expect(body.status).toBe("PENDING_PAYMENT");
  });

  it("creates order with correct pricing (A4 softcover + shipping)", async () => {
    await POST(makeReq("POST", validAddress));
    expect(mockOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 29.99,
          shippingCost: 9.99,
          totalAmount: 39.98,
        }),
      })
    );
  });

  it("returns 400 when required address fields are missing", async () => {
    const res = await POST(makeReq("POST", { photobookId: "pb_01" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 404 when photobook not found", async () => {
    mockPhotobookFindFirst.mockResolvedValue(null);
    const res = await POST(makeReq("POST", validAddress));
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeReq("POST", validAddress));
    expect(res.status).toBe(401);
  });
});

// ── GET /api/orders ──────────────────────────────────────────────────────────

describe("GET /api/orders", () => {
  beforeEach(() =>
    mockOrderFindMany.mockResolvedValue([
      { ...createdOrder, payment: { status: "AWAITING" } },
    ])
  );

  it("returns 200 with list of orders", async () => {
    const res = await GET(makeReq("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].orderNumber).toBeTruthy();
  });

  it("only returns orders for the current user", async () => {
    await GET(makeReq("GET"));
    expect(mockOrderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_01" } })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeReq("GET"));
    expect(res.status).toBe(401);
  });
});

// ── GET /api/orders/[id] ─────────────────────────────────────────────────────

describe("GET /api/orders/[id]", () => {
  const fullOrder = {
    ...createdOrder,
    recipientName: "Jane Doe",
    phoneNumber: "08123456789",
    addressLine: "Jl. Sudirman No. 1",
    city: "Jakarta",
    province: "DKI Jakarta",
    postalCode: "10110",
    items: [{ id: "item_01", photobookId: "pb_01", quantity: 1, unitPrice: 29.99 }],
    payment: { id: "pay_01", status: "AWAITING", method: "BANK_TRANSFER", amount: 39.98, referenceCode: null, paidAt: null },
  };

  beforeEach(() => mockOrderFindFirst.mockResolvedValue(fullOrder));

  it("returns 200 with full order detail", async () => {
    const res = await getOrder(makeIdReq("order_01"), orderParams("order_01"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("order_01");
    expect(body.payment.status).toBe("AWAITING");
  });

  it("returns 404 when order not found", async () => {
    mockOrderFindFirst.mockResolvedValue(null);
    const res = await getOrder(makeIdReq("bad_id"), orderParams("bad_id"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await getOrder(makeIdReq("order_01"), orderParams("order_01"));
    expect(res.status).toBe(401);
  });
});

// ── POST /api/orders/[id]/payment ────────────────────────────────────────────

describe("POST /api/orders/[id]/payment", () => {
  const pendingOrder = {
    id: "order_01",
    status: "PENDING_PAYMENT",
    payment: { id: "pay_01", status: "AWAITING" },
  };

  beforeEach(() => {
    mockOrderFindFirst.mockResolvedValue(pendingOrder);
    mockTransaction.mockResolvedValue([{}, {}]);
  });

  const makePaymentReq = (body: unknown) =>
    new Request("http://localhost/api/orders/order_01/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("returns 200 on valid reference code submission", async () => {
    const res = await submitPayment(
      makePaymentReq({ referenceCode: "TRF-20260101-001" }),
      orderParams("order_01")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 400 when reference code is missing", async () => {
    const res = await submitPayment(
      makePaymentReq({}),
      orderParams("order_01")
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 when order is not pending payment", async () => {
    mockOrderFindFirst.mockResolvedValue({ ...pendingOrder, status: "PAID" });
    const res = await submitPayment(
      makePaymentReq({ referenceCode: "TRF-001" }),
      orderParams("order_01")
    );
    expect(res.status).toBe(409);
  });

  it("returns 404 when order not found", async () => {
    mockOrderFindFirst.mockResolvedValue(null);
    const res = await submitPayment(
      makePaymentReq({ referenceCode: "TRF-001" }),
      orderParams("order_01")
    );
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await submitPayment(
      makePaymentReq({ referenceCode: "TRF-001" }),
      orderParams("order_01")
    );
    expect(res.status).toBe(401);
  });
});
