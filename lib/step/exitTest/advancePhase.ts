import type { SupabaseClient } from "@supabase/supabase-js";
import { getPhaseDefinition, weekForPhase } from "../phases";
import { passThresholdForPhase } from "./constants";

export async function advanceAfterExitPass(
  supabase: SupabaseClient,
  studentId: string,
  phase: number,
  exitScore: number
): Promise<{ advanced: boolean; newPhase: number; certificateIssued: boolean }> {
  const threshold = passThresholdForPhase(phase);
  if (exitScore < threshold) {
    return { advanced: false, newPhase: phase, certificateIssued: false };
  }

  const def = getPhaseDefinition(phase);
  if (!def) {
    return { advanced: false, newPhase: phase, certificateIssued: false };
  }

  const next = phase < 4 ? phase + 1 : 4;

  await supabase
    .from("step_phase_progress")
    .update({
      status: "completed",
      exit_score: exitScore,
      completed_at: new Date().toISOString(),
    })
    .eq("student_id", studentId)
    .eq("phase", phase);

  const certId = `STEP-P${phase}-${studentId.slice(0, 8).toUpperCase()}`;
  await supabase.from("step_certificates").insert({
    student_id: studentId,
    certificate_type: phase < 4 ? `step_phase_${phase}` : "step_accelerator_completion",
    final_score: exitScore,
    certificate_id: certId,
  });

  let certificateIssued = false;

  if (next <= 4 && next > phase) {
    await supabase
      .from("step_phase_progress")
      .update({
        status: "active",
        entry_score: exitScore,
        started_at: new Date().toISOString(),
      })
      .eq("student_id", studentId)
      .eq("phase", next);
  }

  const newWeek = weekForPhase(next);

  await supabase
    .from("step_enrollments")
    .update({
      current_phase: next,
      current_week: 1,
      estimated_score: Math.max(exitScore, 0),
    })
    .eq("student_id", studentId);

  await supabase
    .from("users")
    .update({ step_current_phase: next })
    .eq("id", studentId);

  if (phase === 4 && exitScore >= threshold) {
    const finalCertId = `STEP-FINAL-${studentId.slice(0, 8).toUpperCase()}`;
    await supabase.from("step_certificates").insert({
      student_id: studentId,
      certificate_type: "step_excellence",
      final_score: exitScore,
      certificate_id: finalCertId,
    });
    certificateIssued = true;
  }

  return { advanced: true, newPhase: next, certificateIssued };
}
