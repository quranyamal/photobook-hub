import type { CoverType, PhotobookSize } from "@/generated/prisma/enums";

export type SizeConfig = {
  label: string;
  description: string;
  aspectRatio: number; // width / height
};

export type CoverConfig = {
  label: string;
  priceAddition: number; // in cents added on top of base price
};

export const SIZE_CONFIG: Record<PhotobookSize, SizeConfig> = {
  A4: { label: "A4", description: "210 × 297 mm", aspectRatio: 210 / 297 },
  A5: { label: "A5", description: "148 × 210 mm", aspectRatio: 148 / 210 },
  SQUARE: { label: "Square", description: "200 × 200 mm", aspectRatio: 1 },
};

export const COVER_CONFIG: Record<CoverType, CoverConfig> = {
  SOFTCOVER: { label: "Softcover", priceAddition: 0 },
  HARDCOVER: { label: "Hardcover", priceAddition: 5000000 }, // +Rp 50,000
};

// Base price per size in IDR × 100 (stored as IDR / 100 in DB)
export const BASE_PRICE_CENTS: Record<PhotobookSize, number> = {
  A4: 15000000,    // Rp 150,000
  A5: 12000000,    // Rp 120,000
  SQUARE: 12000000, // Rp 120,000
};

export const SHIPPING_COST_CENTS = 2500000; // Rp 25,000 flat rate

export function getSubtotalCents(
  size: PhotobookSize,
  coverType: CoverType
): number {
  return BASE_PRICE_CENTS[size] + COVER_CONFIG[coverType].priceAddition;
}

export function getTotalPriceCents(
  size: PhotobookSize,
  coverType: CoverType
): number {
  return getSubtotalCents(size, coverType) + SHIPPING_COST_CENTS;
}

export function formatPrice(cents: number): string {
  const amount = Math.round(cents / 100);
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${formatted}`;
}
