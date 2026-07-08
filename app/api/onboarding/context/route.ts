import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  ACCELERATOR_TRACKS,
  isValidTrack,
  resolveAcceleratorTrack,
  type AcceleratorTrackId,
} from "@/lib/accelerator/tracks";
import { resolvePaidProgramme, checkoutTrackLabel } from "@/lib/payments/checkoutLabels";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ purchasedTrack: null });
    }

    const supabase = getSupabase();
    const { data: user } = await supabase
      .from("users")
      .select(
        "checkout_track, accelerator_track, payment_status, placement_band, program_type, program_selected, enrolled_programs"
      )
      .eq("id", studentId)
      .maybeSingle();

    const intentRaw = resolveAcceleratorTrack({
      checkoutTrack: user?.checkout_track,
      acceleratorTrack: user?.accelerator_track,
      placementBand: user?.placement_band,
    });

    const purchasedTrack: AcceleratorTrackId | null = isValidTrack(intentRaw)
      ? intentRaw
      : null;

    if (!purchasedTrack) {
      return NextResponse.json({ purchasedTrack: null });
    }

    const meta = ACCELERATOR_TRACKS[purchasedTrack];
    const programme = resolvePaidProgramme({
      enrolledPrograms: user?.enrolled_programs,
      programSelected: user?.program_selected ?? user?.program_type,
    });
    return NextResponse.json({
      purchasedTrack,
      programme,
      trackLabel: checkoutTrackLabel(programme, purchasedTrack),
      programLine: programme === "ielts_general"
        ? "IELTS General Training Accelerator"
        : "IELTS Academic Accelerator",
      target: meta.target,
      weeks: meta.weekCount,
      duration: meta.duration,
      price: meta.price,
      isIeltsAccelerator: true,
      isPaidIntent: String(user?.checkout_track ?? "").length > 0,
    });
  } catch (err) {
    console.error("[onboarding/context]", err);
    return NextResponse.json({ purchasedTrack: null });
  }
}
