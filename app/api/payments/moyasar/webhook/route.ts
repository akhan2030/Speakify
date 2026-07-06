import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidTrack, type AcceleratorTrackId } from "@/lib/accelerator/tracks";
import { grantPaidAccess } from "@/lib/payments/grantAccess";
import { verifyMoyasarWebhookSecret } from "@/lib/payments/moyasar";
import { trackPriceHalalas } from "@/lib/payments/moyasar";

export const runtime = "nodejs";

type MoyasarWebhookEvent = {
  id?: string;
  type?: string;
  secret_token?: string;
  data?: {
    id?: string;
    status?: string;
    amount?: number;
    metadata?: { student_id?: string; track?: string };
  };
};

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
      .select("student_id, track, amount_halalas, status")
      .eq("moyasar_payment_id", paymentId)
      .maybeSingle();

    let studentId = String(payment.metadata?.student_id ?? tx?.student_id ?? "").trim();
    let trackRaw = String(payment.metadata?.track ?? tx?.track ?? "").trim().toLowerCase();
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

    if (!studentId || !isValidTrack(trackRaw)) {
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

    return NextResponse.json({ ok: true, alreadyPaid: result.alreadyPaid });
  } catch (err) {
    console.error("[payments/moyasar/webhook]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook failed" },
      { status: 500 }
    );
  }
}
