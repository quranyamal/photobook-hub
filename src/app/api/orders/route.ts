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
import {
  getSubtotalCents,
  SHIPPING_COST_CENTS,
} from "@/config/pricing";
import type { PhotobookSize, CoverType } from "@/generated/prisma/enums";

const createOrderSchema = z.object({
  photobookId: z.string().min(1),
  recipientName: z.string().min(1, "Recipient name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  addressLine: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
});

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PBH-${ts}-${rand}`;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, { method: "POST", path: "/api/orders" });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const session = await auth();
  if (!session?.user) {
    logResponse(log, 401, start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.flatten().fieldErrors;
      logResponse(log, 400, start, { details });
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    const { photobookId, ...address } = parsed.data;

    // Verify photobook belongs to this user
    const photobook = await db.photobook.findFirst({
      where: { id: photobookId, project: { userId: session.user.id } },
      select: { id: true, size: true, coverType: true, pageCount: true },
    });
    if (!photobook) {
      logResponse(log, 404, start, { photobookId });
      return NextResponse.json({ error: "Photobook not found" }, { status: 404 });
    }

    const subtotalCents = getSubtotalCents(
      photobook.size as PhotobookSize,
      photobook.coverType as CoverType
    );
    const shippingCents = SHIPPING_COST_CENTS;
    const totalCents = subtotalCents + shippingCents;

    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session.user.id,
        subtotal: subtotalCents / 100,
        shippingCost: shippingCents / 100,
        totalAmount: totalCents / 100,
        ...address,
        items: {
          create: {
            photobookId,
            quantity: 1,
            unitPrice: subtotalCents / 100,
          },
        },
        payment: {
          create: {
            amount: totalCents / 100,
          },
        },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subtotal: true,
        shippingCost: true,
        totalAmount: true,
        createdAt: true,
      },
    });

    logResponse(log, 201, start, { orderId: order.id });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, { method: "GET", path: "/api/orders" });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const session = await auth();
  if (!session?.user) {
    logResponse(log, 401, start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await db.order.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        payment: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    logResponse(log, 200, start, { count: orders.length });
    return NextResponse.json(orders);
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
