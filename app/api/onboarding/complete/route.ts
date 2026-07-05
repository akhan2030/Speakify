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
import type { GatewayProgramme } from "@/lib/onboarding/types";
import { shouldSkipGateway } from "@/lib/onboarding/postLogin";
import { normalizeRole } from "@/lib/roles";
import {
  isValidTrack,
  targetBandNumericFromTrack,
  type AcceleratorTrackId,
} from "@/lib/accelerator/tracks";

export const runtime = "nodejs";

const VALID_PROGRAMMES: GatewayProgramme[] = [
  "ielts",
  "pathway",
  "step",
  "business_english",
];

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

    if (!VALID_PROGRAMMES.includes(programme)) {
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
      .select("accelerator_track")
      .eq("id", studentId)
      .maybeSingle();

    const purchasedRaw = String(existingUser?.accelerator_track ?? "").trim().toLowerCase();
    const purchasedTrack: AcceleratorTrackId | null = isValidTrack(purchasedRaw)
      ? purchasedRaw
      : null;

    const targetBandNumeric = purchasedTrack
      ? targetBandNumericFromTrack(purchasedTrack)
      : Number(String(targetBandLabel).replace(/\+.*$/, "").trim()) || 6.5;

    const updates: Record<string, unknown> = {
      onboarding_completed: true,
      placement_band: placementBand,
      program_selected: programme,
      cefr_level: cefrLevel,
      target_band: targetBandNumeric,
      placement_test_completed: true,
    };

    if (programme === "ielts") {
      updates.program_type = "ielts";
      updates.enrolled_programs = ["ielts"];
      if (
        recommendation.kind === "ielts" &&
        !existingUser?.accelerator_track
      ) {
        updates.accelerator_track = recommendation.track;
      }
    } else if (programme === "pathway") {
      updates.program_type = "pathway";
      updates.enrolled_programs = ["pathway"];
    } else if (programme === "step") {
      updates.program_type = "ielts";
      updates.step_enrolled = true;
      updates.enrolled_programs = ["step"];
    } else if (programme === "business_english") {
      updates.program_type = "business_english";
      updates.enrolled_programs = ["business_english"];
    }

    const { error } = await supabase.from("users").update(updates).eq("id", studentId);

    if (error) {
      const withoutOptional = { ...updates };
      delete withoutOptional.accelerator_track;
      delete withoutOptional.program_selected;
      delete withoutOptional.placement_band;
      delete withoutOptional.placement_test_completed;

      const retry = await supabase.from("users").update(withoutOptional).eq("id", studentId);
      if (retry.error) {
        console.error("[onboarding/complete]", retry.error);
        return NextResponse.json({ error: "Could not save onboarding" }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      dashboardPath,
      recommendation,
      placementBand,
      cefrLevel,
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
