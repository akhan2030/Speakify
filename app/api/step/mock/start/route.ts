import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStepEnrollment, getStepSupabase } from "@/lib/step/enrollmentService";
import { buildFullMockExam } from "@/lib/step/mockExam/generateMockQuestions";
import { MOCK_TIME_SECONDS } from "@/lib/step/mockExam/constants";

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
      .from("step_mock_attempts")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "in_progress")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a mock exam in progress.", attemptId: existing.id },
        { status: 409 }
      );
    }

    const { count } = await supabase
      .from("step_mock_results")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("mock_type", "full");

    const mockNumber = (count ?? 0) + 1;

    const { data: lastAttempt } = await supabase
      .from("step_mock_attempts")
      .select("question_ids")
      .eq("student_id", studentId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const excludeIds = (lastAttempt?.question_ids as string[]) ?? [];
    const { questions, payload } = await buildFullMockExam(mockNumber, excludeIds);

    const { data: attempt, error } = await supabase
      .from("step_mock_attempts")
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
      console.error("[step/mock/start]", error);
      return NextResponse.json(
        { error: "Could not create mock attempt. Run step_mock_attempts_setup.sql in Supabase." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      attemptId: attempt.id,
      mockNumber: attempt.mock_number,
      startedAt: attempt.started_at,
      timeLimitSeconds: MOCK_TIME_SECONDS,
      currentPhase: enrollment.current_phase,
      questions: payload,
    });
  } catch (err) {
    console.error("[step/mock/start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start mock" },
      { status: 500 }
    );
  }
}
