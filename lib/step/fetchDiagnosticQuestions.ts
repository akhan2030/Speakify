import type { SupabaseClient } from "@supabase/supabase-js";
import type { StepSectionId } from "./examModel";
import type { StepMcqQuestion } from "./types";
import { getSampleQuestions, normalizeStepQuestions } from "./sampleQuestions";

const DIAGNOSTIC_SECTIONS: StepSectionId[] = [
  "reading",
  "structure",
  "listening",
  "compositional_analysis",
];

const PER_SECTION = 10;

async function pullFromBank(
  supabase: SupabaseClient,
  section: StepSectionId,
  count: number
): Promise<StepMcqQuestion[]> {
  const { data: rows } = await supabase
    .from("step_practice_bank")
    .select("content, id")
    .eq("section", section)
    .order("created_at", { ascending: false })
    .limit(8);

  const fromBank: StepMcqQuestion[] = [];
  const seen = new Set<string>();

  for (const row of rows ?? []) {
    for (const q of normalizeStepQuestions(row.content)) {
      const key = q.stem.trim();
      if (seen.has(key)) continue;
      seen.add(key);
      fromBank.push({ ...q, section, id: q.id || `${section}-${fromBank.length}` });
      if (fromBank.length >= count) break;
    }
    if (fromBank.length >= count) break;
  }

  if (fromBank.length >= count) return fromBank.slice(0, count);

  const fallback = getSampleQuestions(section, count);
  for (const q of fallback) {
    if (fromBank.length >= count) break;
    const key = q.stem.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    fromBank.push(q);
  }

  return fromBank.slice(0, count);
}

/** 40 diagnostic MCQs — 10 per section, bank-first with sample fallback */
export async function fetchDiagnosticQuestions(
  supabase: SupabaseClient
): Promise<StepMcqQuestion[]> {
  const batches = await Promise.all(
    DIAGNOSTIC_SECTIONS.map((section) =>
      pullFromBank(supabase, section, PER_SECTION)
    )
  );
  return batches.flat().map((q, i) => ({
    ...q,
    id: q.id || `diag-${i + 1}`,
    number: i + 1,
  }));
}

export const DIAGNOSTIC_TIME_MINUTES = 45;
export const DIAGNOSTIC_QUESTION_COUNT = DIAGNOSTIC_SECTIONS.length * PER_SECTION;
