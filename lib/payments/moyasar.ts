import { ACCELERATOR_TRACKS, type AcceleratorTrackId } from "@/lib/accelerator/tracks";
import {
  checkoutPaymentDescription,
  type PaidProgramme,
} from "@/lib/payments/checkoutLabels";
import {
  isValidAcademicMockNumber,
  mockNumbersForProduct,
  paymentProductTypeForMockProduct,
  priceHalalasForMockProduct,
  type MockPaymentProductType,
  type MockProductType,
} from "@/lib/mock-test/academicMockCatalog";
import { mockNumbersForGtProduct } from "@/lib/ielts-general/gtMockCatalog";

export type MoyasarPaymentMetadata = {
  student_id?: string;
  track?: string;
  product_type?: MockPaymentProductType | "accelerator" | "live_group" | "live_1to1";
  mock_numbers?: string;
  booking_id?: string;
  course_key?: string;
};

export function parseMockNumbersFromMetadata(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((n) => Number(n)).filter((n) => isValidAcademicMockNumber(n));
  }

  const raw = String(value ?? "").trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      return parseMockNumbersFromMetadata(parsed);
    } catch {
      return [];
    }
  }

  return raw
    .split(/[,\s]+/)
    .map((part) => Number(part.trim()))
    .filter((n) => isValidAcademicMockNumber(n));
}

export function mockCheckoutDescription(
  product: MockProductType,
  mockNumbers: number[]
): string {
  const nums = mockNumbers.join(", ");
  switch (product) {
    case "single":
      return `Speakify IELTS Academic Mock #${nums}`;
    case "pack3":
      return "Speakify IELTS Academic 3-Mock Pack (#1–#3)";
    case "pack5":
      return "Speakify IELTS Academic 5-Mock Pack (#1–#5)";
  }
}

export type MoyasarCreateMockPaymentResult =
  | {
      mode: "mock";
      mockPaymentId: string;
      amountHalalas: number;
      productType: MockPaymentProductType;
      mockNumbers: number[];
    }
  | {
      mode: "live";
      paymentId: string;
      amountHalalas: number;
      productType: MockPaymentProductType;
      mockNumbers: number[];
      publishableKey: string;
    };

export function isMoyasarMockMode(): boolean {
  warnIfProductionPaymentsAreMock();
  if (process.env.MOYASAR_MOCK === "true") return true;
  if (process.env.MOYASAR_MOCK === "false") return false;
  return !process.env.MOYASAR_SECRET_KEY?.trim();
}

let productionMoyasarWarningIssued = false;

export function warnIfProductionPaymentsAreMock(): void {
  if (productionMoyasarWarningIssued) return;
  if (process.env.NODE_ENV !== "production") return;
  if (typeof window !== "undefined") return;

  const forcedMock = process.env.MOYASAR_MOCK === "true";
  const missingSecret = !process.env.MOYASAR_SECRET_KEY?.trim();
  if (!forcedMock && !missingSecret) return;

  productionMoyasarWarningIssued = true;
  const reason = forcedMock
    ? "MOYASAR_MOCK=true"
    : "MOYASAR_SECRET_KEY is not set";
  console.warn(
    `[payments] Production is running checkout in mock/test mode (${reason}). Real customers will not be charged. Set MOYASAR_SECRET_KEY before going live.`
  );
}

export function getMoyasarPublishableKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.trim() ||
    process.env.MOYASAR_PUBLISHABLE_KEY?.trim() ||
    null
  );
}

export function trackPriceHalalas(track: AcceleratorTrackId): number {
  return ACCELERATOR_TRACKS[track].priceHalalas;
}

export type MoyasarCreatePaymentResult =
  | {
      mode: "mock";
      mockPaymentId: string;
      amountHalalas: number;
      track: AcceleratorTrackId;
    }
  | {
      mode: "live";
      paymentId: string;
      amountHalalas: number;
      track: AcceleratorTrackId;
      publishableKey: string;
    };

export async function createMoyasarPayment(options: {
  studentId: string;
  track: AcceleratorTrackId;
  programme?: PaidProgramme;
  studentEmail: string;
  studentName: string;
  callbackUrl: string;
  /** Override list price (e.g. Founding 50) */
  amountHalalasOverride?: number;
  offerCode?: string | null;
}): Promise<MoyasarCreatePaymentResult | { error: string }> {
  const amountHalalas =
    options.amountHalalasOverride != null && options.amountHalalasOverride > 0
      ? options.amountHalalasOverride
      : trackPriceHalalas(options.track);
  const programme = options.programme ?? "ielts";
  const description = checkoutPaymentDescription(programme, options.track);

  if (isMoyasarMockMode()) {
    const mockPaymentId = `mock_${options.studentId}_${Date.now()}`;
    return {
      mode: "mock",
      mockPaymentId,
      amountHalalas,
      track: options.track,
    };
  }

  const secretKey = process.env.MOYASAR_SECRET_KEY?.trim();
  const publishableKey = getMoyasarPublishableKey();
  if (!secretKey || !publishableKey) {
    return { error: "Payment is not configured. Please contact support." };
  }

  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const res = await fetch("https://api.moyasar.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountHalalas,
      currency: "SAR",
      description,
      callback_url: options.callbackUrl,
      metadata: {
        student_id: options.studentId,
        track: options.track,
        ...(options.offerCode ? { offer: options.offerCode } : {}),
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[moyasar/create]", data);
    return { error: "Could not start payment. Please try again." };
  }

  const paymentId = String(data.id ?? "").trim();
  if (!paymentId) {
    return { error: "Invalid payment response." };
  }

  return {
    mode: "live",
    paymentId,
    amountHalalas,
    track: options.track,
    publishableKey,
  };
}

export async function createMockExamPayment(options: {
  studentId: string;
  product: MockProductType;
  singleMockNumber?: number;
  studentEmail: string;
  studentName: string;
  callbackUrl: string;
  amountHalalasOverride?: number;
  offerCode?: string | null;
  /** Enrollment slug — Academic `ielts` (default) or GT `ielts_general`. */
  programme?: "ielts" | "ielts_general";
  /** Override description (e.g. GT 3-pack marketing). */
  descriptionOverride?: string;
}): Promise<MoyasarCreateMockPaymentResult | { error: string }> {
  const programme = options.programme ?? "ielts";

  let mockNumbers: number[];
  try {
    if (programme === "ielts_general") {
      if (options.product === "pack5") {
        return { error: "GT does not offer a 5-mock pack" };
      }
      mockNumbers = mockNumbersForGtProduct(
        options.product as "single" | "pack3",
        options.singleMockNumber
      );
    } else {
      mockNumbers = mockNumbersForProduct(
        options.product,
        options.singleMockNumber
      );
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Invalid mock product",
    };
  }

  const productType = paymentProductTypeForMockProduct(options.product);
  const amountHalalas =
    options.amountHalalasOverride != null && options.amountHalalasOverride > 0
      ? options.amountHalalasOverride
      : priceHalalasForMockProduct(options.product);
  const description =
    options.descriptionOverride?.trim() ||
    mockCheckoutDescription(options.product, mockNumbers);

  if (isMoyasarMockMode()) {
    const mockPaymentId = `mock_exam_${options.studentId}_${Date.now()}`;
    return {
      mode: "mock",
      mockPaymentId,
      amountHalalas,
      productType,
      mockNumbers,
    };
  }

  const secretKey = process.env.MOYASAR_SECRET_KEY?.trim();
  const publishableKey = getMoyasarPublishableKey();
  if (!secretKey || !publishableKey) {
    return { error: "Payment is not configured. Please contact support." };
  }

  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const res = await fetch("https://api.moyasar.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountHalalas,
      currency: "SAR",
      description,
      callback_url: options.callbackUrl,
      metadata: {
        student_id: options.studentId,
        product_type: productType,
        mock_numbers: mockNumbers.join(","),
        programme,
        ...(options.offerCode ? { offer: options.offerCode } : {}),
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[moyasar/create-mock]", data);
    return { error: "Could not start payment. Please try again." };
  }

  const paymentId = String(data.id ?? "").trim();
  if (!paymentId) {
    return { error: "Invalid payment response." };
  }

  return {
    mode: "live",
    paymentId,
    amountHalalas,
    productType,
    mockNumbers,
    publishableKey,
  };
}

export type MoyasarCreateLiveClassPaymentResult =
  | {
      mode: "mock";
      mockPaymentId: string;
      amountHalalas: number;
      productType: "live_group" | "live_1to1";
    }
  | {
      mode: "live";
      paymentId: string;
      amountHalalas: number;
      productType: "live_group" | "live_1to1";
      publishableKey: string;
    };

export async function createLiveClassPayment(options: {
  studentId: string;
  productType: "live_group" | "live_1to1";
  amountHalalas: number;
  description: string;
  callbackUrl: string;
  bookingId: string;
  courseKey: string;
}): Promise<MoyasarCreateLiveClassPaymentResult | { error: string }> {
  if (isMoyasarMockMode()) {
    return {
      mode: "mock",
      mockPaymentId: `mock_live_${options.studentId}_${Date.now()}`,
      amountHalalas: options.amountHalalas,
      productType: options.productType,
    };
  }

  const secretKey = process.env.MOYASAR_SECRET_KEY?.trim();
  const publishableKey = getMoyasarPublishableKey();
  if (!secretKey || !publishableKey) {
    return { error: "Payment is not configured. Please contact support." };
  }

  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const res = await fetch("https://api.moyasar.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: options.amountHalalas,
      currency: "SAR",
      description: options.description,
      callback_url: options.callbackUrl,
      metadata: {
        student_id: options.studentId,
        product_type: options.productType,
        booking_id: options.bookingId,
        course_key: options.courseKey,
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[moyasar/create-live-class]", data);
    return { error: "Could not start payment. Please try again." };
  }

  const paymentId = String(data.id ?? "").trim();
  if (!paymentId) {
    return { error: "Invalid payment response." };
  }

  return {
    mode: "live",
    paymentId,
    amountHalalas: options.amountHalalas,
    productType: options.productType,
    publishableKey,
  };
}

export function verifyMoyasarWebhookSecret(secretToken: string | null | undefined): boolean {
  const secret = process.env.MOYASAR_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  return String(secretToken ?? "").trim() === secret;
}

/** @deprecated Moyasar uses secret_token in body, not HMAC headers */
export function verifyMoyasarWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  try {
    const parsed = JSON.parse(payload) as { secret_token?: string };
    return verifyMoyasarWebhookSecret(parsed.secret_token);
  } catch {
    return false;
  }
}
