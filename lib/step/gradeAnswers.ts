import type { StepMcqOption } from "./types";
import type { StepSectionId } from "./examModel";
import {
  FALLBACK_COMPOSITIONAL_ITEMS,
  FALLBACK_LISTENING_RECORDINGS,
  FALLBACK_READING_PASSAGES,
  FALLBACK_STRUCTURE_ITEMS,
} from "./fallbackQuestions";
import { parseBankContent } from "./bankContent";
import { getStepSupabase } from "./enrollmentService";

export type GradedAnswer = {
  id: string;
  chosen: StepMcqOption | null;
  correct: StepMcqOption;
  isCorrect: boolean;
  explanation: string;
  questionType?: string;
  grammarPoint?: string;
};

function collectFallbackQuestions(section: StepSectionId) {
  if (section === "reading") {
    return FALLBACK_READING_PASSAGES.flatMap((p) => p.questions ?? []);
  }
  if (section === "listening") {
    return FALLBACK_LISTENING_RECORDINGS.flatMap((r) => r.questions ?? []);
  }
  if (section === "structure") {
    return FALLBACK_STRUCTURE_ITEMS;
  }
  return FALLBACK_COMPOSITIONAL_ITEMS;
}

async function collectBankQuestions(section: StepSectionId) {
  const supabase = getStepSupabase();
  const { data } = await supabase
    .from("step_practice_bank")
    .select("content")
    .eq("section", section)
    .order("created_at", { ascending: false })
    .limit(10);

  const all = [];
  for (const row of data ?? []) {
    const parsed = parseBankContent(section, row.content);
    if (!parsed) continue;
    if (parsed.kind === "reading") {
      all.push(...parsed.passages.flatMap((p) => p.questions ?? []));
    } else if (parsed.kind === "listening") {
      all.push(...parsed.recordings.flatMap((r) => r.questions ?? []));
    } else {
      all.push(...parsed.items);
    }
  }
  return all;
}

export async function gradeStepAnswers(
  section: StepSectionId,
  answers: Record<string, StepMcqOption | string | null | undefined>
): Promise<{
  results: GradedAnswer[];
  correct: number;
  attempted: number;
}> {
  const ids = Object.keys(answers);
  const fallback = collectFallbackQuestions(section);
  const bank = await collectBankQuestions(section);
  const pool = [...fallback, ...bank];
  const byId = new Map(pool.map((q) => [q.id, q]));

  const results: GradedAnswer[] = [];
  let correct = 0;

  for (const id of ids) {
    const q = byId.get(id);
    const chosen = (answers[id] ?? null) as StepMcqOption | null;
    if (!q) {
      results.push({
        id,
        chosen,
        correct: "A",
        isCorrect: false,
        explanation: "Question not found.",
      });
      continue;
    }
    const isCorrect = chosen === q.correct;
    if (isCorrect) correct++;
    results.push({
      id,
      chosen,
      correct: q.correct,
      isCorrect,
      explanation: q.explanation,
      questionType: q.questionType,
      grammarPoint: "grammarPoint" in q ? (q as { grammarPoint?: string }).grammarPoint : undefined,
    });
  }

  return { results, correct, attempted: ids.length };
}
