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
  HARDCOVER: { label: "Hardcover", priceAddition: 3000 }, // +$30.00
};

// Base price per size in cents (USD)
export const BASE_PRICE_CENTS: Record<PhotobookSize, number> = {
  A4: 2999, // $29.99
  A5: 2499, // $24.99
  SQUARE: 2499, // $24.99
};

export function getTotalPriceCents(
  size: PhotobookSize,
  coverType: CoverType
): number {
  return BASE_PRICE_CENTS[size] + COVER_CONFIG[coverType].priceAddition;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
