import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  scoreReadingAttempt,
  calculateEstimatedBand,
} from "../../../../lib/readingScorer.js";

export const runtime = "nodejs";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} studentId
 * @param {string} questionType
 * @param {number} score
 * @param {number} total
 */
async function upsertTracker(supabase, studentId, questionType, score, total) {
  const { data: existing, error: readError } = await supabase
    .from("reading_tracker")
    .select("*")
    .eq("student_id", studentId)
    .eq("question_type", questionType)
    .maybeSingle();

  if (readError) {
    console.warn("[reading/submit] tracker read:", readError.message);
  }

  const prevAttempts = existing?.attempts ?? 0;
  const prevCorrect = existing?.correct_answers ?? 0;
  const prevTotalQuestions = existing?.total_questions ?? 0;

  const newAttempts = prevAttempts + 1;
  const newCorrect = prevCorrect + score;
  const newTotalQuestions = prevTotalQuestions + total;
  const newAccuracy =
    newTotalQuestions > 0 ? (newCorrect / newTotalQuestions) * 100 : 0;

  const trackerPayload = {
    student_id: studentId,
    question_type: questionType,
    attempts: newAttempts,
    correct_answers: newCorrect,
    total_questions: newTotalQuestions,
    accuracy: Math.round(newAccuracy * 10) / 10,
    estimated_band: calculateEstimatedBand(newAccuracy),
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from("reading_tracker")
    .upsert(trackerPayload, { onConflict: "student_id,question_type" });

  if (upsertError) {
    const fallbackPayload = {
      student_id: studentId,
      question_type: questionType,
      attempts: newAttempts,
      accuracy: Math.round(newAccuracy * 10) / 10,
      estimated_band: calculateEstimatedBand(newAccuracy),
    };

    const { error: fallbackError } = await supabase
      .from("reading_tracker")
      .upsert(fallbackPayload, { onConflict: "student_id,question_type" });

    if (fallbackError) {
      console.warn("[reading/submit] tracker upsert:", fallbackError.message);
    }
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const testType = body?.testType;
    const testId = body?.testId ?? body?.passageId;
    const passageId = body?.passageId ?? testId;
    const questionType = body?.questionType;
    const answers = body?.answers ?? {};
    const correctAnswers = body?.correctAnswers ?? {};
    const alternativesById = body?.alternativesById ?? {};
    const timeTakenSeconds = Number(body?.timeTakenSeconds ?? 0);
    const timedOut = Boolean(body?.timedOut);
    const passageBreakdown = body?.passageBreakdown ?? [];
    const typeBreakdown = body?.typeBreakdown ?? [];

    if (!passageId || !questionType || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { score, total, accuracy, estimatedBand } = scoreReadingAttempt(
      answers,
      correctAnswers,
      { alternativesById }
    );

    const hasSupabase =
      Boolean(process.env.SUPABASE_SERVICE_KEY) && Boolean(getSupabaseUrl());

    if (hasSupabase) {
      const supabase = getSupabase();

      const attemptRow = {
        student_id: studentId,
        passage_id: passageId,
        question_type: questionType,
        answers: {
          ...answers,
          __meta: {
            testType: testType ?? "practice",
            testId,
            passageBreakdown,
            typeBreakdown,
          },
        },
        score,
        total,
        accuracy,
        estimated_band: estimatedBand,
        time_taken_seconds: timeTakenSeconds,
        timed_out: timedOut,
      };

      const { error: attemptError } = await supabase
        .from("reading_attempts")
        .insert(attemptRow);

      if (attemptError) {
        console.warn("[reading/submit] attempt insert:", attemptError.message);
      }

      if (
        (testType === "full" || testType === "passage") &&
        Array.isArray(typeBreakdown) &&
        typeBreakdown.length > 0
      ) {
        for (const row of typeBreakdown) {
          if (!row?.questionType) continue;
          await upsertTracker(
            supabase,
            studentId,
            row.questionType,
            Number(row.score ?? 0),
            Number(row.total ?? 0)
          );
        }
      } else {
        await upsertTracker(supabase, studentId, questionType, score, total);
      }
    }

    return NextResponse.json({
      success: true,
      score,
      total,
      accuracy: Math.round(accuracy * 10) / 10,
      estimatedBand,
      passageBreakdown,
      typeBreakdown,
    });
  } catch (err) {
    console.error("[reading/submit]", err);
    return NextResponse.json(
      { error: "Failed to submit answers" },
      { status: 500 }
    );
  }
}
