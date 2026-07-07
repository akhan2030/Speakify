import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  bandToPathwaySubLevel,
  dashboardPathForProgramme,
  recommendGatewayTrack,
  targetBandFromRecommendation,
} from "@/lib/onboarding/recommendTrack";
import {
  enrolledProgramsForGateway,
  GATEWAY_PROGRAMME_IDS,
  programTypeForGateway,
} from "@/lib/onboarding/programmes";
import type { GatewayProgramme } from "@/lib/onboarding/types";
import { shouldSkipGateway } from "@/lib/onboarding/postLogin";
import { normalizeRole } from "@/lib/roles";
import {
  isValidTrack,
  resolveAcceleratorTrack,
  targetBandNumericFromTrack,
  type AcceleratorTrackId,
} from "@/lib/accelerator/tracks";
import { hasDashboardAccess, requiresProgrammePayment } from "@/lib/payments/access";

export const runtime = "nodejs";

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
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const role = normalizeRole((session?.user as { role?: string })?.role);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (shouldSkipGateway(role)) {
      return NextResponse.json({ error: "Onboarding not required for this account" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const programme = String(body.programme ?? "") as GatewayProgramme;
    const placementBand = Number(body.placementBand);

    if (!GATEWAY_PROGRAMME_IDS.includes(programme)) {
      return NextResponse.json({ error: "Invalid programme" }, { status: 400 });
    }

    if (!Number.isFinite(placementBand) || placementBand < 3.5 || placementBand > 9) {
      return NextResponse.json({ error: "Invalid placement band" }, { status: 400 });
    }

    const recommendation = recommendGatewayTrack(programme, placementBand);
    const targetBandLabel = targetBandFromRecommendation(programme, placementBand, recommendation);
    const cefrLevel = bandToPathwaySubLevel(placementBand);
    const dashboardPath = dashboardPathForProgramme(programme);

    const supabase = getSupabase();
    const { data: existingUser } = await supabase
      .from("users")
      .select(
        "accelerator_track, checkout_track, payment_status, payment_comped_until, enrolled_programs, program_selected"
      )
      .eq("id", studentId)
      .maybeSingle();

    const intentTrack = resolveAcceleratorTrack({
      checkoutTrack: existingUser?.checkout_track,
      acceleratorTrack: existingUser?.accelerator_track,
      placementBand,
    });

    const purchasedTrack: AcceleratorTrackId | null = isValidTrack(intentTrack)
      ? intentTrack
      : null;

    const paymentStatus = String(existingUser?.payment_status ?? "unpaid");
    const alreadyPaid =
      paymentStatus === "paid" ||
      hasDashboardAccess({
        role,
        paymentStatus,
        paymentCompedUntil: existingUser?.payment_comped_until,
        enrolledPrograms: enrolledProgramsForGateway(programme),
        programSelected: programme,
      });

    const targetBandNumeric = purchasedTrack
      ? targetBandNumericFromTrack(purchasedTrack)
      : Number(String(targetBandLabel).replace(/\+.*$/, "").trim()) || 6.5;

    let checkoutTrack: AcceleratorTrackId | null = purchasedTrack;

    if (
      (programme === "ielts" || programme === "ielts_general") &&
      recommendation.kind === programme &&
      !checkoutTrack
    ) {
      checkoutTrack = recommendation.track;
    }

    const updates: Record<string, unknown> = {
      onboarding_completed: true,
      placement_band: placementBand,
      program_selected: programme,
      cefr_level: cefrLevel,
      target_band: targetBandNumeric,
      placement_test_completed: true,
      program_type: programTypeForGateway(programme),
      enrolled_programs: enrolledProgramsForGateway(programme),
      step_enrolled: programme === "step",
    };

    if (checkoutTrack) {
      updates.checkout_track = checkoutTrack;
    }

    if (alreadyPaid && checkoutTrack) {
      updates.accelerator_track = checkoutTrack;
    }

    const { error } = await supabase.from("users").update(updates).eq("id", studentId);

    if (error) {
      const withoutOptional = { ...updates };
      delete withoutOptional.accelerator_track;
      delete withoutOptional.checkout_track;
      delete withoutOptional.program_selected;
      delete withoutOptional.placement_band;
      delete withoutOptional.placement_test_completed;

      const retry = await supabase.from("users").update(withoutOptional).eq("id", studentId);
      if (retry.error) {
        console.error("[onboarding/complete]", retry.error);
        return NextResponse.json({ error: "Could not save onboarding" }, { status: 500 });
      }
    }

    const needsPayment =
      (programme === "ielts" || programme === "ielts_general") &&
      requiresProgrammePayment({
        role,
        enrolledPrograms: enrolledProgramsForGateway(programme),
        programSelected: programme,
      }) &&
      !alreadyPaid;

    const nextPath = needsPayment ? "/checkout" : dashboardPath;

    return NextResponse.json({
      ok: true,
      nextPath,
      dashboardPath,
      needsPayment,
      recommendation,
      placementBand,
      cefrLevel,
      checkoutTrack,
      targetBand: purchasedTrack
        ? targetBandNumericFromTrack(purchasedTrack)
        : targetBandNumeric,
    });
  } catch (err) {
    console.error("[onboarding/complete]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
