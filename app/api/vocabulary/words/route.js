import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  DEFAULT_CEFR_LEVEL,
  normalizeSpeakifyCefrLevel,
  todayDateKey,
  VOCAB_SESSION_SIZE,
} from "@/lib/vocabulary";
import { getSupabase, getSupabaseUrl, fetchVocabularyWordsByIds, mapWordRow } from "@/lib/vocabularySupabase";
import { buildStudyQueue, buildTopicStudyQueue } from "@/lib/vocabularyStudy";

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
    const mode = searchParams.get("mode") || "study";
    const topic = searchParams.get("topic")?.trim().toLowerCase() || null;
    const limit = Math.min(
      20,
      Math.max(1, Number(searchParams.get("limit") || VOCAB_SESSION_SIZE))
    );

    if (!getSupabaseUrl() || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ words: [] });
    }

    const supabase = getSupabase();
    const today = todayDateKey();

    if (mode === "review") {
      const { data: dueProgress, error: progressErr } = await supabase
        .from("student_vocab_progress")
        .select("word_id, next_review")
        .eq("student_id", studentId)
        .lte("next_review", today)
        .order("next_review", { ascending: true })
        .limit(limit);

      if (progressErr) {
        return NextResponse.json({ words: [], reviewComplete: true });
      }

      const wordIds = (dueProgress ?? []).map((r) => r.word_id).filter(Boolean);
      if (!wordIds.length) {
        const { data: nextRow } = await supabase
          .from("student_vocab_progress")
          .select("next_review")
          .eq("student_id", studentId)
          .gt("next_review", today)
          .order("next_review", { ascending: true })
          .limit(1)
          .maybeSingle();

        return NextResponse.json({
          words: [],
          reviewComplete: true,
          nextReviewDate: nextRow?.next_review ?? null,
        });
      }

      const words = await fetchVocabularyWordsByIds(supabase, wordIds);

      const order = new Map(wordIds.map((id, i) => [id, i]));
      const sorted = words
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        .map(mapWordRow);

      return NextResponse.json({ words: sorted, reviewComplete: false });
    }

    console.log("[vocabulary/words] study query", {
      table: "vocabulary_words",
      cefrLevel,
      rawCefrParam: searchParams.get("cefrLevel"),
      mode,
      topic,
      limit,
      studentId,
    });

    const { words, meta } = topic
      ? await buildTopicStudyQueue(supabase, studentId, cefrLevel, topic, limit)
      : await buildStudyQueue(supabase, studentId, cefrLevel, limit);

    console.log("[vocabulary/words] study response", {
      cefrLevel,
      wordCount: words.length,
      sampleWords: words.slice(0, 5).map((w) => w.word),
      meta,
    });

    return NextResponse.json({ words, meta });
  } catch (err) {
    console.error("[vocabulary/words]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load words" },
      { status: 500 }
    );
  }
}
