import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/server/db";
import {
  createRequestLogger,
  getRequestId,
  tagActiveSpan,
  logResponse,
} from "@/lib/request-logger";

const paymentActionSchema = z.object({
  action: z.enum(["confirm", "reject"]),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "PUT",
    path: `/api/admin/orders/${orderId}/payment`,
  });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  try {
    const body = await request.json();
    const parsed = paymentActionSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.flatten().fieldErrors;
      logResponse(log, 400, start, { details });
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, payment: { select: { id: true, status: true } } },
    });

    if (!order) {
      logResponse(log, 404, start, { orderId });
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING_PAYMENT") {
      logResponse(log, 409, start, { orderId, status: order.status });
      return NextResponse.json(
        { error: "Order is not awaiting payment confirmation" },
        { status: 409 }
      );
    }

    const { action } = parsed.data;

    if (action === "confirm") {
      await db.$transaction([
        db.payment.update({
          where: { orderId },
          data: { status: "CONFIRMED", paidAt: new Date() },
        }),
        db.order.update({
          where: { id: orderId },
          data: { status: "PAID" },
        }),
      ]);
    } else {
      await db.$transaction([
        db.payment.update({
          where: { orderId },
          data: { status: "FAILED" },
        }),
        // Order stays PENDING_PAYMENT so the customer can resubmit a reference code
      ]);
    }

    logResponse(log, 200, start, { orderId, action });
    return NextResponse.json({ success: true, action });
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
