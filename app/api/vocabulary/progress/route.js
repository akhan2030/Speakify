import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DEFAULT_CEFR_LEVEL } from "@/lib/vocabulary";
import {
  getSupabase,
  getSupabaseUrl,
  upsertWordProgress,
} from "@/lib/vocabularySupabase";

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
    const cefrLevel = String(body?.cefrLevel ?? DEFAULT_CEFR_LEVEL).trim();

    if (!wordId || !VALID_RATINGS.has(rating)) {
      return NextResponse.json({ error: "Invalid wordId or rating" }, { status: 400 });
    }

    const supabase = getSupabase();
    const result = await upsertWordProgress(supabase, studentId, {
      wordId,
      rating,
      cefrLevel,
    });

    return NextResponse.json({ ok: true, ...result });
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
