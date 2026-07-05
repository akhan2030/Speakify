import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidTrack, type AcceleratorTrackId } from "@/lib/accelerator/tracks";
import { grantPaidAccess } from "@/lib/payments/grantAccess";
import { verifyMoyasarWebhookSignature } from "@/lib/payments/moyasar";
import { trackPriceHalalas } from "@/lib/payments/moyasar";

export const runtime = "nodejs";

/** Browser/Moyasar dashboard ping — real events are POST only. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "moyasar-webhook",
    method: "POST",
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
    const signature = request.headers.get("x-moyasar-signature");

    if (process.env.MOYASAR_WEBHOOK_SECRET?.trim()) {
      if (!verifyMoyasarWebhookSignature(rawBody, signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody) as {
      id?: string;
      status?: string;
      amount?: number;
      metadata?: { student_id?: string; track?: string };
    };

    const paymentId = String(payload.id ?? "").trim();
    const status = String(payload.status ?? "").trim().toLowerCase();

    if (!paymentId || status !== "paid") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const supabase = getSupabase();

    const { data: tx } = await supabase
      .from("payment_transactions")
      .select("student_id, track, amount_halalas, status")
      .eq("moyasar_payment_id", paymentId)
      .maybeSingle();

    let studentId = String(payload.metadata?.student_id ?? tx?.student_id ?? "").trim();
    let trackRaw = String(payload.metadata?.track ?? tx?.track ?? "").trim().toLowerCase();
    const amountHalalas =
      Number(payload.amount) ||
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
      console.error("[payments/moyasar/webhook] missing student or track", {
        paymentId,
        studentId,
        trackRaw,
      });
      return NextResponse.json({ error: "Missing payment metadata" }, { status: 422 });
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
