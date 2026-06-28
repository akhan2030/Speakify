import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { STEP_SECTIONS, type StepSectionId } from "@/lib/step/examModel";
import {
  ensureStepEnrollment,
  getPhaseProgress,
  getStepSupabase,
} from "@/lib/step/enrollmentService";
import {
  STEP_ACCELERATOR_NAME,
  STEP_PHASES,
  STEP_TOTAL_WEEKS,
  getPhaseDefinition,
} from "@/lib/step/phases";
import { estimatedTotalScore, weakestSection } from "@/lib/step/scoring";
import {
  buildSectionBreakdown,
  largestGapSection,
  overallCompletionPercent,
  recommendedFocusActions,
  scoreTrend,
  weekWithinPhase,
} from "@/lib/step/dashboardMetrics";
import { todayStepMission, nextFridayLabel, WEEKLY_STEP_MISSIONS } from "@/lib/step/weeklyMission";

export async function GET() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getStepSupabase();
    const enrollment = await ensureStepEnrollment(supabase, studentId);
    const phases = await getPhaseProgress(supabase, studentId);

    const { data: sectionRows } = await supabase
      .from("step_section_scores")
      .select("section, estimated_score")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false });

    const sectionScores: Partial<Record<StepSectionId, number>> = {};
    for (const row of sectionRows ?? []) {
      const key = row.section as StepSectionId;
      if (!sectionScores[key]) {
        sectionScores[key] = row.estimated_score ?? 0;
      }
    }

    const diagnosticDone = enrollment.diagnostic_score != null;
    const currentPhaseDef = getPhaseDefinition(enrollment.current_phase);

    const { data: mocks } = await supabase
      .from("step_mock_results")
      .select("mock_number, total_score, completed_at, mock_type")
      .eq("student_id", studentId)
      .order("completed_at", { ascending: false })
      .limit(3);

    const { data: cert } = await supabase
      .from("step_certificates")
      .select("certificate_id, final_score, issued_at")
      .eq("student_id", studentId)
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const est =
      enrollment.estimated_score ||
      estimatedTotalScore(sectionScores) ||
      enrollment.diagnostic_score ||
      0;

    const target = enrollment.target_score ?? 80;
    const gap = Math.max(0, target - est);

    const phaseRows = STEP_PHASES.map((def) => {
      const row = phases.find((p) => p.phase === def.phase);
      return {
        phase: def.phase,
        title: def.title,
        subtitle: def.subtitle,
        exitScoreRequired: def.exitScoreRequired,
        weeks: def.weeks,
        status: row?.status ?? (def.phase === 1 ? "active" : "locked"),
        entryScore: row?.entry_score ?? null,
        exitScore: row?.exit_score ?? null,
      };
    });

    const sectionBreakdown = buildSectionBreakdown(sectionScores, target);
    const weakItem = largestGapSection(sectionBreakdown);
    const weak = weakestSection(sectionScores);
    const { weekInPhase, weeksInPhase } = weekWithinPhase(
      enrollment.current_week,
      enrollment.current_phase
    );

    const mockScores = (mocks ?? []).map((m) => m.total_score ?? 0);
    const trend = scoreTrend(est, enrollment.diagnostic_score, mockScores);

    const mission = todayStepMission();
    const focusActions = recommendedFocusActions(weakItem);

    return NextResponse.json({
      user: { name: session.user?.name ?? "Student" },
      program: {
        name: STEP_ACCELERATOR_NAME,
        totalWeeks: STEP_TOTAL_WEEKS,
        targetScore: target,
      },
      enrollment: {
        ...enrollment,
        estimated_score: est,
        diagnosticDone,
        gap,
      },
      header: {
        phaseLabel: `Phase ${enrollment.current_phase}: ${currentPhaseDef?.title ?? "Foundations"}`,
        estimatedScore: est,
        targetScore: target,
        gap,
      },
      todayMission: {
        ...mission,
        dayName: mission.day,
      },
      weeklyPlan: WEEKLY_STEP_MISSIONS,
      scoreMeter: {
        estimated: est,
        target,
        gap,
        progressPercent: Math.min(100, est),
        trend,
        trendLabel: trend === "on_track" ? "On track" : "Needs attention",
      },
      sectionBreakdown,
      phaseProgress: {
        phases: phaseRows,
        currentPhase: enrollment.current_phase,
        weekInPhase,
        weeksInPhase,
        weekLabel: `Week ${weekInPhase} of ${weeksInPhase}`,
        overallCompletion: overallCompletionPercent(enrollment.current_week, phaseRows),
      },
      recommendedFocus: {
        sectionId: weakItem.id,
        sectionLabel: weakItem.label,
        gapPoints: weakItem.targetPoints - weakItem.estimatedPoints,
        actions: focusActions,
        estimatedGain: "+2–3 points",
        href: weakItem.href,
      },
      mocks: {
        recent: mocks ?? [],
        nextRecommended: nextFridayLabel(),
      },
      certificate: cert ?? null,
      weakSection: weak,
    });
  } catch (err) {
    console.error("[step/dashboard]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Dashboard load failed" },
      { status: 500 }
    );
  }
}
