import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStepSupabase } from "@/lib/step/enrollmentService";
import {
  gradeMiniMock,
  weightedEstimatedFromHistory,
} from "@/lib/step/miniMock/grading";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const attemptId = body.attemptId;
  const answers = body.answers ?? {};
  const timeSpent = Number(body.timeSpent ?? 0);

  if (!attemptId) {
    return NextResponse.json({ error: "attemptId required" }, { status: 400 });
  }

  try {
    const supabase = getStepSupabase();

    const { data: attempt, error: fetchErr } = await supabase
      .from("step_mini_mock_attempts")
      .select("*")
      .eq("id", attemptId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (fetchErr || !attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status === "submitted") {
      return NextResponse.json({ alreadySubmitted: true, attemptId });
    }

    const { data: enrollment } = await supabase
      .from("step_enrollments")
      .select("current_phase")
      .eq("student_id", studentId)
      .maybeSingle();

    const questions = attempt.questions_snapshot ?? [];
    const graded = gradeMiniMock(questions, answers);
    const durationMinutes = Math.max(1, Math.round(timeSpent / 60));

    await supabase
      .from("step_mini_mock_attempts")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        answers,
        time_spent_seconds: timeSpent,
        reading_score: graded.readingRaw,
        structure_score: graded.structureRaw,
        listening_score: graded.listeningRaw,
        compositional_score: graded.compositionalRaw,
        total_score: graded.totalRaw,
        estimated_step_score: graded.estimatedStepScore,
      })
      .eq("id", attemptId);

    await supabase.from("step_mini_mock_results").insert({
      student_id: studentId,
      mock_number: attempt.mock_number,
      reading_score: graded.readingRaw,
      structure_score: graded.structureRaw,
      listening_score: graded.listeningRaw,
      compositional_score: graded.compositionalRaw,
      total_score: graded.totalRaw,
      total_questions: 20,
      estimated_step_score: graded.estimatedStepScore,
      duration_minutes: durationMinutes,
      phase: enrollment?.current_phase ?? 1,
    });

    await supabase.from("step_progress_history").insert({
      student_id: studentId,
      score: graded.estimatedStepScore,
      source: "mini_mock",
      phase: enrollment?.current_phase ?? 1,
      metadata: { attemptId, mockNumber: attempt.mock_number, rawTotal: graded.totalRaw },
    });

    const { data: recentMini } = await supabase
      .from("step_mini_mock_results")
      .select("total_score")
      .eq("student_id", studentId)
      .order("completed_at", { ascending: false })
      .limit(3);

    const newEstimate = weightedEstimatedFromHistory(
      (recentMini ?? []).map((r) => r.total_score ?? 0)
    );

    if (newEstimate != null) {
      await supabase
        .from("step_enrollments")
        .update({ estimated_score: newEstimate })
        .eq("student_id", studentId);
    }

    const { data: prevMini } = await supabase
      .from("step_mini_mock_results")
      .select("mock_number, total_score")
      .eq("student_id", studentId)
      .neq("mock_number", attempt.mock_number)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const improvement =
      prevMini != null ? graded.totalRaw - (prevMini.total_score ?? 0) : null;

    return NextResponse.json({
      success: true,
      attemptId,
      mockNumber: attempt.mock_number,
      ...graded,
      estimatedEnrollmentScore: newEstimate,
      durationMinutes,
      improvement,
      previousMockNumber: prevMini?.mock_number ?? null,
      results: graded.results,
    });
  } catch (err) {
    console.error("[step/mini-mock/submit]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submit failed" },
      { status: 500 }
    );
  }
}
