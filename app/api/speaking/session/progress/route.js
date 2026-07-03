import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function todayDateString() {
  return new Date().toISOString().split("T")[0];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const empty = {
      totalSessions: 0,
      currentBand: null,
      bestBand: null,
      totalMinutes: 0,
      bandHistory: [],
      lastSessionAt: null,
      todayVocabulary: [],
      lastImprovementTip: null,
    };

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json(empty);
    }

    const supabase = createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: progress } = await supabase
      .from("speaking_progress")
      .select("total_sessions, current_band, best_band, band_history, last_session_at")
      .eq("student_id", studentId)
      .maybeSingle();

    const { data: completedSessions } = await supabase
      .from("speaking_sessions")
      .select("duration_minutes, started_at, completed_at")
      .eq("student_id", studentId)
      .not("completed_at", "is", null);

    let totalMinutes = 0;
    for (const row of completedSessions ?? []) {
      if (row.duration_minutes != null) {
        totalMinutes += row.duration_minutes;
      } else if (row.started_at && row.completed_at) {
        const mins = Math.round(
          (new Date(row.completed_at).getTime() - new Date(row.started_at).getTime()) / 60000
        );
        totalMinutes += Math.max(1, mins);
      }
    }

    const today = todayDateString();
    const { data: vocabRows } = await supabase
      .from("speaking_vocabulary_progress")
      .select("id, word, practiced")
      .eq("student_id", studentId)
      .eq("assigned_date", today)
      .eq("practiced", false)
      .limit(5);

    const { data: lastSession } = await supabase
      .from("speaking_sessions")
      .select("feedback")
      .eq("student_id", studentId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let lastImprovementTip = null;
    const feedback = lastSession?.feedback;
    if (feedback?.topImprovements?.length > 0) {
      const top = feedback.topImprovements[0];
      lastImprovementTip =
        top.suggestion ||
        top.issue ||
        (top.studentQuote && top.improvedVersion
          ? `"${top.studentQuote}" → ${top.improvedVersion}`
          : null);
    }

    return NextResponse.json({
      totalSessions: progress?.total_sessions ?? 0,
      currentBand: progress?.current_band ?? null,
      bestBand: progress?.best_band ?? null,
      totalMinutes,
      bandHistory: progress?.band_history ?? [],
      lastSessionAt: progress?.last_session_at ?? null,
      todayVocabulary: (vocabRows ?? []).map((r) => ({ id: r.id, word: r.word })),
      lastImprovementTip,
    });
  } catch (err) {
    console.error("[speaking/session/progress]", err);
    return NextResponse.json({
      totalSessions: 0,
      currentBand: null,
      bestBand: null,
      totalMinutes: 0,
      bandHistory: [],
      todayVocabulary: [],
      lastImprovementTip: null,
    });
  }
}
