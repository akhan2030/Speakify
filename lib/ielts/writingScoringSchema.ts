import type { ScoreDeduction } from "@/lib/speaking/scoringSchema";
import { roundToHalfBand } from "@/lib/speaking/scoringSchema";

export type WritingCriterionKey =
  | "task_achievement"
  | "task_response"
  | "coherence_cohesion"
  | "lexical_resource"
  | "grammatical_range_accuracy";

export type WritingCriterionScore = {
  band: number;
  weight: 0.25;
  deductions: ScoreDeduction[];
  strengths?: string[];
};

export type StructuredWritingScore = {
  overall_band: number;
  task_type: "task1" | "task2";
  criteria: Record<WritingCriterionKey, WritingCriterionScore>;
};

export const WRITING_ERROR_TYPES = [
  "repetitive_vocabulary",
  "redundant_intensifiers",
  "run_on_sentences",
  "past_tense_inconsistency",
  "weak_coherence_markers",
  "poor_paragraph_linking",
  "weak_task_response",
  "weak_task_achievement",
  "inaccurate_data_description",
  "weak_thesis_statement",
] as const;

export const WRITING_CRITERION_LABELS: Record<WritingCriterionKey, string> = {
  task_achievement: "Task Achievement",
  task_response: "Task Response",
  coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource",
  grammatical_range_accuracy: "Grammatical Range & Accuracy",
};

function asBand(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(9, Math.max(0, roundToHalfBand(n)));
}

function normalizeDeductions(raw: unknown): ScoreDeduction[] {
  if (!Array.isArray(raw)) return [];
  const results: ScoreDeduction[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const reason = String(row.reason ?? "").trim();
    const evidence = String(row.evidence ?? "").trim();
    if (!reason || !evidence) continue;
    results.push({
      reason,
      evidence,
      band_impact: Math.abs(Number(row.band_impact) || 0.25),
      error_type: row.error_type ? String(row.error_type) : undefined,
    });
    if (results.length >= 4) break;
  }
  return results;
}

function emptyCriterion(): WritingCriterionScore {
  return { band: 0, weight: 0.25, deductions: [], strengths: [] };
}

export function activeWritingCriteria(taskType: "task1" | "task2"): WritingCriterionKey[] {
  if (taskType === "task1") {
    return [
      "task_achievement",
      "coherence_cohesion",
      "lexical_resource",
      "grammatical_range_accuracy",
    ];
  }
  return [
    "task_response",
    "coherence_cohesion",
    "lexical_resource",
    "grammatical_range_accuracy",
  ];
}

export function normalizeStructuredWritingScore(
  raw: unknown,
  taskType: "task1" | "task2"
): StructuredWritingScore | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Record<string, unknown>;
  const criteriaRaw = payload.criteria;
  if (!criteriaRaw || typeof criteriaRaw !== "object") return null;

  const keys = activeWritingCriteria(taskType);
  const criteria = {} as Record<WritingCriterionKey, WritingCriterionScore>;

  for (const key of keys) {
    const block = (criteriaRaw as Record<string, unknown>)[key];
    if (!block || typeof block !== "object") {
      criteria[key] = emptyCriterion();
      continue;
    }
    const row = block as Record<string, unknown>;
    criteria[key] = {
      band: asBand(row.band),
      weight: 0.25,
      deductions: normalizeDeductions(row.deductions),
      strengths: Array.isArray(row.strengths)
        ? row.strengths.map((s) => String(s)).filter(Boolean).slice(0, 3)
        : [],
    };
  }

  const bands = keys.map((key) => criteria[key].band);
  const mean = bands.reduce((sum, band) => sum + band, 0) / bands.length;
  const overall = asBand(payload.overall_band, roundToHalfBand(mean));

  return {
    overall_band: overall,
    task_type: taskType,
    criteria,
  };
}

export function structuredWritingToFlatBands(score: StructuredWritingScore) {
  const c = score.criteria;
  return {
    ta: score.task_type === "task1" ? c.task_achievement.band : c.task_response.band,
    cc: c.coherence_cohesion.band,
    lr: c.lexical_resource.band,
    gra: c.grammatical_range_accuracy.band,
    overall: score.overall_band,
  };
}
