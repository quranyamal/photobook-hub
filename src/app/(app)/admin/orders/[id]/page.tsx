import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/generated/prisma/enums";
import { formatPrice } from "@/config/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOrderClient } from "./_components/admin-order-client";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

const STATUS_CLASS: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-700",
  IN_PRODUCTION: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-muted text-muted-foreground",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session) redirect("/login");
  if (session.user.role !== UserRole.ADMIN) redirect("/dashboard");

  const t = getDictionary(locale);
  const { id } = await params;

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
      user: { select: { name: true, email: true } },
      payment: { select: { status: true, referenceCode: true, paidAt: true } },
    },
  });

  if (!order) notFound();

  const dateLocale = locale === "ar" ? "ar-SA" : locale === "id" ? "id-ID" : "en-US";

  const payment = order.payment
    ? {
        status: order.payment.status,
        referenceCode: order.payment.referenceCode,
        paidAt: order.payment.paidAt?.toISOString() ?? null,
      }
    : null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t.adminOrders.backToOrders}
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold tracking-tight font-mono">{order.orderNumber}</h1>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASS[order.status] ?? "bg-muted text-muted-foreground"}`}>
            {t.orderStatus[order.status as keyof typeof t.orderStatus] ?? order.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {t.adminOrders.placed}{" "}
          {order.createdAt.toLocaleDateString(dateLocale, { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.adminOrders.customerShipping.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.adminOrders.customerShipping.customer}</span>
            <span className="text-right">
              {order.user.name ?? "—"}
              <br />
              <span className="text-xs text-muted-foreground">{order.user.email}</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.adminOrders.customerShipping.recipient}</span>
            <span>{order.recipientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.adminOrders.customerShipping.phone}</span>
            <span>{order.phoneNumber}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground shrink-0">{t.adminOrders.customerShipping.address}</span>
            <span className="text-right">
              {order.addressLine}
              <br />
              {order.city}, {order.province} {order.postalCode}
            </span>
          </div>
          <div className="border-t pt-3 mt-1 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.adminOrders.customerShipping.subtotal}</span>
              <span>{formatPrice(Number(order.subtotal) * 100)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.adminOrders.customerShipping.shipping}</span>
              <span>{formatPrice(Number(order.shippingCost) * 100)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>{t.adminOrders.customerShipping.total}</span>
              <span>{formatPrice(Number(order.totalAmount) * 100)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminOrderClient orderId={id} orderStatus={order.status} payment={payment} />
    </div>
  );
}
