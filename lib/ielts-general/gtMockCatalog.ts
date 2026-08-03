/** IELTS General Training full-mock catalog — hub, lobby, checkout (3 sellable mocks). */

import type { MockProductType } from "@/lib/mock-test/academicMockCatalog";

export const GT_SELLABLE_MOCK_NUMBERS = [1, 2, 3] as const;

export const ALL_GT_MOCK_NUMBERS: readonly number[] = [...GT_SELLABLE_MOCK_NUMBERS];

export type GtSellableMockNumber = (typeof GT_SELLABLE_MOCK_NUMBERS)[number];

/** GT sells single + 3-pack only — no 5-pack until Reading inventory supports it. */
export type GtMockProductType = "single" | "pack3";

export type GtMockCatalogItem = {
  mockNumber: number;
  theme: string;
  readingFocus: string;
  priceHalalas: number;
  priceLabel: string;
};

export const GT_MOCK_SINGLE_PRICE_HALALAS = 16_900;
export const GT_MOCK_PACK3_PRICE_HALALAS = 34_900;

export const GT_MOCK_PRICING: Record<
  GtMockProductType,
  { priceHalalas: number; priceLabel: string; saveVsSinglesLabel?: string }
> = {
  single: { priceHalalas: GT_MOCK_SINGLE_PRICE_HALALAS, priceLabel: "169 SAR" },
  pack3: {
    priceHalalas: GT_MOCK_PACK3_PRICE_HALALAS,
    priceLabel: "349 SAR",
    saveVsSinglesLabel: "Save 158 SAR vs 3 singles",
  },
};

export const GT_MOCK_CATALOG: GtMockCatalogItem[] = [
  {
    mockNumber: 1,
    theme: "Everyday & Workplace English",
    readingFocus: "Notices, workplace texts & Section C long article",
    priceHalalas: GT_MOCK_SINGLE_PRICE_HALALAS,
    priceLabel: "169 SAR",
  },
  {
    mockNumber: 2,
    theme: "Community & Practical Life",
    readingFocus: "Rotated General Reading bank + alternate Section C",
    priceHalalas: GT_MOCK_SINGLE_PRICE_HALALAS,
    priceLabel: "169 SAR",
  },
  {
    mockNumber: 3,
    theme: "Timed General Exam Conditions",
    readingFocus: "Third sitting — new L/S/W; Reading bank reused",
    priceHalalas: GT_MOCK_SINGLE_PRICE_HALALAS,
    priceLabel: "169 SAR",
  },
];

export const GT_MOCK_COUNT = GT_MOCK_CATALOG.length;

export function getGtMockByNumber(mockNumber: number): GtMockCatalogItem | null {
  return GT_MOCK_CATALOG.find((m) => m.mockNumber === mockNumber) ?? null;
}

export function isGtSellableMockNumber(n: number): n is GtSellableMockNumber {
  return (GT_SELLABLE_MOCK_NUMBERS as readonly number[]).includes(n);
}

export function isValidGtMockNumber(n: number): boolean {
  return isGtSellableMockNumber(n);
}

export function mockNumbersForGtProduct(
  product: GtMockProductType,
  singleMockNumber?: number
): number[] {
  switch (product) {
    case "single": {
      if (!isValidGtMockNumber(Number(singleMockNumber))) {
        throw new Error("GT single mock purchase requires mockNumber 1–3");
      }
      return [Number(singleMockNumber)];
    }
    case "pack3":
      return [1, 2, 3];
    default:
      return [];
  }
}

export function priceHalalasForGtMockProduct(product: GtMockProductType): number {
  return GT_MOCK_PRICING[product].priceHalalas;
}

/** Map GT product onto shared Moyasar product_type values (no pack5 for GT). */
export function asSharedMockProductType(product: GtMockProductType): MockProductType {
  return product;
}
