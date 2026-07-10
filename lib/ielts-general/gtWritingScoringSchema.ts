import type { SessionDeduction } from "@/lib/growthRoadmap/extractDeductions";
import { normalizeTriggerPattern } from "@/lib/growthRoadmap/extractDeductions";
import type { RoadmapCriterion } from "@/lib/growthRoadmap/seedRecommendations";
import { roundToHalfBand } from "@/lib/speaking/scoringSchema";
import { calculateWritingOverallBand } from "@/lib/ielts/writingBandScore";

export type GtSaudiError = {
  type: string;
  example: string;
  correction: string;
  count?: number;
};

export type GtLetterFormatCheck = {
  openingCorrect: boolean;
  openingUsed: string;
  signoffCorrect: boolean;
  signoffUsed: string;
  signoffExpected?: string;
  registerConsistent: boolean;
  bulletPointsCovered: number;
  bulletPointsTotal: number;
};

export type GtStructuredDeduction = {
  criterion?: string;
  error_type?: string;
  reason?: string;
  evidence?: string;
  band_impact?: number;
};

export type GtTask1StructuredFeedback = {
  taskType: "task1";
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  overallBand: number;
  letterFormatCheck?: GtLetterFormatCheck;
  criteriaFeedback: {
    taskAchievement: string;
    coherenceCohesion: string;
    lexicalResource: string;
    grammaticalRange: string;
  };
  saudiSpecificErrors: GtSaudiError[];
  improvedSentence?: string;
  modelOpening?: string;
  overallFeedback: string;
  deductions?: GtStructuredDeduction[];
  evaluation?: string;
};

export type GtTask2StructuredFeedback = {
  taskType: "task2";
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  overallBand: number;
  criteriaFeedback: {
    taskResponse: string;
    coherenceCohesion: string;
    lexicalResource: string;
    grammaticalRange: string;
  };
  saudiSpecificErrors: GtSaudiError[];
  improvedParagraph?: string;
  overallFeedback: string;
  deductions?: GtStructuredDeduction[];
  evaluation?: string;
};

export type GtStructuredWritingFeedback =
  | GtTask1StructuredFeedback
  | GtTask2StructuredFeedback;

function asBand(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(9, Math.max(0, roundToHalfBand(n)));
}

function normalizeSaudiErrors(raw: unknown): GtSaudiError[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): GtSaudiError | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const type = String(row.type ?? "").trim();
      const example = String(row.example ?? "").trim();
      const correction = String(row.correction ?? "").trim();
      if (!type || !example) return null;
      return {
        type,
        example,
        correction,
        count: Number(row.count) || 1,
      };
    })
    .filter((item): item is GtSaudiError => item != null)
    .slice(0, 8);
}

function normalizeLetterFormat(raw: unknown): GtLetterFormatCheck | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  return {
    openingCorrect: Boolean(row.openingCorrect),
    openingUsed: String(row.openingUsed ?? ""),
    signoffCorrect: Boolean(row.signoffCorrect),
    signoffUsed: String(row.signoffUsed ?? ""),
    signoffExpected: row.signoffExpected ? String(row.signoffExpected) : undefined,
    registerConsistent: Boolean(row.registerConsistent),
    bulletPointsCovered: Number(row.bulletPointsCovered) || 0,
    bulletPointsTotal: Number(row.bulletPointsTotal) || 0,
  };
}

function buildProseEvaluation(
  feedback: GtStructuredWritingFeedback
): string {
  const lines: string[] = [];
  if (feedback.taskType === "task1") {
    lines.push(`TA: ${feedback.taskAchievement}/9`);
    lines.push(`CC: ${feedback.coherenceCohesion}/9`);
    lines.push(`LR: ${feedback.lexicalResource}/9`);
    lines.push(`GRA: ${feedback.grammaticalRange}/9`);
    lines.push(`Overall Band: ${feedback.overallBand}`);
    lines.push("");
    lines.push("Task Achievement:");
    lines.push(feedback.criteriaFeedback.taskAchievement);
    lines.push("");
    lines.push("Coherence and Cohesion:");
    lines.push(feedback.criteriaFeedback.coherenceCohesion);
  } else {
    lines.push(`TR: ${feedback.taskResponse}/9`);
    lines.push(`CC: ${feedback.coherenceCohesion}/9`);
    lines.push(`LR: ${feedback.lexicalResource}/9`);
    lines.push(`GRA: ${feedback.grammaticalRange}/9`);
    lines.push(`Overall Band: ${feedback.overallBand}`);
    lines.push("");
    lines.push("Task Response:");
    lines.push(feedback.criteriaFeedback.taskResponse);
    lines.push("");
    lines.push("Coherence and Cohesion:");
    lines.push(feedback.criteriaFeedback.coherenceCohesion);
  }
  lines.push("");
  lines.push("Lexical Resource:");
  lines.push(feedback.criteriaFeedback.lexicalResource);
  lines.push("");
  lines.push("Grammatical Range and Accuracy:");
  lines.push(feedback.criteriaFeedback.grammaticalRange);
  lines.push("");
  lines.push(feedback.overallFeedback);
  return lines.join("\n");
}

export function normalizeGtStructuredFeedback(
  raw: unknown,
  taskType: "task1" | "task2"
): GtStructuredWritingFeedback | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const criteriaFeedback =
    row.criteriaFeedback && typeof row.criteriaFeedback === "object"
      ? (row.criteriaFeedback as Record<string, string>)
      : {};

  if (taskType === "task1") {
    const ta = asBand(row.taskAchievement);
    const cc = asBand(row.coherenceCohesion);
    const lr = asBand(row.lexicalResource);
    const gra = asBand(row.grammaticalRange);
    const mean = (ta + cc + lr + gra) / 4;
    const feedback: GtTask1StructuredFeedback = {
      taskType: "task1",
      taskAchievement: ta,
      coherenceCohesion: cc,
      lexicalResource: lr,
      grammaticalRange: gra,
      overallBand:
        calculateWritingOverallBand(ta, cc, lr, gra) ?? roundToHalfBand(mean),
      letterFormatCheck: normalizeLetterFormat(row.letterFormatCheck),
      criteriaFeedback: {
        taskAchievement: String(criteriaFeedback.taskAchievement ?? ""),
        coherenceCohesion: String(criteriaFeedback.coherenceCohesion ?? ""),
        lexicalResource: String(criteriaFeedback.lexicalResource ?? ""),
        grammaticalRange: String(criteriaFeedback.grammaticalRange ?? ""),
      },
      saudiSpecificErrors: normalizeSaudiErrors(row.saudiSpecificErrors),
      improvedSentence: row.improvedSentence ? String(row.improvedSentence) : undefined,
      modelOpening: row.modelOpening ? String(row.modelOpening) : undefined,
      overallFeedback: String(row.overallFeedback ?? ""),
      deductions: Array.isArray(row.deductions)
        ? (row.deductions as GtStructuredDeduction[])
        : [],
    };
    feedback.evaluation = buildProseEvaluation(feedback);
    return feedback;
  }

  const tr = asBand(row.taskResponse);
  const cc = asBand(row.coherenceCohesion);
  const lr = asBand(row.lexicalResource);
  const gra = asBand(row.grammaticalRange);
  const mean = (tr + cc + lr + gra) / 4;
  const feedback: GtTask2StructuredFeedback = {
    taskType: "task2",
    taskResponse: tr,
    coherenceCohesion: cc,
    lexicalResource: lr,
    grammaticalRange: gra,
    overallBand:
      calculateWritingOverallBand(tr, cc, lr, gra) ?? roundToHalfBand(mean),
    criteriaFeedback: {
      taskResponse: String(criteriaFeedback.taskResponse ?? ""),
      coherenceCohesion: String(criteriaFeedback.coherenceCohesion ?? ""),
      lexicalResource: String(criteriaFeedback.lexicalResource ?? ""),
      grammaticalRange: String(criteriaFeedback.grammaticalRange ?? ""),
    },
    saudiSpecificErrors: normalizeSaudiErrors(row.saudiSpecificErrors),
    improvedParagraph: row.improvedParagraph ? String(row.improvedParagraph) : undefined,
    overallFeedback: String(row.overallFeedback ?? ""),
    deductions: Array.isArray(row.deductions) ? (row.deductions as GtStructuredDeduction[]) : [],
  };
  feedback.evaluation = buildProseEvaluation(feedback);
  return feedback;
}

export function gtFeedbackToBands(feedback: GtStructuredWritingFeedback) {
  if (feedback.taskType === "task1") {
    const ta = feedback.taskAchievement;
    const cc = feedback.coherenceCohesion;
    const lr = feedback.lexicalResource;
    const gra = feedback.grammaticalRange;
    return {
      ta,
      cc,
      lr,
      gra,
      overall: calculateWritingOverallBand(ta, cc, lr, gra) ?? feedback.overallBand,
    };
  }
  const ta = feedback.taskResponse;
  const cc = feedback.coherenceCohesion;
  const lr = feedback.lexicalResource;
  const gra = feedback.grammaticalRange;
  return {
    ta,
    cc,
    lr,
    gra,
    overall: calculateWritingOverallBand(ta, cc, lr, gra) ?? feedback.overallBand,
  };
}

export function extractGtWritingDeductions(
  feedback: GtStructuredWritingFeedback | null | undefined
): SessionDeduction[] {
  if (!feedback?.deductions?.length) return [];

  const results: SessionDeduction[] = [];
  const seen = new Set<string>();

  for (const deduction of feedback.deductions) {
    const criterion = String(deduction.criterion ?? "lexical_resource") as RoadmapCriterion;
    const trigger =
      normalizeTriggerPattern(deduction.error_type) ??
      normalizeTriggerPattern(deduction.reason);
    if (!trigger) continue;
    const key = `${criterion}:${trigger}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      criterion,
      trigger_pattern: trigger,
      reason: String(deduction.reason ?? trigger),
      evidence: String(deduction.evidence ?? ""),
      band_impact: Math.abs(Number(deduction.band_impact) || 0.25),
    });
  }

  return results;
}
