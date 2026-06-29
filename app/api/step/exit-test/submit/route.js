import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStepSupabase } from "@/lib/step/enrollmentService";
import { advanceAfterExitPass } from "@/lib/step/exitTest/advancePhase";
import { passThresholdForPhase } from "@/lib/step/exitTest/constants";
import {
  gapAnalysis,
  gradeExitTest,
  studyRecommendations,
} from "@/lib/step/exitTest/grading";
import { getPhaseDefinition, nextPhase } from "@/lib/step/phases";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const attemptId = body.attemptId;
  const answers = body.answers ?? {};
  const timeSpent = Number(body.timeSpent ?? 0);

  if (!attemptId) {
    return NextResponse.json({ error: "attemptId required" }, { status: 400 });
  }

  try {
    const supabase = getStepSupabase();

    const { data: attempt, error: fetchErr } = await supabase
      .from("step_exit_tests")
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
        passed: attempt.passed,
        totalScore: attempt.total_score,
        attemptId,
      });
    }

    const questions = attempt.questions_snapshot ?? [];
    const graded = gradeExitTest(questions, answers);
    const phase = attempt.phase;
    const threshold = passThresholdForPhase(phase);
    const passed = graded.totalScore >= threshold;

    await supabase
      .from("step_exit_tests")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        answers,
        time_spent_seconds: timeSpent,
        reading_score: graded.readingScore,
        structure_score: graded.structureScore,
        listening_score: graded.listeningScore,
        compositional_score: graded.compositionalScore,
        reading_raw: graded.readingRaw,
        structure_raw: graded.structureRaw,
        listening_raw: graded.listeningRaw,
        compositional_raw: graded.compositionalRaw,
        total_score: graded.totalScore,
        passed,
      })
      .eq("id", attemptId);

    await supabase.from("step_progress_history").insert({
      student_id: studentId,
      score: graded.totalScore,
      source: "exit_test",
      phase,
      metadata: { attemptId, passed },
    });

    let advance = { advanced: false, newPhase: phase, certificateIssued: false };
    if (passed) {
      advance = await advanceAfterExitPass(
        supabase,
        studentId,
        phase,
        graded.totalScore
      );
    } else {
      await supabase
        .from("step_enrollments")
        .update({ estimated_score: graded.totalScore })
        .eq("student_id", studentId);
    }

    const gaps = gapAnalysis(phase, graded);
    const recommendations = passed ? [] : studyRecommendations(gaps.sections);

    const next = nextPhase(phase);
    const nextDef = next ? getPhaseDefinition(next) : null;

    return NextResponse.json({
      success: true,
      attemptId,
      phase,
      passed,
      threshold,
      ...graded,
      sectionBreakdown: {
        reading: `${graded.readingRaw}/10`,
        structure: `${graded.structureRaw}/10`,
        listening: `${graded.listeningRaw}/10`,
        compositional: `${graded.compositionalRaw}/10`,
      },
      gapAnalysis: passed ? null : gaps,
      recommendations,
      advanced: advance.advanced,
      newPhase: advance.newPhase,
      certificateIssued: advance.certificateIssued,
      nextPhase: next
        ? { phase: next, title: nextDef?.title ?? "" }
        : null,
      results: graded.results,
    });
  } catch (err) {
    console.error("[step/exit-test/submit]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submit failed" },
      { status: 500 }
    );
  }
}
