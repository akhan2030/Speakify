import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DEFAULT_CEFR_LEVEL, todayDateKey } from "@/lib/vocabulary";
import { getSupabase, getSupabaseUrl, mapWordRow } from "@/lib/vocabularySupabase";

export const runtime = "nodejs";

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cefrLevel = searchParams.get("cefrLevel") || DEFAULT_CEFR_LEVEL;
    const mode = searchParams.get("mode") || "study";
    const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 10)));

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

      const { data: words, error } = await supabase
        .from("vocabulary_words")
        .select(
          "id, word, cefr_level, part_of_speech, definition, definition_arabic, pronunciation_ipa, example_sentence, ielts_example, memory_hook, topic_category, audio_url"
        )
        .in("id", wordIds);

      if (error) throw error;

      const order = new Map(wordIds.map((id, i) => [id, i]));
      const sorted = (words ?? [])
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        .map(mapWordRow);

      return NextResponse.json({ words: sorted, reviewComplete: false });
    }

    const { data: pool, error } = await supabase
      .from("vocabulary_words")
      .select(
        "id, word, cefr_level, part_of_speech, definition, definition_arabic, pronunciation_ipa, example_sentence, ielts_example, memory_hook, topic_category, audio_url"
      )
      .eq("cefr_level", cefrLevel);

    if (error) throw error;

    const words = shuffle(pool ?? [])
      .slice(0, limit)
      .map(mapWordRow);

    return NextResponse.json({ words });
  } catch (err) {
    console.error("[vocabulary/words]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load words" },
      { status: 500 }
    );
  }
}
