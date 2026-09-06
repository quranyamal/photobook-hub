import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { redirect } from "next/navigation";
import Link from "next/link";
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

export default async function OrdersPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session) redirect("/login");

  const t = getDictionary(locale);

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

  const dateLocale = locale === "ar" ? "ar-SA" : locale === "id" ? "id-ID" : "en-US";

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        {t.orders.backToDashboard}
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.orders.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.orders.subtitle}</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center gap-4">
          <p className="text-sm text-muted-foreground">{t.orders.empty}</p>
          <Link href="/projects" className="text-sm underline underline-offset-4 text-foreground">
            {t.orders.emptyAction}
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.orders.columns.order}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.orders.columns.date}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.orders.columns.total}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.orders.columns.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${order.id}`} className="font-mono text-xs font-medium underline underline-offset-2">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.createdAt.toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">{formatPrice(Number(order.totalAmount) * 100)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASS[order.status] ?? "bg-muted text-muted-foreground"}`}>
                      {t.orderStatus[order.status as keyof typeof t.orderStatus] ?? order.status}
                    </span>
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
