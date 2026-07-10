import type { SupabaseClient } from "@supabase/supabase-js";
import { gradeObjectiveAnswer } from "@/lib/placement/adaptiveEngine";
import { getQuestionById } from "@/lib/placement/questionBank";
import { buildPlacementResult } from "@/lib/placement/scoring";
import type { Answer, TestState } from "@/lib/placement/types";

type PlacementAnswerRow = {
  question_id: string;
  section: string;
  band_level: number | null;
  student_answer: string | null;
  correct: boolean | null;
  time_taken: number | null;
};

const OBJECTIVE_TYPES = new Set(["mcq", "fill_blank", "error_correction"]);

export async function computePlacementFinishFromDb(
  supabase: SupabaseClient,
  attemptId: string
) {
  const { data: rows, error } = await supabase
    .from("placement_answers")
    .select("question_id, section, band_level, student_answer, correct, time_taken")
    .eq("attempt_id", attemptId);

  if (error) {
    throw new Error(error.message);
  }

  const answers: Answer[] = [];

  for (const row of (rows ?? []) as PlacementAnswerRow[]) {
    const question = getQuestionById(String(row.question_id));
    let correct = Boolean(row.correct);

    if (question && OBJECTIVE_TYPES.has(question.type)) {
      correct = gradeObjectiveAnswer(question, String(row.student_answer ?? ""));
    }

    answers.push({
      questionId: String(row.question_id),
      section: String(row.section ?? question?.section ?? ""),
      band: Number(row.band_level) || Number(question?.band) || 5,
      correct,
      timeTaken: Math.max(0, Number(row.time_taken) || 0),
    });
  }

  const state: TestState = {
    currentBand: 5,
    confidence: Math.min(100, Math.max(40, answers.length * 3)),
    answeredIds: answers.map((a) => a.questionId),
    answers,
    sectionScores: {},
    questionsAsked: answers.length,
    maxQuestions: Math.max(answers.length, 28),
    speakingCompleted: true,
  };

  return buildPlacementResult(state);
}
