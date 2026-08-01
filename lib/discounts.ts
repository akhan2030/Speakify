/**
 * Founding 50 launch offer — single source of truth for discounted prices.
 * UI and payment APIs must read from here; never hardcode founding prices inline.
 */

export const FOUNDING_50_OFFER_CODE = "founding50" as const;
export const FOUNDING_50_TOTAL_SPOTS = 50;
/** Used when founding_offer_claims table is unavailable */
export const FOUNDING_50_FALLBACK_SPOTS_REMAINING = 23;

export type FoundingOfferProductId =
  | "mock-single"
  | "mock-pack3"
  | "mock-pack5"
  | "ielts-foundation"
  | "ielts-plus"
  | "ielts-elite"
  | "ielts-gt-foundation"
  | "ielts-gt-plus"
  | "ielts-gt-elite";

export type FoundingOfferDiscount = {
  productId: FoundingOfferProductId;
  label: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  originalPriceLabel: string;
  discountedPriceLabel: string;
  /** Checkout / register CTA path with offer pre-applied */
  ctaHref: string;
  /** Short product name shown in the popup */
  productName: string;
  trustLine: string;
};

function sar(n: number): string {
  return `${n.toLocaleString("en-US")} SAR`;
}

export const FOUNDING_50_DISCOUNTS: Record<
  FoundingOfferProductId,
  FoundingOfferDiscount
> = {
  "mock-single": {
    productId: "mock-single",
    label: "Founding 50 Offer",
    productName: "Single Mock Exam",
    originalPrice: 169,
    discountedPrice: 127,
    discountPercent: 25,
    originalPriceLabel: sar(169),
    discountedPriceLabel: sar(127),
    ctaHref: "/checkout/mock?product=single&offer=founding50",
    trustLine: "Certified trainer-reviewed Writing & Speaking",
  },
  "mock-pack3": {
    productId: "mock-pack3",
    label: "Founding 50 Offer",
    productName: "3-Mock Pack",
    originalPrice: 349,
    discountedPrice: 279,
    discountPercent: 20,
    originalPriceLabel: sar(349),
    discountedPriceLabel: sar(279),
    ctaHref: "/checkout/mock?product=pack3&offer=founding50",
    trustLine: "Certified trainer-reviewed Writing & Speaking",
  },
  "mock-pack5": {
    productId: "mock-pack5",
    label: "Founding 50 Offer",
    productName: "5-Mock Pack",
    originalPrice: 649,
    discountedPrice: 454,
    discountPercent: 30,
    originalPriceLabel: sar(649),
    discountedPriceLabel: sar(454),
    ctaHref: "/checkout/mock?product=pack5&offer=founding50",
    trustLine: "Certified trainer-reviewed Writing & Speaking",
  },
  "ielts-foundation": {
    productId: "ielts-foundation",
    label: "Founding 50 Offer",
    productName: "IELTS Academic Foundation",
    originalPrice: 1200,
    discountedPrice: 840,
    discountPercent: 30,
    originalPriceLabel: sar(1200),
    discountedPriceLabel: sar(840),
    ctaHref: "/register/ielts-accelerator?track=foundation&offer=founding50",
    trustLine: "AI scoring + certified trainer review",
  },
  "ielts-plus": {
    productId: "ielts-plus",
    label: "Founding 50 Offer",
    productName: "IELTS Academic Plus",
    originalPrice: 1800,
    discountedPrice: 1260,
    discountPercent: 30,
    originalPriceLabel: sar(1800),
    discountedPriceLabel: sar(1260),
    ctaHref: "/register/ielts-accelerator?track=plus&offer=founding50",
    trustLine: "AI scoring + certified trainer review",
  },
  "ielts-elite": {
    productId: "ielts-elite",
    label: "Founding 50 Offer",
    productName: "IELTS Academic Elite",
    originalPrice: 2400,
    discountedPrice: 1680,
    discountPercent: 30,
    originalPriceLabel: sar(2400),
    discountedPriceLabel: sar(1680),
    ctaHref: "/register/ielts-accelerator?track=elite&offer=founding50",
    trustLine: "AI scoring + certified trainer review",
  },
  "ielts-gt-foundation": {
    productId: "ielts-gt-foundation",
    label: "Founding 50 Offer",
    productName: "IELTS General Training Foundation",
    originalPrice: 1200,
    discountedPrice: 840,
    discountPercent: 30,
    originalPriceLabel: sar(1200),
    discountedPriceLabel: sar(840),
    ctaHref: "/register/ielts-general?track=foundation&offer=founding50",
    trustLine: "AI scoring + certified trainer review",
  },
  "ielts-gt-plus": {
    productId: "ielts-gt-plus",
    label: "Founding 50 Offer",
    productName: "IELTS General Training Plus",
    originalPrice: 1800,
    discountedPrice: 1260,
    discountPercent: 30,
    originalPriceLabel: sar(1800),
    discountedPriceLabel: sar(1260),
    ctaHref: "/register/ielts-general?track=plus&offer=founding50",
    trustLine: "AI scoring + certified trainer review",
  },
  "ielts-gt-elite": {
    productId: "ielts-gt-elite",
    label: "Founding 50 Offer",
    productName: "IELTS General Training Elite",
    originalPrice: 2400,
    discountedPrice: 1680,
    discountPercent: 30,
    originalPriceLabel: sar(2400),
    discountedPriceLabel: sar(1680),
    ctaHref: "/register/ielts-general?track=elite&offer=founding50",
    trustLine: "AI scoring + certified trainer review",
  },
};

export const FOUNDING_50_COURSE_SLUGS = [
  "ielts-foundation",
  "ielts-plus",
  "ielts-elite",
  "ielts-gt-foundation",
  "ielts-gt-plus",
  "ielts-gt-elite",
] as const;

export function isFoundingOfferProductId(
  value: unknown
): value is FoundingOfferProductId {
  return typeof value === "string" && value in FOUNDING_50_DISCOUNTS;
}

export function getFoundingOffer(
  productId: FoundingOfferProductId
): FoundingOfferDiscount {
  return FOUNDING_50_DISCOUNTS[productId];
}

export function foundingOfferForCourseSlug(
  slug: string
): FoundingOfferDiscount | null {
  if (!isFoundingOfferProductId(slug)) return null;
  return FOUNDING_50_DISCOUNTS[slug];
}

/** Halalas (1 SAR = 100) for payment APIs */
export function foundingOfferPriceHalalas(
  productId: FoundingOfferProductId
): number {
  return FOUNDING_50_DISCOUNTS[productId].discountedPrice * 100;
}

export function isFounding50OfferActive(offerCode: unknown): boolean {
  return String(offerCode ?? "").trim().toLowerCase() === FOUNDING_50_OFFER_CODE;
}

export function mockProductIdForType(
  product: "single" | "pack3" | "pack5"
): FoundingOfferProductId {
  switch (product) {
    case "pack3":
      return "mock-pack3";
    case "pack5":
      return "mock-pack5";
    default:
      return "mock-single";
  }
}

export function acceleratorProductIdForTrack(
  track: "foundation" | "plus" | "elite",
  programme: "ielts" | "ielts_general" = "ielts"
): FoundingOfferProductId {
  if (programme === "ielts_general") {
    return `ielts-gt-${track}` as FoundingOfferProductId;
  }
  return `ielts-${track}` as FoundingOfferProductId;
}

export function appendFoundingOfferParam(href: string): string {
  const url = new URL(href, "https://speakify.local");
  url.searchParams.set("offer", FOUNDING_50_OFFER_CODE);
  return `${url.pathname}${url.search}`;
}

export const FOUNDING_50_SESSION_DISMISS_KEY = "founding50_offer_dismissed";
export const FOUNDING_50_ACTIVE_OFFER_KEY = "founding50_active_offer";

export function rememberFoundingOffer(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FOUNDING_50_ACTIVE_OFFER_KEY, FOUNDING_50_OFFER_CODE);
  } catch {
    /* ignore */
  }
}

export function readRememberedFoundingOffer(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(FOUNDING_50_ACTIVE_OFFER_KEY);
    return isFounding50OfferActive(v) ? FOUNDING_50_OFFER_CODE : null;
  } catch {
    return null;
  }
}
