import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStepEnrollment, getStepSupabase } from "@/lib/step/enrollmentService";
import {
  gradeMockExam,
  weakestSectionFromScores,
} from "@/lib/step/mockExam/generateMockQuestions";
import type { MockExamQuestion } from "@/lib/step/mockExam/types";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const attemptId = body.attemptId as string | undefined;
  const answers = (body.answers ?? {}) as Record<string, string>;
  const timeSpent = Number(body.timeSpent ?? 0);
  const autoSubmit = body.autoSubmit === true;

  if (!attemptId) {
    return NextResponse.json({ error: "attemptId required" }, { status: 400 });
  }

  try {
    const supabase = getStepSupabase();
    const enrollment = await ensureStepEnrollment(supabase, studentId);

    const { data: attempt, error: fetchErr } = await supabase
      .from("step_mock_attempts")
      .select("*")
      .eq("id", attemptId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (fetchErr || !attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status === "submitted") {
      return NextResponse.json({
        alreadySubmitted: true,
        attemptId,
        readingScore: attempt.reading_score,
        structureScore: attempt.structure_score,
        listeningScore: attempt.listening_score,
        compositionalScore: attempt.compositional_score,
        totalScore: attempt.total_score,
      });
    }

    const questions = (attempt.questions_snapshot ?? []) as MockExamQuestion[];
    const graded = gradeMockExam(questions, answers);

    const durationMinutes = Math.max(1, Math.round(timeSpent / 60));

    await supabase
      .from("step_mock_attempts")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        answers,
        time_spent_seconds: timeSpent,
        reading_score: graded.readingScore,
        structure_score: graded.structureScore,
        listening_score: graded.listeningScore,
        compositional_score: graded.compositionalScore,
        total_score: graded.totalScore,
      })
      .eq("id", attemptId);

    await supabase.from("step_mock_results").insert({
      student_id: studentId,
      mock_number: attempt.mock_number,
      mock_type: "full",
      reading_score: graded.readingScore,
      structure_score: graded.structureScore,
      listening_score: graded.listeningScore,
      compositional_score: graded.compositionalScore,
      total_score: graded.totalScore,
      duration_minutes: durationMinutes,
      phase: enrollment.current_phase,
    });

    await supabase
      .from("step_enrollments")
      .update({ estimated_score: graded.totalScore })
      .eq("student_id", studentId);

    const weakest = weakestSectionFromScores({
      reading: graded.readingScore,
      structure: graded.structureScore,
      listening: graded.listeningScore,
      compositional: graded.compositionalScore,
    });

    return NextResponse.json({
      success: true,
      attemptId,
      mockNumber: attempt.mock_number,
      autoSubmit,
      ...graded,
      weakestSection: weakest,
      durationMinutes,
      phase: enrollment.current_phase,
    });
  } catch (err) {
    console.error("[step/mock/submit]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submit failed" },
      { status: 500 }
    );
  }
}
