import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStepEnrollment, getStepSupabase } from "@/lib/step/enrollmentService";
import { buildExitTestExam } from "@/lib/step/mockExam/generateMockQuestions";
import {
  daysUntilExitRetake,
  EXIT_TEST_TIME_SECONDS,
  isExitTestWeekEligible,
} from "@/lib/step/exitTest/constants";

function stripClient(q) {
  const { correct: _c, explanation: _e, ...rest } = q;
  return rest;
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const phase = Number(body.phase);

  try {
    const supabase = getStepSupabase();
    const enrollment = await ensureStepEnrollment(supabase, studentId);
    const currentPhase = enrollment.current_phase ?? 1;
    const targetPhase = phase || currentPhase;

    if (targetPhase !== currentPhase) {
      return NextResponse.json(
        { error: `Exit test is for Phase ${currentPhase} only.` },
        { status: 400 }
      );
    }

    if (!isExitTestWeekEligible(currentPhase, enrollment.current_week ?? 1)) {
      return NextResponse.json(
        { error: "Exit test unlocks in the final week of your current phase." },
        { status: 403 }
      );
    }

    const { data: lastSubmitted } = await supabase
      .from("step_exit_tests")
      .select("submitted_at")
      .eq("student_id", studentId)
      .eq("phase", currentPhase)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const cooldown = daysUntilExitRetake(lastSubmitted?.submitted_at ?? null);
    if (cooldown > 0) {
      return NextResponse.json(
        { error: `You can retake this exit test in ${cooldown} day(s).`, cooldownDays: cooldown },
        { status: 429 }
      );
    }

    const { data: existing } = await supabase
      .from("step_exit_tests")
      .select("id, questions_snapshot, phase, attempt_number")
      .eq("student_id", studentId)
      .eq("status", "in_progress")
      .maybeSingle();

    if (existing) {
      const full = existing.questions_snapshot ?? [];
      const payload = {
        reading: full.filter((q) => q.section === "reading").map(stripClient),
        structure: full.filter((q) => q.section === "structure").map(stripClient),
        listening: full.filter((q) => q.section === "listening").map(stripClient),
        compositional: full
          .filter((q) => q.section === "compositional_analysis")
          .map(stripClient),
      };
      return NextResponse.json({
        attemptId: existing.id,
        phase: existing.phase,
        attemptNumber: existing.attempt_number,
        timeLimitSeconds: EXIT_TEST_TIME_SECONDS,
        questions: payload,
      });
    }

    const { data: mockAttempts } = await supabase
      .from("step_mock_attempts")
      .select("question_ids")
      .eq("student_id", studentId);

    const { data: priorExit } = await supabase
      .from("step_exit_tests")
      .select("question_ids")
      .eq("student_id", studentId);

    const excludeIds = new Set();
    for (const row of mockAttempts ?? []) {
      for (const id of row.question_ids ?? []) excludeIds.add(id);
    }
    for (const row of priorExit ?? []) {
      for (const id of row.question_ids ?? []) excludeIds.add(id);
    }

    const { count } = await supabase
      .from("step_exit_tests")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("phase", currentPhase)
      .eq("status", "submitted");

    const attemptNumber = (count ?? 0) + 1;
    const { questions, payload } = await buildExitTestExam(currentPhase, [...excludeIds]);

    const clientPayload = {
      reading: payload.reading,
      structure: payload.structure,
      listening: payload.listening,
      compositional: payload.compositional,
    };

    const { data: attempt, error } = await supabase
      .from("step_exit_tests")
      .insert({
        student_id: studentId,
        phase: currentPhase,
        attempt_number: attemptNumber,
        question_ids: questions.map((q) => q.id),
        questions_snapshot: questions,
        status: "in_progress",
      })
      .select("id, phase, attempt_number, started_at")
      .single();

    if (error) {
      console.error("[step/exit-test/start]", error);
      return NextResponse.json(
        {
          error:
            "Could not start exit test. Run supabase/step_progress_and_exit_setup.sql in Supabase.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      attemptId: attempt.id,
      phase: attempt.phase,
      attemptNumber: attempt.attempt_number,
      startedAt: attempt.started_at,
      timeLimitSeconds: EXIT_TEST_TIME_SECONDS,
      questions: clientPayload,
    });
  } catch (err) {
    console.error("[step/exit-test/start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start exit test" },
      { status: 500 }
    );
  }
}
