/** IELTS Academic full mock exam catalog — hub, landing, checkout labels. */

export type MockProductType = "single" | "pack3" | "pack5";

export type MockPaymentProductType =
  | "mock_single"
  | "mock_pack3"
  | "mock_pack5";

export type AcademicMockCatalogItem = {
  mockNumber: number;
  theme: string;
  readingFocus: string;
  priceHalalas: number;
  priceLabel: string;
};

export const ACADEMIC_MOCK_SINGLE_PRICE_HALALAS = 16_900;
export const ACADEMIC_MOCK_PACK3_PRICE_HALALAS = 34_900;
export const ACADEMIC_MOCK_PACK5_PRICE_HALALAS = 64_900;

export const ACADEMIC_MOCK_PRICING: Record<
  MockProductType,
  { priceHalalas: number; priceLabel: string; saveVsSinglesLabel?: string }
> = {
  single: { priceHalalas: ACADEMIC_MOCK_SINGLE_PRICE_HALALAS, priceLabel: "169 SAR" },
  pack3: {
    priceHalalas: ACADEMIC_MOCK_PACK3_PRICE_HALALAS,
    priceLabel: "349 SAR",
    saveVsSinglesLabel: "Save 158 SAR vs 3 singles",
  },
  pack5: {
    priceHalalas: ACADEMIC_MOCK_PACK5_PRICE_HALALAS,
    priceLabel: "649 SAR",
    saveVsSinglesLabel: "Save 196 SAR vs 5 singles",
  },
};

/** Audited themes — distinct across all four skills in production. */
export const ACADEMIC_MOCK_CATALOG: AcademicMockCatalogItem[] = [
  {
    mockNumber: 1,
    theme: "Science & Technology",
    readingFocus: "AI, ecosystems & archaeology passages",
    priceHalalas: ACADEMIC_MOCK_SINGLE_PRICE_HALALAS,
    priceLabel: "169 SAR",
  },
  {
    mockNumber: 2,
    theme: "Psychology & Behaviour",
    readingFocus: "Psychology, behaviour & social science",
    priceHalalas: ACADEMIC_MOCK_SINGLE_PRICE_HALALAS,
    priceLabel: "169 SAR",
  },
  {
    mockNumber: 3,
    theme: "Education & Learning",
    readingFocus: "Education systems & learning research",
    priceHalalas: ACADEMIC_MOCK_SINGLE_PRICE_HALALAS,
    priceLabel: "169 SAR",
  },
  {
    mockNumber: 4,
    theme: "Astronomy & Space",
    readingFocus: "Space science & the universe",
    priceHalalas: ACADEMIC_MOCK_SINGLE_PRICE_HALALAS,
    priceLabel: "169 SAR",
  },
  {
    mockNumber: 5,
    theme: "Arts & Culture",
    readingFocus: "Arts, culture & society",
    priceHalalas: ACADEMIC_MOCK_SINGLE_PRICE_HALALAS,
    priceLabel: "169 SAR",
  },
];

export const ACADEMIC_MOCK_COUNT = ACADEMIC_MOCK_CATALOG.length;

export const ALL_ACADEMIC_MOCK_NUMBERS = ACADEMIC_MOCK_CATALOG.map((m) => m.mockNumber);

export function getAcademicMockByNumber(mockNumber: number): AcademicMockCatalogItem | null {
  return ACADEMIC_MOCK_CATALOG.find((m) => m.mockNumber === mockNumber) ?? null;
}

export function isValidAcademicMockNumber(value: unknown): value is number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= ACADEMIC_MOCK_COUNT;
}

/** Fixed pack contents per approved plan. */
export function mockNumbersForProduct(
  product: MockProductType,
  singleMockNumber?: number
): number[] {
  switch (product) {
    case "single": {
      if (!isValidAcademicMockNumber(singleMockNumber)) {
        throw new Error("single mock purchase requires mockNumber 1–5");
      }
      return [singleMockNumber];
    }
    case "pack3":
      return [1, 2, 3];
    case "pack5":
      return [1, 2, 3, 4, 5];
    default:
      return [];
  }
}

export function paymentProductTypeForMockProduct(
  product: MockProductType
): MockPaymentProductType {
  switch (product) {
    case "single":
      return "mock_single";
    case "pack3":
      return "mock_pack3";
    case "pack5":
      return "mock_pack5";
  }
}

export function mockProductFromPaymentProductType(
  productType: string | null | undefined
): MockProductType | null {
  switch (String(productType ?? "").trim()) {
    case "mock_single":
      return "single";
    case "mock_pack3":
      return "pack3";
    case "mock_pack5":
      return "pack5";
    default:
      return null;
  }
}

export function priceHalalasForMockProduct(product: MockProductType): number {
  return ACADEMIC_MOCK_PRICING[product].priceHalalas;
}
