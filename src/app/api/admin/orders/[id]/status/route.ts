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
import type { OrderStatus } from "@/generated/prisma/enums";

const statusSchema = z.object({
  status: z.enum(["IN_PRODUCTION", "SHIPPED", "DELIVERED"]),
});

// Only forward transitions are permitted
const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: "IN_PRODUCTION",
  IN_PRODUCTION: "SHIPPED",
  SHIPPED: "DELIVERED",
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "PUT",
    path: `/api/admin/orders/${orderId}/status`,
  });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  try {
    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.flatten().fieldErrors;
      logResponse(log, 400, start, { details });
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      logResponse(log, 404, start, { orderId });
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const allowedNext = VALID_TRANSITIONS[order.status as OrderStatus];
    if (allowedNext !== parsed.data.status) {
      logResponse(log, 409, start, {
        orderId,
        current: order.status,
        requested: parsed.data.status,
      });
      return NextResponse.json(
        {
          error: "Invalid status transition",
          current: order.status,
          allowed: allowedNext ?? null,
        },
        { status: 409 }
      );
    }

    const updated = await db.order.update({
      where: { id: orderId },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });

    logResponse(log, 200, start, { orderId, status: updated.status });
    return NextResponse.json(updated);
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
