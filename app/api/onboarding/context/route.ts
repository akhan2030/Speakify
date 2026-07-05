import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  ACCELERATOR_TRACKS,
  isValidTrack,
  type AcceleratorTrackId,
} from "@/lib/accelerator/tracks";

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
      .select("accelerator_track, program_type, enrolled_programs")
      .eq("id", studentId)
      .maybeSingle();

    const raw = String(user?.accelerator_track ?? "").trim().toLowerCase();
    const purchasedTrack: AcceleratorTrackId | null = isValidTrack(raw) ? raw : null;

    if (!purchasedTrack) {
      return NextResponse.json({ purchasedTrack: null });
    }

    const meta = ACCELERATOR_TRACKS[purchasedTrack];
    return NextResponse.json({
      purchasedTrack,
      trackLabel: `IELTS ${meta.name}`,
      target: meta.target,
      weeks: meta.weekCount,
      duration: meta.duration,
      isIeltsAccelerator: true,
    });
  } catch (err) {
    console.error("[onboarding/context]", err);
    return NextResponse.json({ purchasedTrack: null });
  }
}
