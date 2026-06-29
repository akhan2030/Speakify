import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStepEnrollment, getStepSupabase } from "@/lib/step/enrollmentService";
import { buildMiniMockExam } from "@/lib/step/miniMock/generateMiniMockQuestions";
import { MINI_MOCK_TIME_SECONDS } from "@/lib/step/miniMock/constants";

function stripClient(q) {
  const { correct: _c, explanation: _e, ...rest } = q;
  return rest;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getStepSupabase();
    const enrollment = await ensureStepEnrollment(supabase, studentId);

    const { data: existing } = await supabase
      .from("step_mini_mock_attempts")
      .select("id, mock_number, questions_snapshot, phase")
      .eq("student_id", studentId)
      .eq("status", "in_progress")
      .maybeSingle();

    if (existing) {
      const full = existing.questions_snapshot ?? [];
      return NextResponse.json({
        attemptId: existing.id,
        mockNumber: existing.mock_number,
        timeLimitSeconds: MINI_MOCK_TIME_SECONDS,
        questions: {
          reading: full.filter((q) => q.section === "reading").map(stripClient),
          structure: full.filter((q) => q.section === "structure").map(stripClient),
          listening: full.filter((q) => q.section === "listening").map(stripClient),
          compositional: full
            .filter((q) => q.section === "compositional_analysis")
            .map(stripClient),
        },
      });
    }

    const { count } = await supabase
      .from("step_mini_mock_results")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId);

    const mockNumber = (count ?? 0) + 1;

    const { data: recentAttempts } = await supabase
      .from("step_mini_mock_attempts")
      .select("question_ids")
      .eq("student_id", studentId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(3);

    const excludeIds = new Set();
    for (const row of recentAttempts ?? []) {
      for (const id of row.question_ids ?? []) excludeIds.add(id);
    }

    const { questions, payload } = await buildMiniMockExam(mockNumber, [...excludeIds]);

    const { data: attempt, error } = await supabase
      .from("step_mini_mock_attempts")
      .insert({
        student_id: studentId,
        mock_number: mockNumber,
        question_ids: questions.map((q) => q.id),
        questions_snapshot: questions,
        status: "in_progress",
      })
      .select("id, mock_number, started_at")
      .single();

    if (error) {
      console.error("[step/mini-mock/start]", error);
      return NextResponse.json(
        {
          error:
            "Could not start mini mock. Run supabase/step_mini_mock_setup.sql in Supabase.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      attemptId: attempt.id,
      mockNumber: attempt.mock_number,
      startedAt: attempt.started_at,
      timeLimitSeconds: MINI_MOCK_TIME_SECONDS,
      currentPhase: enrollment.current_phase,
      questions: payload,
    });
  } catch (err) {
    console.error("[step/mini-mock/start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start mini mock" },
      { status: 500 }
    );
  }
}
