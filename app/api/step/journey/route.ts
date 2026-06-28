import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ensureStepEnrollment,
  getPhaseProgress,
  getStepSupabase,
} from "@/lib/step/enrollmentService";
import {
  STEP_PHASES,
  STEP_TOTAL_WEEKS,
  weeksRemainingFromPhase,
} from "@/lib/step/phases";
import { weekWithinPhase, overallCompletionPercent } from "@/lib/step/dashboardMetrics";
import { STEP_ROUTES } from "@/lib/step/paths";

export async function GET() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getStepSupabase();
    const enrollment = await ensureStepEnrollment(supabase, studentId);
    const phaseRows = await getPhaseProgress(supabase, studentId);

    const { data: certs } = await supabase
      .from("step_certificates")
      .select("certificate_id, certificate_type, final_score")
      .eq("student_id", studentId);

    const { weekInPhase, weeksInPhase } = weekWithinPhase(
      enrollment.current_week,
      enrollment.current_phase
    );

    const phases = STEP_PHASES.map((def) => {
      const row = phaseRows.find((p) => p.phase === def.phase);
      const status = row?.status ?? (def.phase === 1 ? "active" : "locked");
      const cert = (certs ?? []).find(
        (c) =>
          c.certificate_type === `step_phase_${def.phase}` ||
          (def.phase === 4 && c.certificate_type === "step_accelerator_completion")
      );

      return {
        phase: def.phase,
        title: def.title,
        subtitle: def.subtitle,
        weekCount: def.weekCount,
        weeks: def.weeks,
        exitScoreRequired: def.exitScoreRequired,
        status,
        entryScore: row?.entry_score ?? null,
        exitScore: row?.exit_score ?? null,
        certificateId: cert?.certificate_id ?? null,
        continueHref:
          status === "active"
            ? def.phase === enrollment.current_phase
              ? STEP_ROUTES.home
              : `${STEP_ROUTES.phaseExit}?phase=${def.phase}`
            : null,
      };
    });

    const overallCompletion = overallCompletionPercent(
      enrollment.current_week,
      phases.map((p) => ({ status: p.status }))
    );

    const weeksRemaining = weeksRemainingFromPhase(
      enrollment.current_phase,
      weekInPhase,
      weeksInPhase
    );

    return NextResponse.json({
      enrollment: {
        current_phase: enrollment.current_phase,
        current_week: enrollment.current_week,
        estimated_score: enrollment.estimated_score,
        target_score: enrollment.target_score,
        diagnostic_score: enrollment.diagnostic_score,
      },
      phases,
      progress: {
        overallCompletion,
        weekLabel: `Week ${weekInPhase} of ${weeksInPhase}`,
        weeksRemaining,
        estimatedCompletionLabel: `${weeksRemaining} weeks at current pace`,
      },
    });
  } catch (err) {
    console.error("[step/journey]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load journey" },
      { status: 500 }
    );
  }
}
