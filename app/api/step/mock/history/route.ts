import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStepEnrollment, getStepSupabase } from "@/lib/step/enrollmentService";
import { MOCK_TIME_SECONDS } from "@/lib/step/mockExam/constants";

export async function GET() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getStepSupabase();
    await ensureStepEnrollment(supabase, studentId);

    const { data: mocks } = await supabase
      .from("step_mock_results")
      .select(
        "mock_number, completed_at, reading_score, structure_score, listening_score, compositional_score, total_score, phase"
      )
      .eq("student_id", studentId)
      .eq("mock_type", "full")
      .order("completed_at", { ascending: false })
      .limit(5);

    const { count } = await supabase
      .from("step_mock_results")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("mock_type", "full");

    const nextMockNumber = (count ?? 0) + 1;

    const { data: inProgress } = await supabase
      .from("step_mock_attempts")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "in_progress")
      .maybeSingle();

    return NextResponse.json({
      mocks: mocks ?? [],
      nextMockNumber,
      hasInProgressAttempt: Boolean(inProgress),
      timeLimitMinutes: MOCK_TIME_SECONDS / 60,
      totalQuestions: 100,
    });
  } catch (err) {
    console.error("[step/mock/history]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load history" },
      { status: 500 }
    );
  }
}
