"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NEXT_STATUS: Partial<Record<string, string>> = {
  PAID: "IN_PRODUCTION",
  IN_PRODUCTION: "SHIPPED",
  SHIPPED: "DELIVERED",
};

const NEXT_STATUS_LABEL: Partial<Record<string, string>> = {
  PAID: "In production",
  IN_PRODUCTION: "Shipped",
  SHIPPED: "Delivered",
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
  const router = useRouter();
  const [paymentLoading, setPaymentLoading] = useState<"confirm" | "reject" | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatus = NEXT_STATUS[orderStatus];
  const nextStatusLabel = NEXT_STATUS_LABEL[orderStatus];

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
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {payment ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`font-medium ${
                    payment.status === "CONFIRMED"
                      ? "text-green-700"
                      : payment.status === "FAILED"
                        ? "text-destructive"
                        : ""
                  }`}
                >
                  {payment.status === "AWAITING"
                    ? "Awaiting confirmation"
                    : payment.status === "CONFIRMED"
                      ? "Confirmed"
                      : "Rejected"}
                </span>
              </div>
              {payment.referenceCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference code</span>
                  <span className="font-mono">{payment.referenceCode}</span>
                </div>
              )}
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confirmed at</span>
                  <span>
                    {new Date(payment.paidAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              {orderStatus === "PENDING_PAYMENT" && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => handlePaymentAction("confirm")}
                    disabled={paymentLoading !== null}
                  >
                    {paymentLoading === "confirm" ? "Confirming…" : "Confirm payment"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePaymentAction("reject")}
                    disabled={paymentLoading !== null}
                    className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  >
                    {paymentLoading === "reject" ? "Rejecting…" : "Reject"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No payment record.</p>
          )}
        </CardContent>
      </Card>

      {/* Status advance */}
      {nextStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Order status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Mark this order as{" "}
              <span className="font-medium text-foreground">{nextStatusLabel}</span>.
            </p>
            <Button size="sm" onClick={handleStatusAdvance} disabled={statusLoading}>
              {statusLoading ? "Updating…" : `Mark as ${nextStatusLabel}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Print assets download */}
      <Card>
        <CardHeader>
          <CardTitle>Print assets</CardTitle>
        </CardHeader>
        <CardContent>
          <a
            href={`/api/admin/orders/${orderId}/assets`}
            download
            className="inline-flex items-center text-sm px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors font-medium"
          >
            Download photos (ZIP)
          </a>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
