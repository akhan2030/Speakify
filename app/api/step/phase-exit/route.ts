import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPhaseDefinition } from "@/lib/step/phases";
import { ensureStepEnrollment, getStepSupabase } from "@/lib/step/enrollmentService";
import { getPhaseExitQuestions } from "@/lib/step/sampleQuestions";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const phase = Number(searchParams.get("phase") ?? 1);

  const supabase = getStepSupabase();
  const enrollment = await ensureStepEnrollment(supabase, studentId);
  const activePhase = enrollment.current_phase;
  const def = getPhaseDefinition(phase);

  if (!def) {
    return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
  }

  if (phase !== activePhase) {
    return NextResponse.json(
      { error: "Phase exit only available for your current active phase" },
      { status: 400 }
    );
  }

  const questions = getPhaseExitQuestions(phase);

  return NextResponse.json({
    phase,
    title: def.title,
    exitScoreRequired: def.exitScoreRequired,
    questions: questions.map((q, i) => ({ ...q, number: i + 1 })),
    timeLimitMinutes: 30,
  });
}
