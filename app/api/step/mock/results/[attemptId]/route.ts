import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStepSupabase } from "@/lib/step/enrollmentService";
import {
  gradeMockExam,
  practicePathForSection,
  sectionDisplayName,
  weakestSectionFromScores,
} from "@/lib/step/mockExam/generateMockQuestions";
import type { MockExamQuestion } from "@/lib/step/mockExam/types";

type RouteContext = { params: { attemptId: string } };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attemptId = context.params.attemptId;
  if (!attemptId) {
    return NextResponse.json({ error: "attemptId required" }, { status: 400 });
  }

  try {
    const supabase = getStepSupabase();
    const { data: attempt } = await supabase
      .from("step_mock_attempts")
      .select("*")
      .eq("id", attemptId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status !== "submitted") {
      return NextResponse.json({ error: "Results not available until submitted" }, { status: 403 });
    }

    const questions = (attempt.questions_snapshot ?? []) as MockExamQuestion[];
    const answers = (attempt.answers ?? {}) as Record<string, string>;
    const graded = gradeMockExam(questions, answers);

    const weakest = weakestSectionFromScores({
      reading: graded.readingScore,
      structure: graded.structureScore,
      listening: graded.listeningScore,
      compositional: graded.compositionalScore,
    });

    const { data: enrollment } = await supabase
      .from("step_enrollments")
      .select("current_phase")
      .eq("student_id", studentId)
      .maybeSingle();

    return NextResponse.json({
      attemptId,
      mockNumber: attempt.mock_number,
      readingScore: graded.readingScore,
      structureScore: graded.structureScore,
      listeningScore: graded.listeningScore,
      compositionalScore: graded.compositionalScore,
      totalScore: graded.totalScore,
      durationMinutes: Math.round((attempt.time_spent_seconds ?? 0) / 60),
      phase: enrollment?.current_phase ?? attempt.phase ?? 1,
      answers,
      questions,
      results: graded.results,
      weakestSection: weakest,
      weakestSectionName: sectionDisplayName(weakest),
      weakestPracticePath: practicePathForSection(weakest),
    });
  } catch (err) {
    console.error("[step/mock/results]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load results" },
      { status: 500 }
    );
  }
}
