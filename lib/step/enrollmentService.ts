import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  diagnosticStartingPhase,
  getPhaseDefinition,
  weekForPhase,
  type StepPhaseStatus,
} from "./phases";

export function getStepSupabase(): SupabaseClient {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type StepEnrollmentRow = {
  student_id: string;
  diagnostic_score: number | null;
  current_phase: number;
  current_week: number;
  estimated_score: number;
  target_score: number;
  status: string;
};

export type StepPhaseRow = {
  phase: number;
  status: StepPhaseStatus;
  entry_score: number | null;
  exit_score: number | null;
};

export async function ensureStepEnrollment(
  supabase: SupabaseClient,
  studentId: string
): Promise<StepEnrollmentRow> {
  const { data: existing } = await supabase
    .from("step_enrollments")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) return existing as StepEnrollmentRow;

  const { data: created, error } = await supabase
    .from("step_enrollments")
    .insert({
      student_id: studentId,
      current_phase: 1,
      current_week: 1,
      estimated_score: 0,
      target_score: 80,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const phases = [1, 2, 3, 4].map((phase) => ({
    student_id: studentId,
    phase,
    status: phase === 1 ? "active" : "locked",
    started_at: phase === 1 ? new Date().toISOString() : null,
  }));

  await supabase.from("step_phase_progress").upsert(phases, {
    onConflict: "student_id,phase",
  });

  await supabase
    .from("users")
    .update({ step_enrolled: true, step_current_phase: 1 })
    .eq("id", studentId);

  return created as StepEnrollmentRow;
}

export async function getPhaseProgress(
  supabase: SupabaseClient,
  studentId: string
): Promise<StepPhaseRow[]> {
  const { data } = await supabase
    .from("step_phase_progress")
    .select("phase, status, entry_score, exit_score")
    .eq("student_id", studentId)
    .order("phase");

  return (data ?? []) as StepPhaseRow[];
}

export async function applyDiagnosticResult(
  supabase: SupabaseClient,
  studentId: string,
  totalScore: number
): Promise<StepEnrollmentRow> {
  const startPhase = diagnosticStartingPhase(totalScore);
  const startWeek = weekForPhase(startPhase);

  await ensureStepEnrollment(supabase, studentId);

  const phaseRows = [1, 2, 3, 4].map((phase) => {
    let status: StepPhaseStatus = "locked";
    if (phase < startPhase) status = "completed";
    else if (phase === startPhase) status = "active";

    return {
      student_id: studentId,
      phase,
      status,
      entry_score: phase === startPhase ? totalScore : phase < startPhase ? totalScore : null,
      exit_score: phase < startPhase ? totalScore : null,
      started_at:
        phase === startPhase
          ? new Date().toISOString()
          : phase < startPhase
            ? new Date().toISOString()
            : null,
      completed_at: phase < startPhase ? new Date().toISOString() : null,
    };
  });

  await supabase.from("step_phase_progress").upsert(phaseRows, {
    onConflict: "student_id,phase",
  });

  const { data, error } = await supabase
    .from("step_enrollments")
    .update({
      diagnostic_score: totalScore,
      current_phase: startPhase,
      current_week: startWeek,
      estimated_score: totalScore,
    })
    .eq("student_id", studentId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("users")
    .update({ step_current_phase: startPhase })
    .eq("id", studentId);

  return data as StepEnrollmentRow;
}

export async function advancePhaseIfReady(
  supabase: SupabaseClient,
  studentId: string,
  exitScore: number,
  phase: number
): Promise<{ advanced: boolean; newPhase: number }> {
  const def = getPhaseDefinition(phase);
  if (!def || exitScore < def.exitScoreRequired) {
    return { advanced: false, newPhase: phase };
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
      current_week: newWeek,
      estimated_score: Math.max(exitScore, 0),
    })
    .eq("student_id", studentId);

  await supabase
    .from("users")
    .update({ step_current_phase: next })
    .eq("id", studentId);

  if (phase === 4 && exitScore >= def.exitScoreRequired) {
    const finalCertId = `STEP-FINAL-${studentId.slice(0, 8).toUpperCase()}`;
    await supabase.from("step_certificates").insert({
      student_id: studentId,
      certificate_type: "step_accelerator_completion",
      final_score: exitScore,
      certificate_id: finalCertId,
    });
  }

  return { advanced: true, newPhase: next };
}

export async function recordSectionSession(
  supabase: SupabaseClient,
  studentId: string,
  section: string,
  correct: number,
  attempted: number,
  estimatedSectionScore: number
) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("step_section_scores")
    .select("*")
    .eq("student_id", studentId)
    .eq("session_date", today)
    .eq("section", section)
    .maybeSingle();

  const prevAttempted = existing?.questions_attempted ?? 0;
  const prevCorrect = existing?.questions_correct ?? 0;
  const prevEst = existing?.estimated_score ?? 0;

  const newAttempted = prevAttempted + attempted;
  const newCorrect = prevCorrect + correct;
  const blendedEst = Math.round(
    prevEst * 0.5 + estimatedSectionScore * 0.5
  );

  await supabase.from("step_section_scores").upsert(
    {
      student_id: studentId,
      session_date: today,
      section,
      questions_attempted: newAttempted,
      questions_correct: newCorrect,
      estimated_score: blendedEst,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,session_date,section" }
  );
}
