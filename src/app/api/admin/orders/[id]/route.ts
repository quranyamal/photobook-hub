import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/server/db";
import {
  createRequestLogger,
  getRequestId,
  tagActiveSpan,
  logResponse,
} from "@/lib/request-logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "GET",
    path: `/api/admin/orders/${id}`,
  });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  try {
    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subtotal: true,
        shippingCost: true,
        totalAmount: true,
        recipientName: true,
        phoneNumber: true,
        addressLine: true,
        city: true,
        province: true,
        postalCode: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
        items: {
          select: { id: true, photobookId: true, quantity: true, unitPrice: true },
        },
        payment: {
          select: {
            id: true,
            status: true,
            method: true,
            amount: true,
            referenceCode: true,
            paidAt: true,
          },
        },
      },
    });

    if (!order) {
      logResponse(log, 404, start, { orderId: id });
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    logResponse(log, 200, start, { orderId: id });
    return NextResponse.json(order);
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
