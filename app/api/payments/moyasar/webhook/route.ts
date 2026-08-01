import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidTrack, type AcceleratorTrackId } from "@/lib/accelerator/tracks";
import { grantPaidAccess } from "@/lib/payments/grantAccess";
import { grantMockAccess } from "@/lib/payments/grantMockAccess";
import {
  parseMockNumbersFromMetadata,
  trackPriceHalalas,
  verifyMoyasarWebhookSecret,
} from "@/lib/payments/moyasar";
import type { MockPaymentProductType } from "@/lib/mock-test/academicMockCatalog";
import {
  FOUNDING_50_OFFER_CODE,
  acceleratorProductIdForTrack,
  isFounding50OfferActive,
  mockProductIdForType,
} from "@/lib/discounts";

export const runtime = "nodejs";

type MoyasarWebhookEvent = {
  id?: string;
  type?: string;
  secret_token?: string;
  data?: {
    id?: string;
    status?: string;
    amount?: number;
    metadata?: {
      student_id?: string;
      track?: string;
      product_type?: string;
      mock_numbers?: string;
      offer?: string;
    };
  };
};

const MOCK_PRODUCT_TYPES = new Set([
  "mock_single",
  "mock_pack3",
  "mock_pack5",
]);

function isMockPaymentProductType(value: string): value is MockPaymentProductType {
  return MOCK_PRODUCT_TYPES.has(value);
}

async function recordFoundingClaim(
  supabase: { from: (table: string) => any },
  input: {
    studentId: string;
    productId: string;
    paymentId: string;
    offer?: string | null;
  }
) {
  if (!isFounding50OfferActive(input.offer)) return;
  try {
    const { error } = await supabase.from("founding_offer_claims").insert({
      student_id: input.studentId,
      product_id: input.productId,
      payment_id: input.paymentId,
    });
    if (error && !/duplicate|unique/i.test(String(error.message ?? ""))) {
      console.warn("[payments/moyasar/webhook] founding claim", error.message);
    }
  } catch (err) {
    console.warn("[payments/moyasar/webhook] founding claim skipped", err);
  }
}

/** Browser check — Moyasar delivers real events via POST. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    live: true,
    message: "Webhook endpoint is live. Moyasar sends POST payment events here.",
    events: ["payment_paid"],
  });
}

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let payload: MoyasarWebhookEvent;

    try {
      payload = JSON.parse(rawBody) as MoyasarWebhookEvent;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!verifyMoyasarWebhookSecret(payload.secret_token)) {
      return NextResponse.json({ error: "Invalid secret_token" }, { status: 401 });
    }

    const eventType = String(payload.type ?? "").trim();
    if (eventType !== "payment_paid") {
      return NextResponse.json({ ok: true, ignored: true, type: eventType || "unknown" });
    }

    const payment = payload.data ?? {};
    const paymentId = String(payment.id ?? "").trim();
    const status = String(payment.status ?? "").trim().toLowerCase();

    if (!paymentId || status !== "paid") {
      return NextResponse.json({ ok: true, ignored: true, reason: "not_paid" });
    }

    const supabase = getSupabase();

    const { data: tx } = await supabase
      .from("payment_transactions")
      .select("student_id, track, amount_halalas, status, product_type, mock_numbers")
      .eq("moyasar_payment_id", paymentId)
      .maybeSingle();

    let studentId = String(payment.metadata?.student_id ?? tx?.student_id ?? "").trim();
    let trackRaw = String(payment.metadata?.track ?? tx?.track ?? "").trim().toLowerCase();
    let productType = String(
      payment.metadata?.product_type ?? tx?.product_type ?? "accelerator"
    )
      .trim()
      .toLowerCase();

    const metadataMockNumbers = parseMockNumbersFromMetadata(
      payment.metadata?.mock_numbers ?? tx?.mock_numbers
    );
    const offerCode = String(payment.metadata?.offer ?? "").trim().toLowerCase();

    const amountHalalas =
      Number(payment.amount) ||
      Number(tx?.amount_halalas) ||
      (isValidTrack(trackRaw as AcceleratorTrackId)
        ? trackPriceHalalas(trackRaw as AcceleratorTrackId)
        : 0);

    if (!studentId && paymentId) {
      const { data: userByPayment } = await supabase
        .from("users")
        .select("id, checkout_track")
        .eq("moyasar_payment_id", paymentId)
        .maybeSingle();
      studentId = String(userByPayment?.id ?? "").trim();
      if (!trackRaw && userByPayment?.checkout_track) {
        trackRaw = String(userByPayment.checkout_track).toLowerCase();
      }
    }

    if (!studentId) {
      console.warn("[payments/moyasar/webhook] acknowledged without grant", {
        eventId: payload.id,
        paymentId,
        studentId,
        productType,
      });
      return NextResponse.json({
        ok: true,
        acknowledged: true,
        reason: "payment_not_linked_to_student",
      });
    }

    const { data: existingStudent } = await supabase
      .from("users")
      .select("id")
      .eq("id", studentId)
      .maybeSingle();

    if (!existingStudent) {
      return NextResponse.json({
        ok: true,
        acknowledged: true,
        reason: "student_not_found",
      });
    }

    if (isMockPaymentProductType(productType)) {
      if (metadataMockNumbers.length === 0) {
        console.warn("[payments/moyasar/webhook] mock payment missing mock_numbers", {
          paymentId,
          productType,
        });
        return NextResponse.json({
          ok: true,
          acknowledged: true,
          reason: "mock_numbers_missing",
        });
      }

      const result = await grantMockAccess(supabase, {
        studentId,
        moyasarPaymentId: paymentId,
        amountHalalas,
        productType,
        mockNumbers: metadataMockNumbers,
        rawPayload: payload,
      });

      if (!result.ok) {
        console.error("[payments/moyasar/webhook]", result.error);
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      const mockProduct =
        productType === "mock_pack3"
          ? "pack3"
          : productType === "mock_pack5"
            ? "pack5"
            : "single";
      await recordFoundingClaim(supabase, {
        studentId,
        productId: mockProductIdForType(mockProduct),
        paymentId,
        offer: offerCode,
      });

      return NextResponse.json({
        ok: true,
        alreadyPaid: result.alreadyPaid,
        granted: "mock",
        mockNumbers: metadataMockNumbers,
      });
    }

    if (!isValidTrack(trackRaw)) {
      console.warn("[payments/moyasar/webhook] acknowledged without grant", {
        eventId: payload.id,
        paymentId,
        studentId,
        trackRaw,
      });
      return NextResponse.json({
        ok: true,
        acknowledged: true,
        reason: "payment_not_linked_to_student",
      });
    }

    const result = await grantPaidAccess(supabase, {
      studentId,
      track: trackRaw,
      moyasarPaymentId: paymentId,
      amountHalalas,
      rawPayload: payload,
    });

    if (!result.ok) {
      console.error("[payments/moyasar/webhook]", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await recordFoundingClaim(supabase, {
      studentId,
      productId: acceleratorProductIdForTrack(trackRaw as AcceleratorTrackId),
      paymentId,
      offer: offerCode,
    });

    return NextResponse.json({ ok: true, alreadyPaid: result.alreadyPaid, granted: "accelerator" });
  } catch (err) {
    console.error("[payments/moyasar/webhook]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook failed" },
      { status: 500 }
    );
  }
}
