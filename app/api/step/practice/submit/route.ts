import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { StepSectionId } from "@/lib/step/examModel";
import {
  advancePhaseIfReady,
  ensureStepEnrollment,
  getStepSupabase,
  recordSectionSession,
} from "@/lib/step/enrollmentService";
import { estimatedTotalScore, sectionScoreFromAccuracy } from "@/lib/step/scoring";
import type { StepMcqOption } from "@/lib/step/types";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const section = body.section as StepSectionId;
  const answers = (body.answers ?? {}) as Record<string, StepMcqOption>;
  const answerKey = (body.answerKey ?? {}) as Record<string, StepMcqOption>;
  const mode = body.mode as "practice" | "phase_exit" | "mock" | undefined;
  const phase = Number(body.phase ?? 0);
  const durationMinutes = Number(body.durationMinutes ?? 0);

  const ids = Object.keys(answerKey);
  let correct = 0;
  for (const id of ids) {
    if (answers[id] === answerKey[id]) correct++;
  }

  const attempted = ids.length;
  const sectionScore = sectionScoreFromAccuracy(correct, attempted);

  try {
    const supabase = getStepSupabase();
    const enrollment = await ensureStepEnrollment(supabase, studentId);

    if (mode === "practice" && section) {
      await recordSectionSession(
        supabase,
        studentId,
        section,
        correct,
        attempted,
        sectionScore
      );
    }

    const { data: sectionRows } = await supabase
      .from("step_section_scores")
      .select("section, estimated_score")
      .eq("student_id", studentId);

    const sectionScores: Partial<Record<StepSectionId, number>> = {};
    for (const row of sectionRows ?? []) {
      sectionScores[row.section as StepSectionId] = row.estimated_score ?? 0;
    }

    const totalEst = estimatedTotalScore(sectionScores) || sectionScore;

    await supabase
      .from("step_enrollments")
      .update({ estimated_score: totalEst })
      .eq("student_id", studentId);

    let phaseAdvanced = false;
    let newPhase = enrollment.current_phase;

    if (mode === "phase_exit" && phase > 0) {
      const exitScore = sectionScoreFromAccuracy(correct, attempted);
      const result = await advancePhaseIfReady(
        supabase,
        studentId,
        exitScore,
        phase
      );
      phaseAdvanced = result.advanced;
      newPhase = result.newPhase;

      await supabase
        .from("step_enrollments")
        .update({
          estimated_score: Math.max(totalEst, exitScore),
        })
        .eq("student_id", studentId);
    }

    if (mode === "mock") {
      const { count } = await supabase
        .from("step_mock_results")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId);

      const mockNumber = (count ?? 0) + 1;
      const perSection = Math.round(totalEst);

      await supabase.from("step_mock_results").insert({
        student_id: studentId,
        mock_number: mockNumber,
        mock_type: attempted >= 15 ? "full" : "partial",
        reading_score: section === "reading" ? sectionScore : perSection,
        structure_score: section === "structure" ? sectionScore : perSection,
        listening_score: section === "listening" ? sectionScore : perSection,
        compositional_score:
          section === "compositional_analysis" ? sectionScore : perSection,
        total_score: totalEst,
        duration_minutes: durationMinutes,
        phase: enrollment.current_phase,
      });
    }

    return NextResponse.json({
      success: true,
      correct,
      attempted,
      sectionScore,
      estimatedTotal: totalEst,
      phaseAdvanced,
      newPhase,
    });
  } catch (err) {
    console.error("[step/practice/submit]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submit failed" },
      { status: 500 }
    );
  }
}
