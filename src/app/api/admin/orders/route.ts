import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/server/db";
import {
  createRequestLogger,
  getRequestId,
  tagActiveSpan,
  logResponse,
} from "@/lib/request-logger";
import { OrderStatus } from "@/generated/prisma/enums";

const VALID_STATUSES = new Set<string>(Object.values(OrderStatus));

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, { method: "GET", path: "/api/admin/orders" });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const statusFilter =
      statusParam && VALID_STATUSES.has(statusParam)
        ? (statusParam as OrderStatus)
        : null;

    const orders = await db.order.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        payment: { select: { status: true, method: true, referenceCode: true } },
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
