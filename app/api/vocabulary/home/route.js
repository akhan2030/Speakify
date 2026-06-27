import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  SPEAKIFY_CEFR_LEVELS,
  DEFAULT_CEFR_LEVEL,
  normalizeSpeakifyCefrLevel,
  todayDateKey,
} from "@/lib/vocabulary";
import { coreTargetForLevel } from "@/lib/vocabularyLevels.js";
import {
  computeStreak,
  getSupabase,
  getSupabaseUrl,
} from "@/lib/vocabularySupabase";
import { buildStudyQueue, getLevelProgressSummary } from "@/lib/vocabularyStudy";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cefrLevel = normalizeSpeakifyCefrLevel(
      searchParams.get("cefrLevel") || DEFAULT_CEFR_LEVEL
    );

    if (!getSupabaseUrl() || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({
        cefrLevel,
        streak: 0,
        dueCount: 0,
        todaysWords: [],
        levelProgress: SPEAKIFY_CEFR_LEVELS.map((level) => ({
          level,
          learned: 0,
          total: coreTargetForLevel(level),
          percent: 0,
        })),
      });
    }

    const supabase = getSupabase();
    const today = todayDateKey();
    let dueCount = 0;
    let streak = 0;

    const [
      queueResult,
      dueResult,
      streakResult,
    ] = await Promise.all([
      buildStudyQueue(supabase, studentId, cefrLevel, 10),
      supabase
        .from("student_vocab_progress")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .lte("next_review", today),
      computeStreak(supabase, studentId).catch(() => 0),
    ]);

    if (!dueResult.error) dueCount = dueResult.count ?? 0;
    streak = streakResult ?? 0;

    const todaysWords = queueResult.words ?? [];
    const levelProgress = await getLevelProgressSummary(supabase, studentId);

    return NextResponse.json({
      cefrLevel,
      streak,
      dueCount,
      todaysWords: todaysWords.slice(0, 10),
      levelProgress,
    });
  } catch (err) {
    console.error("[vocabulary/home]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load home" },
      { status: 500 }
    );
  }
}
