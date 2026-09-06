"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/config/pricing";
import { useT } from "@/lib/i18n/context";

type OrderStatus = "PENDING_PAYMENT" | "PAID" | "IN_PRODUCTION" | "SHIPPED" | "DELIVERED" | "CANCELLED";

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  recipientName: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  payment: {
    status: string;
    method: string;
    amount: number;
    referenceCode: string | null;
  } | null;
};

export default function OrderDetailPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(true);
  const [referenceCode, setReferenceCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const STATUS_STEPS: { key: OrderStatus; labelKey: keyof typeof t.orderStatus }[] = [
    { key: "PENDING_PAYMENT", labelKey: "PENDING_PAYMENT" },
    { key: "PAID", labelKey: "PAYMENT_CONFIRMED" },
    { key: "IN_PRODUCTION", labelKey: "IN_PRODUCTION" },
    { key: "SHIPPED", labelKey: "SHIPPED" },
    { key: "DELIVERED", labelKey: "DELIVERED" },
  ];

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((data) => setOrder(data))
      .finally(() => setFetching(false));
  }, [params.id]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceCode.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/orders/${params.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceCode: referenceCode.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSubmitError(body.error ?? "Failed to submit");
        return;
      }
      setSubmitted(true);
      const updated = await fetch(`/api/orders/${params.id}`).then((r) => r.json());
      setOrder(updated);
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) return <p className="text-sm text-muted-foreground">{t.orderDetail.loading}</p>;
  if (!order) return <p className="text-sm text-destructive">{t.orderDetail.notFound}</p>;

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const alreadySubmitted = submitted || order.payment?.referenceCode != null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t.orderDetail.backToOrders}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">
          Order {order.orderNumber}
        </h1>
      </div>

      {/* Status tracker */}
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentStepIndex;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${done ? "bg-primary" : "bg-muted-foreground/30"}`} />
                <span className="text-xs text-muted-foreground mt-1 text-center w-16 leading-tight">
                  {t.orderStatus[step.labelKey]}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-1 mb-5 ${i < currentStepIndex ? "bg-primary" : "bg-muted-foreground/30"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Bank transfer instructions */}
      {order.status === "PENDING_PAYMENT" && !alreadySubmitted && (
        <Card>
          <CardHeader>
            <CardTitle>{t.orderDetail.bankTransfer.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.orderDetail.bankTransfer.bank}</span>
                <span className="font-medium">BCA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.orderDetail.bankTransfer.accountNumber}</span>
                <span className="font-mono font-medium">1234-5678-90</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.orderDetail.bankTransfer.accountName}</span>
                <span className="font-medium">PhotoBook Hub</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.orderDetail.bankTransfer.amount}</span>
                <span className="font-semibold">{formatPrice(order.totalAmount * 100)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.orderDetail.bankTransfer.reference}</span>
                <span className="font-mono text-xs">{order.orderNumber}</span>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">{t.orderDetail.bankTransfer.instruction}</p>
            <form onSubmit={handlePaymentSubmit} className="flex gap-2">
              <Input
                placeholder={t.orderDetail.bankTransfer.placeholder}
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={submitting || !referenceCode.trim()}>
                {submitting ? t.orderDetail.bankTransfer.submitting : t.orderDetail.bankTransfer.submit}
              </Button>
            </form>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          </CardContent>
        </Card>
      )}

      {(alreadySubmitted || order.status !== "PENDING_PAYMENT") && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {order.status === "PENDING_PAYMENT"
                ? t.orderDetail.bankTransfer.received
                : `${t.orderDetail.orderStatusPrefix} ${t.orderStatus[order.status] ?? order.status}`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order details */}
      <Card>
        <CardHeader><CardTitle>{t.orderDetail.details.title}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.orderDetail.details.subtotal}</span>
            <span>{formatPrice(order.subtotal * 100)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.orderDetail.details.shipping}</span>
            <span>{formatPrice(order.shippingCost * 100)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>{t.orderDetail.details.total}</span>
            <span>{formatPrice(order.totalAmount * 100)}</span>
          </div>
          <div className="border-t pt-2 mt-2 text-muted-foreground">
            <p>{order.recipientName}</p>
            <p>{order.addressLine}</p>
            <p>{order.city}, {order.province} {order.postalCode}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
