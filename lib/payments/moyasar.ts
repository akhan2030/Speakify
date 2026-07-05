import { ACCELERATOR_TRACKS, type AcceleratorTrackId } from "@/lib/accelerator/tracks";

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
  studentEmail: string;
  studentName: string;
  callbackUrl: string;
}): Promise<MoyasarCreatePaymentResult | { error: string }> {
  const amountHalalas = trackPriceHalalas(options.track);
  const description = `Speakify IELTS ${ACCELERATOR_TRACKS[options.track].name}`;

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

export function verifyMoyasarWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  const secret = process.env.MOYASAR_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  if (!signature) return false;

  try {
    const crypto = require("crypto") as typeof import("crypto");
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
