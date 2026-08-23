import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  createRequestLogger,
  getRequestId,
  tagActiveSpan,
  logResponse,
} from "@/lib/request-logger";

const paymentSchema = z.object({
  referenceCode: z.string().min(1, "Reference code is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "POST",
    path: `/api/orders/${orderId}/payment`,
  });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const session = await auth();
  if (!session?.user) {
    logResponse(log, 401, start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const order = await db.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      select: { id: true, status: true, payment: { select: { id: true, status: true } } },
    });

    if (!order) {
      logResponse(log, 404, start, { orderId });
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING_PAYMENT") {
      logResponse(log, 409, start, { orderId, status: order.status });
      return NextResponse.json(
        { error: "Order is not awaiting payment" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.flatten().fieldErrors;
      logResponse(log, 400, start, { details });
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    await db.$transaction([
      db.payment.update({
        where: { orderId },
        data: {
          referenceCode: parsed.data.referenceCode,
          status: "AWAITING",
        },
      }),
      db.order.update({
        where: { id: orderId },
        data: { status: "PENDING_PAYMENT" },
      }),
    ]);

    logResponse(log, 200, start, { orderId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
