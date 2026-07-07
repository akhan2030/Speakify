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
import { grantPaidAccess } from "@/lib/payments/grantAccess";
import { isMoyasarMockMode, trackPriceHalalas } from "@/lib/payments/moyasar";
import { hasDashboardAccess, requiresProgrammePayment } from "@/lib/payments/access";
import {
  checkoutTrackLabel,
  resolvePaidProgramme,
} from "@/lib/payments/checkoutLabels";
import { dashboardPathForStudentUser } from "@/lib/studentLoginRedirect";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Dev/mock only — simulates a successful Moyasar payment. */
export async function POST(request: Request) {
  if (!isMoyasarMockMode()) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const role = normalizeRole((session?.user as { role?: string })?.role);

    if (!studentId || role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const supabase = getSupabase();

    const { data: user } = await supabase
      .from("users")
      .select(
        "checkout_track, accelerator_track, placement_band, payment_status, payment_comped_until, enrolled_programs, program_selected, moyasar_payment_id"
      )
      .eq("id", studentId)
      .maybeSingle();

    const track = resolveAcceleratorTrack({
      checkoutTrack: user?.checkout_track,
      acceleratorTrack: user?.accelerator_track,
      placementBand: user?.placement_band,
    }) as AcceleratorTrackId;

    if (!isValidTrack(track)) {
      return NextResponse.json({ error: "No track for checkout" }, { status: 400 });
    }

    const paymentId =
      String(body.paymentId ?? user?.moyasar_payment_id ?? "").trim() ||
      `mock_${studentId}_${Date.now()}`;

    const result = await grantPaidAccess(supabase, {
      studentId,
      track,
      moyasarPaymentId: paymentId,
      amountHalalas: trackPriceHalalas(track),
      rawPayload: { mock: true, paymentId },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const dashboardPath = dashboardPathForStudentUser({
      role,
      programType: session?.user?.programType,
      enrolledPrograms: user?.enrolled_programs,
      programSelected: user?.program_selected,
    });

    return NextResponse.json({
      ok: true,
      alreadyPaid: result.alreadyPaid,
      paymentStatus: "paid",
      dashboardPath,
    });
  } catch (err) {
    console.error("[payments/moyasar/mock-complete]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Mock payment failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const role = normalizeRole((session?.user as { role?: string })?.role);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: user } = await supabase
      .from("users")
      .select(
        "payment_status, payment_comped_until, checkout_track, accelerator_track, enrolled_programs, program_selected, onboarding_completed"
      )
      .eq("id", studentId)
      .maybeSingle();

    const accessUser = {
      role,
      paymentStatus: user?.payment_status,
      paymentCompedUntil: user?.payment_comped_until,
      enrolledPrograms: user?.enrolled_programs,
      programSelected: user?.program_selected,
    };

    const trackRaw = String(user?.checkout_track ?? user?.accelerator_track ?? "").toLowerCase();
    const track = isValidTrack(trackRaw) ? trackRaw : null;
    const meta = track ? ACCELERATOR_TRACKS[track] : null;
    const programme = resolvePaidProgramme({
      enrolledPrograms: user?.enrolled_programs,
      programSelected: user?.program_selected,
    });

    return NextResponse.json({
      paymentStatus: user?.payment_status ?? "unpaid",
      hasAccess: hasDashboardAccess(accessUser),
      requiresPayment: requiresProgrammePayment(accessUser),
      onboardingCompleted: user?.onboarding_completed === true,
      programme,
      track,
      trackLabel: track ? checkoutTrackLabel(programme, track) : null,
      price: meta?.price ?? null,
      mockMode: isMoyasarMockMode(),
      dashboardPath: dashboardPathForStudentUser({
        role,
        programType: session?.user?.programType,
        enrolledPrograms: user?.enrolled_programs,
        programSelected: user?.program_selected,
      }),
    });
  } catch (err) {
    console.error("[payments/status]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load payment status" },
      { status: 500 }
    );
  }
}
