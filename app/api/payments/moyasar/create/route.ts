import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";
import {
  ACCELERATOR_TRACKS,
  isValidTrack,
  resolveAcceleratorTrack,
  type AcceleratorTrackId,
} from "@/lib/accelerator/tracks";
import { createMoyasarPayment, isMoyasarMockMode } from "@/lib/payments/moyasar";
import { getAppBaseUrl } from "@/lib/appUrl";
import { requiresIeltsAcademicPayment, hasDashboardAccess } from "@/lib/payments/access";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const role = normalizeRole((session?.user as { role?: string })?.role);

    if (!studentId || role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const supabase = getSupabase();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, name, email, onboarding_completed, payment_status, payment_comped_until, enrolled_programs, program_selected, accelerator_track, checkout_track, placement_band"
      )
      .eq("id", studentId)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.onboarding_completed !== true) {
      return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
    }

    const accessUser = {
      role,
      paymentStatus: user.payment_status,
      paymentCompedUntil: user.payment_comped_until,
      enrolledPrograms: user.enrolled_programs,
      programSelected: user.program_selected,
    };

    if (!requiresIeltsAcademicPayment(accessUser)) {
      return NextResponse.json({ error: "Payment not required for this programme" }, { status: 400 });
    }

    if (hasDashboardAccess(accessUser)) {
      return NextResponse.json({ error: "Already has access" }, { status: 400 });
    }

    const track = resolveAcceleratorTrack({
      checkoutTrack: user.checkout_track,
      acceleratorTrack: user.accelerator_track,
      placementBand: user.placement_band,
    }) as AcceleratorTrackId;

    if (!isValidTrack(track)) {
      return NextResponse.json({ error: "No track selected for checkout" }, { status: 400 });
    }

    const baseUrl = getAppBaseUrl() || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/checkout/success`;

    const payment = await createMoyasarPayment({
      studentId,
      track,
      studentEmail: String(user.email ?? session.user?.email ?? ""),
      studentName: String(user.name ?? "Student"),
      callbackUrl,
    });

    if ("error" in payment) {
      return NextResponse.json({ error: payment.error }, { status: 503 });
    }

    const paymentId =
      payment.mode === "mock" ? payment.mockPaymentId : payment.paymentId;

    await supabase
      .from("users")
      .update({
        payment_status: "pending",
        checkout_track: track,
        moyasar_payment_id: paymentId,
      })
      .eq("id", studentId);

    await supabase.from("payment_transactions").upsert(
      {
        student_id: studentId,
        moyasar_payment_id: paymentId,
        track,
        amount_halalas: payment.amountHalalas,
        currency: "SAR",
        status: "initiated",
      },
      { onConflict: "moyasar_payment_id" }
    );

    const meta = ACCELERATOR_TRACKS[track];

    return NextResponse.json({
      ok: true,
      mode: payment.mode,
      paymentId,
      studentId,
      track,
      trackLabel: `IELTS ${meta.name}`,
      price: meta.price,
      amountHalalas: payment.amountHalalas,
      duration: meta.duration,
      target: meta.target,
      description: `Speakify IELTS ${meta.name}`,
      publishableKey: payment.mode === "live" ? payment.publishableKey : null,
      mockMode: isMoyasarMockMode(),
      callbackUrl,
    });
  } catch (err) {
    console.error("[payments/moyasar/create]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start checkout" },
      { status: 500 }
    );
  }
}
