import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  generateProgressChartInsight,
  normalizeCriteriaHistory,
} from "@/lib/speaking/progressChartInsight";
import { buildTodayVocabularyFromSessions } from "@/lib/speaking/scoreEvidence";

export const runtime = "nodejs";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
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
      chartInsight: null,
      lastSessionAt: null,
      todayVocabulary: [],
      vocabularySource:
        "Built from lexical_resource deductions + transcript of recent scored sessions (personalized first; general backfill labeled).",
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

    // Today's vocabulary: derive from recent scored sessions' transcripts + lexical deductions.
    // Do NOT read a static bank of generic words as if they were personalized.
    const { data: recentScored } = await supabase
      .from("speaking_sessions")
      .select("id, feedback, completed_at")
      .eq("student_id", studentId)
      .not("completed_at", "is", null)
      .not("feedback", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5);

    const todayVocabulary = buildTodayVocabularyFromSessions(recentScored ?? [], 5);

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

    const { data: scoredSessions } = await supabase
      .from("speaking_sessions")
      .select(
        "session_number, overall_band, fluency_band, lexical_band, grammar_band, pronunciation_band, completed_at"
      )
      .eq("student_id", studentId)
      .not("completed_at", "is", null)
      .not("overall_band", "is", null)
      .order("session_number", { ascending: true });

    const criteriaBandHistory = normalizeCriteriaHistory(
      progress?.band_history ?? [],
      scoredSessions ?? []
    );
    const chartInsight = generateProgressChartInsight(criteriaBandHistory);

    return NextResponse.json({
      totalSessions: progress?.total_sessions ?? 0,
      currentBand: progress?.current_band ?? null,
      bestBand: progress?.best_band ?? null,
      totalMinutes,
      bandHistory: criteriaBandHistory,
      chartInsight,
      lastSessionAt: progress?.last_session_at ?? null,
      todayVocabulary,
      vocabularySource:
        "buildTodayVocabularyFromSessions(recent feedback.structuredScore + session transcript). Personalized upgrades from lexical deductions / overused words; general backfill only if fewer than 5 and labeled personalized:false.",
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
      chartInsight: null,
      todayVocabulary: [],
      vocabularySource: null,
      lastImprovementTip: null,
    });
  }
}
