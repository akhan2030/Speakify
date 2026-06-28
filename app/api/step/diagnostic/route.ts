import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  applyDiagnosticResult,
  ensureStepEnrollment,
  getStepSupabase,
} from "@/lib/step/enrollmentService";
import {
  DIAGNOSTIC_QUESTION_COUNT,
  DIAGNOSTIC_TIME_MINUTES,
  fetchDiagnosticQuestions,
} from "@/lib/step/fetchDiagnosticQuestions";
import { getPhaseDefinition } from "@/lib/step/phases";
import { sectionScoreFromAccuracy } from "@/lib/step/scoring";
import type { StepSectionId } from "@/lib/step/examModel";
import type { StepMcqOption } from "@/lib/step/types";

function weeksToTarget(currentPhase: number, targetScore: number, score: number): number {
  const gap = Math.max(0, targetScore - score);
  const phasesLeft = Math.max(1, 5 - currentPhase);
  return Math.max(1, Math.ceil(gap / 4) + phasesLeft - 1);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getStepSupabase();
  const enrollment = await ensureStepEnrollment(supabase, studentId);

  if (enrollment.diagnostic_score != null) {
    const phaseDef = getPhaseDefinition(enrollment.current_phase);
    return NextResponse.json({
      completed: true,
      score: enrollment.diagnostic_score,
      startingPhase: enrollment.current_phase,
      phaseTitle: phaseDef?.title ?? "Foundation",
      targetScore: enrollment.target_score ?? 80,
      weeksToTarget: weeksToTarget(
        enrollment.current_phase,
        enrollment.target_score ?? 80,
        enrollment.diagnostic_score
      ),
    });
  }

  const questions = await fetchDiagnosticQuestions(supabase);

  return NextResponse.json({
    completed: false,
    questions: questions.map(({ id, number, stem, options, section }) => ({
      id,
      number,
      stem,
      options,
      section,
    })),
    timeLimitMinutes: DIAGNOSTIC_TIME_MINUTES,
    totalQuestions: DIAGNOSTIC_QUESTION_COUNT,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const answers = (body.answers ?? {}) as Record<string, StepMcqOption>;

  const supabase = getStepSupabase();

  const { data: existing } = await supabase
    .from("step_enrollments")
    .select("diagnostic_score")
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing?.diagnostic_score != null) {
    return NextResponse.json({ error: "Diagnostic already completed" }, { status: 400 });
  }

  const questions = await fetchDiagnosticQuestions(supabase);
  let correct = 0;
  const bySection: Record<string, { correct: number; total: number }> = {};

  for (const q of questions) {
    const isCorrect = answers[q.id] === q.correct;
    if (isCorrect) correct++;
    const section = q.section;
    if (!bySection[section]) bySection[section] = { correct: 0, total: 0 };
    bySection[section].total++;
    if (isCorrect) bySection[section].correct++;
  }

  const totalScore = sectionScoreFromAccuracy(
    correct,
    questions.length || DIAGNOSTIC_QUESTION_COUNT
  );

  try {
    const enrollment = await applyDiagnosticResult(supabase, studentId, totalScore);
    const phaseDef = getPhaseDefinition(enrollment.current_phase);
    const target = enrollment.target_score ?? 80;

    const today = new Date().toISOString().slice(0, 10);
    for (const [section, stats] of Object.entries(bySection)) {
      await supabase.from("step_section_scores").upsert(
        {
          student_id: studentId,
          session_date: today,
          section,
          questions_attempted: stats.total,
          questions_correct: stats.correct,
          estimated_score: sectionScoreFromAccuracy(stats.correct, stats.total),
        },
        { onConflict: "student_id,session_date,section" }
      );
    }

    await supabase
      .from("users")
      .update({ step_enrolled: true, step_current_phase: enrollment.current_phase })
      .eq("id", studentId);

    return NextResponse.json({
      success: true,
      score: totalScore,
      correct,
      total: questions.length,
      startingPhase: enrollment.current_phase,
      phaseTitle: phaseDef?.title ?? "Foundation",
      targetScore: target,
      weeksToTarget: weeksToTarget(enrollment.current_phase, target, totalScore),
    });
  } catch (err) {
    console.error("[step/diagnostic]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submit failed" },
      { status: 500 }
    );
  }
}
