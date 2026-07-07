import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { scoreGtReadingAnswers, gtReadingRawToBand } from "@/lib/ielts-general/readingScore";
import type { GtReadingQuestion } from "@/lib/ielts-general/readingContent";
import {
  gtAttemptInsertRow,
  gtHistoryInsertRow,
} from "@/lib/ielts-general/attemptRows.js";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const questions = Array.isArray(body.questions) ? (body.questions as GtReadingQuestion[]) : [];
  const answers =
    body.answers && typeof body.answers === "object"
      ? (body.answers as Record<string, string>)
      : {};
  const mode = String(body.mode ?? "section");
  const section = body.section ? String(body.section) : null;

  if (questions.length === 0) {
    return NextResponse.json({ error: "No questions provided" }, { status: 400 });
  }

  const passageSectionByQuestionId =
    body.passageSectionByQuestionId && typeof body.passageSectionByQuestionId === "object"
      ? (body.passageSectionByQuestionId as Record<string, "A" | "B" | "C">)
      : undefined;

  const sectionBreakdown = body.sectionBreakdown as
    | { A?: { correct: number; total: number }; B?: { correct: number; total: number }; C?: { correct: number; total: number } }
    | undefined;

  const result = scoreGtReadingAnswers(questions, answers, { passageSectionByQuestionId });

  if (process.env.SUPABASE_SERVICE_KEY) {
    const supabase = getSupabase();
    const completedAt = new Date().toISOString();
    const row = gtAttemptInsertRow({
      studentId,
      skill: "reading",
      bandScore: result.estimatedBand,
      accuracy: result.accuracy / 100,
      completedAt,
    });

    if (sectionBreakdown || result.sectionBreakdown) {
      const breakdown = sectionBreakdown ?? result.sectionBreakdown;
      if (breakdown) {
        for (const sec of ["A", "B", "C"] as const) {
          const row = breakdown[sec];
          if (!row?.total) continue;
          await supabase.from("ielts_general_attempts").insert(
            gtAttemptInsertRow({
              studentId,
              skill: `reading_section_${sec.toLowerCase()}`,
              bandScore: gtReadingRawToBand(row.correct, row.total),
              accuracy: row.correct / row.total,
              completedAt,
            })
          );
        }
      }
    }

    const { error } = await supabase.from("ielts_general_attempts").insert(row);
    if (error && !error.message?.includes("does not exist")) {
      console.warn("[ielts-general/reading/attempt]", error.message);
    }

    const historyRow = gtHistoryInsertRow({
      studentId,
      skill: "reading",
      bandScore: result.estimatedBand,
      recordedAt: completedAt,
    });
    const historyRes = await supabase.from("ielts_general_student_history").insert(historyRow);
    if (historyRes.error && !historyRes.error.message?.includes("does not exist")) {
      console.warn("[ielts-general/reading/attempt] history", historyRes.error.message);
    }
  }

  return NextResponse.json({
    ok: true,
    mode,
    section,
    ...result,
  });
}
