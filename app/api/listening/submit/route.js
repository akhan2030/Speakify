import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  scoreListeningAnswers,
  calculateListeningBand,
  getQuestionTypeById,
} from "../../../../lib/listeningGenerator.js";
import {
  MAX_DAILY_SECTION_TESTS,
  MAX_DAILY_MOCK_TESTS,
  MAX_DAILY_PRACTICE_TESTS,
} from "../../../../lib/listeningDailyLimit.js";
import { computeSectionScores } from "../../../../lib/listeningMockResults.js";
import {
  CONTENT_TYPE_FULL_MOCK,
  CONTENT_TYPE_SECTION_PRACTICE,
  recordContentHistory,
} from "../../../../lib/listeningContentPool.js";

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

function getTodayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function resolveStudentId(session, bodyStudentId) {
  const sessionId = session?.user?.id;
  if (!sessionId) return null;
  if (bodyStudentId && bodyStudentId !== sessionId) return null;
  return sessionId;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => null);
    const studentId = resolveStudentId(session, body?.studentId);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const answers = body?.answers ?? {};
    const correctAnswers = body?.correctAnswers ?? {};
    const questionTypeId = String(body?.questionType ?? "");
    const sectionNumber = Number(body?.sectionNumber ?? 0);
    const testType = String(body?.testType ?? "section").toLowerCase();
    const timeTakenSeconds = Number(body?.timeTakenSeconds ?? 0);
    const timedOut = Boolean(body?.timedOut);

    const sortedKeys = Object.keys(correctAnswers).sort(
      (a, b) => Number(a) - Number(b)
    );

    const correctList = sortedKeys.map((key) => correctAnswers[key]);
    const questionNumbers = sortedKeys.map((key) => Number(key));

    const studentList = sortedKeys.map(
      (key) => answers[key] ?? answers[String(key)] ?? ""
    );

    const scored = scoreListeningAnswers(studentList, correctList);
    const band = calculateListeningBand(scored.score, scored.total);
    const sectionScores =
      testType === "mock"
        ? computeSectionScores(scored, questionNumbers)
        : null;
    const bankTestId = body?.bankTestId ? String(body.bankTestId) : null;
    const bankContentType = body?.contentType
      ? String(body.contentType)
      : null;
    const bankRowId = body?.bankRowId ? Number(body.bankRowId) : null;

    const testId =
      testType === "mock"
        ? String(bankTestId ?? body?.testId ?? `mock-${Date.now()}`)
        : bankTestId;

    const qTypeMeta = getQuestionTypeById(questionTypeId);
    const trackerName = qTypeMeta?.trackerName ?? questionTypeId;
    let mockAttemptId;

    if (process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      const supabase = getSupabase();
      const isTeacher = session?.user?.role === "teacher";

      const completedAt = new Date().toISOString();

      if (testType === "mock") {
        const { data: attemptRow, error: attemptError } = await supabase
          .from("listening_attempts")
          .insert({
            student_id: studentId,
            test_id: testId,
            test_type: "mock",
            score: scored.score,
            total: scored.total,
            band,
            section_scores: sectionScores,
            answers,
            correct_answers: correctAnswers,
            accuracy: scored.accuracy,
            time_taken_seconds: timeTakenSeconds,
            timed_out: timedOut,
            completed_at: completedAt,
          })
          .select("id")
          .single();

        if (attemptError) {
          console.error("[listening/submit] mock attempt insert:", attemptError);
        } else {
          mockAttemptId = attemptRow?.id;
        }

        if (bankTestId && bankContentType === CONTENT_TYPE_FULL_MOCK) {
          await recordContentHistory(supabase, {
            studentId,
            contentType: CONTENT_TYPE_FULL_MOCK,
            testId: bankTestId,
            sectionNumber: 0,
            bankRowId: null,
          });
        }
      } else {
        await supabase.from("listening_attempts").insert({
          student_id: studentId,
          test_id: testId,
          section: sectionNumber || null,
          question_type: questionTypeId,
          test_type: testType,
          score: scored.score,
          total: scored.total,
          band,
          section_scores: sectionScores,
          answers,
          correct_answers: correctAnswers,
          accuracy: scored.accuracy,
          time_taken_seconds: timeTakenSeconds,
          timed_out: timedOut,
          completed_at: completedAt,
        });

        if (
          bankTestId &&
          bankContentType === CONTENT_TYPE_SECTION_PRACTICE &&
          sectionNumber
        ) {
          await recordContentHistory(supabase, {
            studentId,
            contentType: CONTENT_TYPE_SECTION_PRACTICE,
            testId: bankTestId,
            sectionNumber,
            bankRowId: bankRowId || null,
          });
        }
      }

      const { data: existingTracker } = await supabase
        .from("listening_tracker")
        .select("total_attempts, correct_answers")
        .eq("student_id", studentId)
        .eq("question_type", trackerName)
        .maybeSingle();

      const prevAttempts = Number(existingTracker?.total_attempts ?? 0);
      const prevCorrect = Number(existingTracker?.correct_answers ?? 0);
      const newAttempts = prevAttempts + scored.total;
      const newCorrect = prevCorrect + scored.score;
      const accuracy =
        newAttempts > 0
          ? Math.round((newCorrect / newAttempts) * 1000) / 10
          : 0;
      const estimatedBand = calculateListeningBand(newCorrect, newAttempts);

      await supabase.from("listening_tracker").upsert(
        {
          student_id: studentId,
          question_type: trackerName,
          total_attempts: newAttempts,
          correct_answers: newCorrect,
          accuracy,
          estimated_band: estimatedBand,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,question_type" }
      );

      if (!isTeacher) {
        const testDate = getTodayDateKey();
        const { data: limitRow } = await supabase
          .from("listening_daily_limits")
          .select("section_tests_taken, mock_tests_taken, practice_tests_taken")
          .eq("student_id", studentId)
          .eq("test_date", testDate)
          .maybeSingle();

        let sectionUsed = Number(limitRow?.section_tests_taken ?? 0);
        let mockUsed = Number(limitRow?.mock_tests_taken ?? 0);
        let practiceUsed = Number(limitRow?.practice_tests_taken ?? 0);

        if (testType === "mock" && mockUsed < MAX_DAILY_MOCK_TESTS) {
          mockUsed += 1;
        } else if (
          testType === "practice" &&
          practiceUsed < MAX_DAILY_PRACTICE_TESTS
        ) {
          practiceUsed += 1;
        } else if (
          testType === "section" &&
          sectionUsed < MAX_DAILY_SECTION_TESTS
        ) {
          sectionUsed += 1;
        }

        await supabase.from("listening_daily_limits").upsert(
          {
            student_id: studentId,
            test_date: testDate,
            section_tests_taken: sectionUsed,
            mock_tests_taken: mockUsed,
            practice_tests_taken: practiceUsed,
            last_test_at: new Date().toISOString(),
          },
          { onConflict: "student_id,test_date" }
        );
      }
    }

    return NextResponse.json({
      success: true,
      score: scored.score,
      total: scored.total,
      band,
      accuracy: scored.accuracy,
      wrongIndexes: scored.wrongIndexes,
      results: scored.results,
      sectionScores: sectionScores ?? undefined,
      testId: testId ?? undefined,
      attemptId: typeof mockAttemptId !== "undefined" ? mockAttemptId : undefined,
    });
  } catch (err) {
    console.error("[listening/submit]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Submit failed",
      },
      { status: 500 }
    );
  }
}
