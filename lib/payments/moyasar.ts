import { ACCELERATOR_TRACKS, type AcceleratorTrackId } from "@/lib/accelerator/tracks";
import {
  checkoutPaymentDescription,
  type PaidProgramme,
} from "@/lib/payments/checkoutLabels";

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
}): Promise<MoyasarCreatePaymentResult | { error: string }> {
  const amountHalalas = trackPriceHalalas(options.track);
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
