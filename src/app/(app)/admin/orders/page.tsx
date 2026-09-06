import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/generated/prisma/enums";
import { formatPrice } from "@/config/pricing";
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

const VALID_STATUSES = new Set(["PENDING_PAYMENT", "PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED", "CANCELLED"]);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session) redirect("/login");
  if (session.user.role !== UserRole.ADMIN) redirect("/dashboard");

  const t = getDictionary(locale);

  const { status } = await searchParams;
  const statusFilter = status && VALID_STATUSES.has(status) ? status : null;

  const orders = await db.order.findMany({
    where: statusFilter ? { status: statusFilter as never } : undefined,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      payment: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const dateLocale = locale === "ar" ? "ar-SA" : locale === "id" ? "id-ID" : "en-US";

  const TABS = [
    { label: t.adminOrders.filterAll, value: "" },
    { label: t.orderStatus.PENDING_PAYMENT, value: "PENDING_PAYMENT" },
    { label: t.orderStatus.PAID, value: "PAID" },
    { label: t.orderStatus.IN_PRODUCTION, value: "IN_PRODUCTION" },
    { label: t.orderStatus.SHIPPED, value: "SHIPPED" },
    { label: t.orderStatus.DELIVERED, value: "DELIVERED" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.adminOrders.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {orders.length} {orders.length === 1 ? "result" : "results"}
        </p>
      </div>

      <div className="flex gap-1 flex-wrap">
        {TABS.map((tab) => {
          const href = tab.value ? `/admin/orders?status=${tab.value}` : "/admin/orders";
          const active = (statusFilter ?? "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed p-16 text-center">
          <p className="text-sm text-muted-foreground">{t.adminOrders.noMatch}</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.adminOrders.columns.order}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.adminOrders.columns.customer}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.adminOrders.columns.total}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.adminOrders.columns.status}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.adminOrders.columns.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-medium underline underline-offset-2">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{order.user.name ?? "—"}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">{order.user.email}</span>
                  </td>
                  <td className="px-4 py-3">{formatPrice(Number(order.totalAmount) * 100)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASS[order.status] ?? "bg-muted text-muted-foreground"}`}>
                      {t.orderStatus[order.status as keyof typeof t.orderStatus] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.createdAt.toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
