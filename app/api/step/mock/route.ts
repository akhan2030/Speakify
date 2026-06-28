import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStepEnrollment, getStepSupabase } from "@/lib/step/enrollmentService";
import { getFullMockQuestions } from "@/lib/step/sampleQuestions";
import { STEP_EXAM_MODEL } from "@/lib/step/examModel";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questions = getFullMockQuestions();

  return NextResponse.json({
    title: "STEP Practice Mock",
    totalQuestions: questions.length,
    timeLimitMinutes: STEP_EXAM_MODEL.totalMinutes,
    questions: questions.map((q, i) => ({ ...q, number: i + 1 })),
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getStepSupabase();
  await ensureStepEnrollment(supabase, studentId);

  const { data: mocks } = await supabase
    .from("step_mock_results")
    .select("*")
    .eq("student_id", studentId)
    .order("completed_at", { ascending: false });

  return NextResponse.json({ mocks: mocks ?? [] });
}
