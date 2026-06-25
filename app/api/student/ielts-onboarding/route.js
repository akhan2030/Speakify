import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import {
  ACCELERATOR_TRACKS,
  recommendTrack,
} from "@/lib/accelerator/tracks";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
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

    const profile = await fetchStudentProfile(studentId);
    const placementBand =
      profile.placementBand ?? profile.currentBand ?? profile.skillBands?.reading ?? null;
    const trackId = recommendTrack(placementBand);
    const track = ACCELERATOR_TRACKS[trackId];

    let userRow = null;
    if (process.env.SUPABASE_SERVICE_KEY) {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("users")
        .select(
          "name, target_band, ielts_exam_date, study_days_per_week, preferred_study_time, onboarding_completed"
        )
        .eq("id", studentId)
        .maybeSingle();
      userRow = data;
    }

    return NextResponse.json({
      completed: Boolean(userRow?.onboarding_completed),
      name: userRow?.name ?? session.user?.name ?? "Student",
      placementBand,
      targetBand: profile.targetBand,
      recommendedTrack: trackId,
      recommendedTrackName: track.name,
      trackTarget: track.target,
      examDate: userRow?.ielts_exam_date ?? null,
      studyDaysPerWeek: userRow?.study_days_per_week ?? 5,
      preferredStudyTime: userRow?.preferred_study_time ?? "evening",
    });
  } catch (err) {
    console.error("[ielts-onboarding GET]", err);
    return NextResponse.json({ error: "Failed to load onboarding" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const body = await request.json();
    const supabase = getSupabase();

    const updates = {
      onboarding_completed: true,
      ielts_exam_date: body.ielts_exam_date || null,
      study_days_per_week: Number(body.study_days_per_week) || 5,
      preferred_study_time: body.preferred_study_time || "evening",
    };

    const { error } = await supabase.from("users").update(updates).eq("id", studentId);
    if (error) throw error;

    return NextResponse.json({ ok: true, completed: true });
  } catch (err) {
    console.error("[ielts-onboarding POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save onboarding" },
      { status: 500 }
    );
  }
}
