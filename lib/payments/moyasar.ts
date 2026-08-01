import { ACCELERATOR_TRACKS, type AcceleratorTrackId } from "@/lib/accelerator/tracks";
import {
  checkoutPaymentDescription,
  type PaidProgramme,
} from "@/lib/payments/checkoutLabels";
import {
  priceHalalasForMockProduct,
  type MockPaymentProductType,
  type MockProductType,
  mockNumbersForProduct,
  paymentProductTypeForMockProduct,
} from "@/lib/mock-test/academicMockCatalog";

export type MoyasarPaymentMetadata = {
  student_id?: string;
  track?: string;
  product_type?: MockPaymentProductType | "accelerator";
  mock_numbers?: string;
};

export function parseMockNumbersFromMetadata(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
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
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
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
  if (process.env.MOYASAR_MOCK === "true") return true;
  if (process.env.MOYASAR_MOCK === "false") return false;
  return !process.env.MOYASAR_SECRET_KEY?.trim();
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
}): Promise<MoyasarCreateMockPaymentResult | { error: string }> {
  let mockNumbers: number[];
  try {
    mockNumbers = mockNumbersForProduct(options.product, options.singleMockNumber);
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
  const description = mockCheckoutDescription(options.product, mockNumbers);

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
