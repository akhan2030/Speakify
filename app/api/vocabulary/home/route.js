import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  CEFR_LEVELS,
  DEFAULT_CEFR_LEVEL,
  todayBounds,
  todayDateKey,
} from "@/lib/vocabulary";
import {
  computeStreak,
  getSupabase,
  getSupabaseUrl,
  mapWordRow,
} from "@/lib/vocabularySupabase";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cefrLevel = searchParams.get("cefrLevel") || DEFAULT_CEFR_LEVEL;

    if (!getSupabaseUrl() || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({
        cefrLevel,
        streak: 0,
        dueCount: 0,
        todaysWords: [],
        levelProgress: CEFR_LEVELS.map((level) => ({
          level,
          learned: 0,
          total: 0,
          percent: 0,
        })),
      });
    }

    const supabase = getSupabase();
    const today = todayDateKey();
    const { start, end } = todayBounds(today);

    let dueCount = 0;
    let progressRows = [];
    let streak = 0;

    const [
      todayWordsResult,
      dueResult,
      progressResult,
      levelCountsResult,
      streakResult,
    ] = await Promise.all([
      supabase
        .from("vocabulary_words")
        .select(
          "id, word, cefr_level, part_of_speech, definition, definition_arabic, pronunciation_ipa, example_sentence, ielts_example, memory_hook, topic_category, audio_url, created_at"
        )
        .eq("cefr_level", cefrLevel)
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("student_vocab_progress")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .lte("next_review", today),
      supabase
        .from("student_vocab_progress")
        .select("word_id, cefr_level")
        .eq("student_id", studentId),
      supabase.from("vocabulary_words").select("cefr_level"),
      computeStreak(supabase, studentId).catch(() => 0),
    ]);

    if (!dueResult.error) dueCount = dueResult.count ?? 0;
    if (!progressResult.error) progressRows = progressResult.data ?? [];
    streak = streakResult ?? 0;

    let todaysWords = (todayWordsResult.data ?? []).map(mapWordRow);

    if (todaysWords.length < 10) {
      const { data: fallback } = await supabase
        .from("vocabulary_words")
        .select(
          "id, word, cefr_level, part_of_speech, definition, definition_arabic, pronunciation_ipa, example_sentence, ielts_example, memory_hook, topic_category, audio_url, created_at"
        )
        .eq("cefr_level", cefrLevel)
        .order("created_at", { ascending: false })
        .limit(10);

      const seen = new Set(todaysWords.map((w) => w.id));
      for (const row of fallback ?? []) {
        if (todaysWords.length >= 10) break;
        if (!seen.has(row.id)) {
          todaysWords.push(mapWordRow(row));
          seen.add(row.id);
        }
      }
    }

    const learnedByLevel = {};
    for (const row of progressRows) {
      const level = row.cefr_level;
      if (!level) continue;
      learnedByLevel[level] = (learnedByLevel[level] ?? 0) + 1;
    }

    const totalByLevel = {};
    for (const row of levelCountsResult.data ?? []) {
      const level = row.cefr_level;
      if (!level) continue;
      totalByLevel[level] = (totalByLevel[level] ?? 0) + 1;
    }

    const levelProgress = CEFR_LEVELS.map((level) => {
      const learned = learnedByLevel[level] ?? 0;
      const total = totalByLevel[level] ?? 0;
      const percent = total > 0 ? Math.round((learned / total) * 100) : 0;
      return { level, learned, total, percent };
    });

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
