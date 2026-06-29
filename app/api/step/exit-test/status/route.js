import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStepEnrollment, getStepSupabase } from "@/lib/step/enrollmentService";
import { getPhaseDefinition } from "@/lib/step/phases";
import {
  daysUntilExitRetake,
  isExitTestWeekEligible,
  nextRetakeDate,
  passThresholdForPhase,
  readinessLabel,
  EXIT_TEST_COOLDOWN_DAYS,
} from "@/lib/step/exitTest/constants";

export async function GET() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getStepSupabase();
    const enrollment = await ensureStepEnrollment(supabase, studentId);
    const phase = enrollment.current_phase ?? 1;
    const week = enrollment.current_week ?? 1;
    const def = getPhaseDefinition(phase);
    const threshold = passThresholdForPhase(phase);
    const estimated = enrollment.estimated_score ?? 0;

    const { data: attempts } = await supabase
      .from("step_exit_tests")
      .select("*")
      .eq("student_id", studentId)
      .eq("phase", phase)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false });

    const { data: inProgress } = await supabase
      .from("step_exit_tests")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "in_progress")
      .maybeSingle();

    const lastAttempt = attempts?.[0] ?? null;
    const cooldownDays = daysUntilExitRetake(lastAttempt?.submitted_at ?? null);
    const weekEligible = isExitTestWeekEligible(phase, week);
    const ready = weekEligible && cooldownDays === 0;

    const previousAttempts = (attempts ?? []).map((a, i) => ({
      attemptNumber: (attempts?.length ?? 0) - i,
      date: a.submitted_at,
      score: a.total_score,
      passed: a.passed,
      nextAttemptAvailable:
        i === 0 && cooldownDays > 0 ? nextRetakeDate(a.submitted_at) : null,
    }));

    return NextResponse.json({
      phase,
      phaseTitle: def?.title ?? "Foundation",
      week,
      weeksInPhase: def?.weekCount ?? 2,
      passThreshold: threshold,
      estimatedScore: estimated,
      readiness: readinessLabel(estimated, threshold),
      weekEligible,
      cooldownDays,
      ready,
      inProgressAttemptId: inProgress?.id ?? null,
      previousAttempts,
      cooldownDaysTotal: EXIT_TEST_COOLDOWN_DAYS,
    });
  } catch (err) {
    console.error("[step/exit-test/status]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load exit test status" },
      { status: 500 }
    );
  }
}
