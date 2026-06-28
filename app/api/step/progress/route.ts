import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { StepSectionId } from "@/lib/step/examModel";
import { STEP_SECTIONS } from "@/lib/step/examModel";
import {
  ensureStepEnrollment,
  getStepSupabase,
  recordSectionSession,
} from "@/lib/step/enrollmentService";
import { gradeStepAnswers } from "@/lib/step/gradeAnswers";
import {
  conservativeSectionEstimate,
  totalEstimatedFromSections,
} from "@/lib/step/practiceScoreUtils";

const VALID_SECTIONS = new Set(Object.keys(STEP_SECTIONS));

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") as StepSectionId | null;

  try {
    const supabase = getStepSupabase();
    const today = new Date().toISOString().slice(0, 10);

    let query = supabase
      .from("step_section_scores")
      .select("section, questions_attempted, questions_correct, estimated_score, session_date")
      .eq("student_id", studentId);

    if (section && VALID_SECTIONS.has(section)) {
      query = query.eq("section", section);
    }

    const { data: rows } = await query.order("updated_at", { ascending: false });

    const todayBySection: Record<string, unknown> = {};
    const latestBySection: Record<string, number> = {};

    for (const row of rows ?? []) {
      const key = row.section as string;
      if (!latestBySection[key]) {
        latestBySection[key] = row.estimated_score ?? 0;
      }
      if (row.session_date === today && !todayBySection[key]) {
        todayBySection[key] = {
          questionsAttempted: row.questions_attempted ?? 0,
          questionsCorrect: row.questions_correct ?? 0,
          estimatedScore: row.estimated_score ?? 0,
        };
      }
    }

    const sectionEstimates: Partial<Record<StepSectionId, number>> = {};
    for (const key of Object.keys(latestBySection)) {
      sectionEstimates[key as StepSectionId] = latestBySection[key];
    }

    return NextResponse.json({
      today: todayBySection,
      sectionEstimates,
      totalEstimated: totalEstimatedFromSections(sectionEstimates),
    });
  } catch (err) {
    console.error("[step/progress GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const section = body.section as StepSectionId;
  let questionsAttempted = Number(body.questionsAttempted ?? 0);
  let questionsCorrect = Number(body.questionsCorrect ?? 0);
  const answers = body.answers as Record<string, string> | undefined;

  if (!section || !VALID_SECTIONS.has(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  let gradedResults;
  if (answers && Object.keys(answers).length > 0) {
    const graded = await gradeStepAnswers(section, answers);
    questionsAttempted = graded.attempted;
    questionsCorrect = graded.correct;
    gradedResults = graded.results;
  }

  if (questionsAttempted <= 0) {
    return NextResponse.json({ error: "questionsAttempted required" }, { status: 400 });
  }

  const sectionEstimate = conservativeSectionEstimate(
    section,
    questionsCorrect,
    questionsAttempted
  );

  try {
    const supabase = getStepSupabase();
    await ensureStepEnrollment(supabase, studentId);

    await recordSectionSession(
      supabase,
      studentId,
      section,
      questionsCorrect,
      questionsAttempted,
      sectionEstimate
    );

    const { data: sectionRows } = await supabase
      .from("step_section_scores")
      .select("section, estimated_score")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false });

    const sectionScores: Partial<Record<StepSectionId, number>> = {};
    for (const row of sectionRows ?? []) {
      const key = row.section as StepSectionId;
      if (sectionScores[key] == null) {
        sectionScores[key] = row.estimated_score ?? 0;
      }
    }

    const totalEstimated = totalEstimatedFromSections(sectionScores);

    await supabase
      .from("step_enrollments")
      .update({ estimated_score: totalEstimated })
      .eq("student_id", studentId);

    const today = new Date().toISOString().slice(0, 10);
    const { data: todayRow } = await supabase
      .from("step_section_scores")
      .select("questions_attempted, questions_correct, estimated_score")
      .eq("student_id", studentId)
      .eq("session_date", today)
      .eq("section", section)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      section,
      sessionCorrect: questionsCorrect,
      sessionAttempted: questionsAttempted,
      sectionEstimate,
      totalEstimated,
      results: gradedResults,
      today: {
        questionsAttempted: todayRow?.questions_attempted ?? questionsAttempted,
        questionsCorrect: todayRow?.questions_correct ?? questionsCorrect,
        estimatedScore: todayRow?.estimated_score ?? sectionEstimate,
      },
    });
  } catch (err) {
    console.error("[step/progress POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save progress" },
      { status: 500 }
    );
  }
}
