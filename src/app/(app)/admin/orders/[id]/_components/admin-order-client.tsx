"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n/context";

const NEXT_STATUS: Partial<Record<string, string>> = {
  PAID: "IN_PRODUCTION",
  IN_PRODUCTION: "SHIPPED",
  SHIPPED: "DELIVERED",
};

type Payment = {
  status: string;
  referenceCode: string | null;
  paidAt: string | null;
};

type Props = {
  orderId: string;
  orderStatus: string;
  payment: Payment | null;
};

export function AdminOrderClient({ orderId, orderStatus, payment }: Props) {
  const t = useT();
  const router = useRouter();
  const [paymentLoading, setPaymentLoading] = useState<"confirm" | "reject" | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatus = NEXT_STATUS[orderStatus];
  const nextStatusLabel = nextStatus
    ? t.orderStatus[nextStatus as keyof typeof t.orderStatus]
    : undefined;

  const handlePaymentAction = async (action: "confirm" | "reject") => {
    setPaymentLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to update payment");
        return;
      }
      router.refresh();
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleStatusAdvance = async () => {
    if (!nextStatus) return;
    setStatusLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to update status");
        return;
      }
      router.refresh();
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle>{t.adminOrders.payment.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {payment ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.adminOrders.payment.status}</span>
                <span className={`font-medium ${
                  payment.status === "CONFIRMED" ? "text-green-700"
                  : payment.status === "FAILED" ? "text-destructive"
                  : ""
                }`}>
                  {payment.status === "AWAITING"
                    ? t.adminOrders.payment.awaiting
                    : payment.status === "CONFIRMED"
                      ? t.adminOrders.payment.confirmed
                      : t.adminOrders.payment.rejected}
                </span>
              </div>
              {payment.referenceCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.adminOrders.payment.referenceCode}</span>
                  <span className="font-mono">{payment.referenceCode}</span>
                </div>
              )}
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.adminOrders.payment.confirmedAt}</span>
                  <span>
                    {new Date(payment.paidAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              {orderStatus === "PENDING_PAYMENT" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => handlePaymentAction("confirm")} disabled={paymentLoading !== null}>
                    {paymentLoading === "confirm" ? t.adminOrders.payment.confirming : t.adminOrders.payment.confirm}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePaymentAction("reject")} disabled={paymentLoading !== null}
                    className="text-destructive border-destructive/40 hover:bg-destructive/10">
                    {paymentLoading === "reject" ? t.adminOrders.payment.rejecting : t.adminOrders.payment.reject}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">{t.adminOrders.payment.noRecord}</p>
          )}
        </CardContent>
      </Card>

      {/* Status advance */}
      {nextStatus && nextStatusLabel && (
        <Card>
          <CardHeader>
            <CardTitle>{t.adminOrders.statusCard.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {t.adminOrders.statusCard.markAs}{" "}
              <span className="font-medium text-foreground">{nextStatusLabel}</span>.
            </p>
            <Button size="sm" onClick={handleStatusAdvance} disabled={statusLoading}>
              {statusLoading ? t.adminOrders.statusCard.updating : `${t.adminOrders.statusCard.markButton} ${nextStatusLabel}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Print assets */}
      <Card>
        <CardHeader>
          <CardTitle>{t.adminOrders.printAssets.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <a href={`/api/admin/orders/${orderId}/assets`} download
            className="inline-flex items-center text-sm px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors font-medium">
            {t.adminOrders.printAssets.download}
          </a>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
