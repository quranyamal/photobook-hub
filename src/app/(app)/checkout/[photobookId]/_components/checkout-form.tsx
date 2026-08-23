"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, SHIPPING_COST_CENTS } from "@/config/pricing";
import { SIZE_CONFIG, COVER_CONFIG } from "@/config/pricing";
import type { PhotobookSize, CoverType } from "@/generated/prisma/enums";

const addressSchema = z.object({
  recipientName: z.string().min(1, "Required"),
  phoneNumber: z.string().min(1, "Required"),
  addressLine: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  province: z.string().min(1, "Required"),
  postalCode: z.string().min(1, "Required"),
});

type AddressValues = z.infer<typeof addressSchema>;

type Props = {
  photobookId: string;
  projectTitle: string;
  size: PhotobookSize;
  coverType: CoverType;
  pageCount: number;
  subtotalCents: number;
};

export function CheckoutForm({
  photobookId,
  projectTitle,
  size,
  coverType,
  pageCount,
  subtotalCents,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalCents = subtotalCents + SHIPPING_COST_CENTS;

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipientName: "",
      phoneNumber: "",
      addressLine: "",
      city: "",
      province: "",
      postalCode: "",
    },
  });

  const onSubmit = async (values: AddressValues) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photobookId, ...values }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to place order");
        return;
      }
      router.push(`/orders/${body.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Order summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Photobook</span>
            <span>{projectTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size</span>
            <span>{SIZE_CONFIG[size].label} ({SIZE_CONFIG[size].description})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cover</span>
            <span>{COVER_CONFIG[coverType].label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pages</span>
            <span>{pageCount}</span>
          </div>
          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatPrice(SHIPPING_COST_CENTS)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-1">
              <span>Total</span>
              <span>{formatPrice(totalCents)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping address form */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping address</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient name</FormLabel>
                      <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl><Input placeholder="08123456789" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="addressLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input placeholder="Jl. Sudirman No. 1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input placeholder="Jakarta" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province</FormLabel>
                      <FormControl><Input placeholder="DKI Jakarta" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal code</FormLabel>
                      <FormControl><Input placeholder="10110" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Placing order…" : `Place order · ${formatPrice(totalCents)}`}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
