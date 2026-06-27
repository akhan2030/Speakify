import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DEFAULT_CEFR_LEVEL, normalizeSpeakifyCefrLevel } from "@/lib/vocabulary";
import {
  getSupabase,
  getSupabaseUrl,
  upsertWordProgress,
} from "@/lib/vocabularySupabase";
import { syncLevelStatus } from "@/lib/vocabularyStudy";
import { generatePersonalVocabularyTopup } from "@/lib/vocabularyAiTopup";

export const runtime = "nodejs";

const VALID_RATINGS = new Set(["again", "hard", "good", "easy"]);

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!getSupabaseUrl() || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json();
    const wordId = String(body?.wordId ?? "").trim();
    const rating = String(body?.rating ?? "").trim();
    const cefrLevel = normalizeSpeakifyCefrLevel(
      String(body?.cefrLevel ?? DEFAULT_CEFR_LEVEL).trim()
    );

    if (!wordId || !VALID_RATINGS.has(rating)) {
      return NextResponse.json({ error: "Invalid wordId or rating" }, { status: 400 });
    }

    const supabase = getSupabase();
    const result = await upsertWordProgress(supabase, studentId, {
      wordId,
      rating,
      cefrLevel,
    });

    const mastery = await syncLevelStatus(supabase, studentId, cefrLevel);

    let topup = null;
    if (mastery.readyForTopup) {
      const { data: status } = await supabase
        .from("student_vocab_level_status")
        .select("ai_topup_count")
        .eq("student_id", studentId)
        .eq("cefr_level", mastery.level)
        .maybeSingle();

      if ((status?.ai_topup_count ?? 0) === 0) {
        try {
          const { data: existingWords } = await supabase
            .from("vocabulary_words")
            .select("word")
            .eq("cefr_level", mastery.level)
            .or(`student_id.is.null,student_id.eq.${studentId}`);

          topup = await generatePersonalVocabularyTopup({
            supabase,
            studentId,
            cefrLevel: mastery.level,
            excludeWords: (existingWords ?? []).map((r) => r.word),
          });
        } catch (topupErr) {
          console.warn("[vocabulary/progress] AI top-up skipped:", topupErr);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      ...result,
      mastery,
      topup: topup ? { generated: topup.generated, level: topup.level } : null,
    });
  } catch (err) {
    console.error("[vocabulary/progress]", err);
    const message = err instanceof Error ? err.message : "Failed to save progress";
    if (message.includes("student_vocab_progress")) {
      return NextResponse.json(
        {
          error:
            "Progress table missing. Run supabase/student_vocab_progress_setup.sql in Supabase.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
