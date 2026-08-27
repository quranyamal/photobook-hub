import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/generated/prisma/enums";
import { formatPrice } from "@/config/pricing";

const TABS = [
  { label: "All", value: "" },
  { label: "Pending payment", value: "PENDING_PAYMENT" },
  { label: "Paid", value: "PAID" },
  { label: "In production", value: "IN_PRODUCTION" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  IN_PRODUCTION: "In production",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

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
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== UserRole.ADMIN) redirect("/dashboard");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All customer orders · {orders.length} result{orders.length !== 1 ? "s" : ""}
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
          <p className="text-sm text-muted-foreground">No orders match this filter.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs font-medium underline underline-offset-2"
                    >
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
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASS[order.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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
