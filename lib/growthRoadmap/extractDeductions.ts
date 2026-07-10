import type { StructuredSpeakingScore } from "@/lib/speaking/scoringSchema";
import type { StructuredWritingScore } from "@/lib/ielts/writingScoringSchema";
import { activeWritingCriteria } from "@/lib/ielts/writingScoringSchema";
import {
  PRACTICE_RECOMMENDATION_SEEDS,
  TRIGGER_PATTERN_ALIASES,
  type RoadmapCriterion,
} from "@/lib/growthRoadmap/seedRecommendations";

export type SessionDeduction = {
  criterion: RoadmapCriterion;
  trigger_pattern: string;
  reason: string;
  evidence: string;
  band_impact: number;
};

const SPEAKING_CRITERION_KEYS = [
  "fluency_coherence",
  "lexical_resource",
  "grammatical_range_accuracy",
  "pronunciation",
] as const;

export function normalizeTriggerPattern(raw: string | undefined | null): string | null {
  const value = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!value) return null;
  return TRIGGER_PATTERN_ALIASES[value] ?? value;
}

export function extractSpeakingDeductions(
  structuredScore: StructuredSpeakingScore | undefined | null
): SessionDeduction[] {
  if (!structuredScore?.criteria) return [];

  const results: SessionDeduction[] = [];
  const seen = new Set<string>();

  for (const criterion of SPEAKING_CRITERION_KEYS) {
    const block = structuredScore.criteria[criterion];
    if (!block?.deductions?.length) continue;

    for (const deduction of block.deductions) {
      const trigger =
        normalizeTriggerPattern(deduction.error_type) ??
        inferPatternFromReason(deduction.reason);

      if (!trigger) continue;
      const key = `${criterion}:${trigger}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        criterion,
        trigger_pattern: trigger,
        reason: deduction.reason,
        evidence: deduction.evidence,
        band_impact: Math.abs(Number(deduction.band_impact) || 0.25),
      });
    }
  }

  return results;
}

type SpeakingFeedbackPayload = {
  structuredScore?: StructuredSpeakingScore;
  sessionScore?: {
    fluency?: { band?: number };
    lexical?: { band?: number };
    grammar?: { band?: number };
    pronunciation?: { band?: number };
  };
  topImprovements?: string[];
};

/** Fallback when structured deductions are empty — uses weakest criterion band. */
export function inferSpeakingDeductionsFromFeedback(
  feedback: SpeakingFeedbackPayload | Record<string, unknown> | null | undefined
): SessionDeduction[] {
  const payload = feedback as SpeakingFeedbackPayload | null | undefined;
  const structured = extractSpeakingDeductions(payload?.structuredScore);
  if (structured.length) return structured;

  const sessionScore = payload?.sessionScore;
  if (!sessionScore) return [];

  const pairs: {
    key: keyof NonNullable<SpeakingFeedbackPayload["sessionScore"]>;
    criterion: RoadmapCriterion;
    trigger: string;
    label: string;
  }[] = [
    {
      key: "fluency",
      criterion: "fluency_coherence",
      trigger: "filler_word_overuse",
      label: "fluency",
    },
    {
      key: "lexical",
      criterion: "lexical_resource",
      trigger: "repetitive_vocabulary",
      label: "vocabulary",
    },
    {
      key: "grammar",
      criterion: "grammatical_range_accuracy",
      trigger: "run_on_sentences",
      label: "grammar",
    },
    {
      key: "pronunciation",
      criterion: "pronunciation",
      trigger: "word_stress_error",
      label: "pronunciation",
    },
  ];

  const scored = pairs
    .map((pair) => {
      const block = sessionScore[pair.key];
      const band = Number(block?.band);
      return { ...pair, band: Number.isFinite(band) ? band : 9 };
    })
    .sort((a, b) => a.band - b.band);

  const weakest = scored[0];
  if (!weakest || weakest.band >= 7) return [];

  const improvementHint = payload?.topImprovements?.[0];
  return [
    {
      criterion: weakest.criterion,
      trigger_pattern: weakest.trigger,
      reason:
        improvementHint ??
        `Strengthen ${weakest.label} (scored Band ${weakest.band.toFixed(1)})`,
      evidence: "",
      band_impact: 0.5,
    },
  ];
}

function inferPatternFromReason(reason: string): string | null {
  const lower = reason.toLowerCase();
  if (/filler|hesitat|um\b|uh\b/.test(lower)) return "filler_word_overuse";
  if (/repetit|basic vocab|overused|limited vocab/.test(lower)) {
    return "repetitive_vocabulary";
  }
  if (/past tense|tense inconsisten|verb form/.test(lower)) {
    return "past_tense_inconsistency";
  }
  if (/run-on|run on|comma splice|long sentence/.test(lower)) return "run_on_sentences";
  if (/linking|coherence|connector|however|therefore/.test(lower)) {
    return "weak_coherence_markers";
  }
  if (/very unique|intensifier|very\s+\w+/.test(lower)) return "redundant_intensifiers";
  if (/stress|pronunciation|unclear/.test(lower)) return "word_stress_error";
  return null;
}

export function extractWritingDeductions(
  structuredScore: StructuredWritingScore | undefined | null
): SessionDeduction[] {
  if (!structuredScore?.criteria) return [];

  const results: SessionDeduction[] = [];
  const seen = new Set<string>();

  for (const criterion of activeWritingCriteria(structuredScore.task_type)) {
    const block = structuredScore.criteria[criterion];
    if (!block?.deductions?.length) continue;

    for (const deduction of block.deductions) {
      const trigger =
        normalizeTriggerPattern(deduction.error_type) ??
        inferPatternFromReason(deduction.reason);

      if (!trigger) continue;
      const key = `${criterion}:${trigger}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        criterion: criterion as RoadmapCriterion,
        trigger_pattern: trigger,
        reason: deduction.reason,
        evidence: deduction.evidence,
        band_impact: Math.abs(Number(deduction.band_impact) || 0.25),
      });
    }
  }

  return results;
}

export function inferWritingDeductions(input: {
  evaluationText: string;
  bands?: {
    ta?: number | null;
    cc?: number | null;
    lr?: number | null;
    gra?: number | null;
    overall?: number | null;
  };
  taskType?: "task1" | "task2";
}): SessionDeduction[] {
  const text = String(input.evaluationText || "");
  const lower = text.toLowerCase();
  const results: SessionDeduction[] = [];
  const seen = new Set<string>();

  const add = (deduction: SessionDeduction) => {
    const key = `${deduction.criterion}:${deduction.trigger_pattern}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(deduction);
  };

  const snippet = text.slice(0, 200).replace(/\s+/g, " ").trim();

  if (/repetit|overused|basic vocab|limited range of vocab/.test(lower)) {
    add({
      criterion: "lexical_resource",
      trigger_pattern: "repetitive_vocabulary",
      reason: "Repetitive vocabulary in your essay",
      evidence: snippet,
      band_impact: 0.5,
    });
  }

  if (/run-on|run on|comma splice|sentence fragment|overly long sentence/.test(lower)) {
    add({
      criterion: "grammatical_range_accuracy",
      trigger_pattern: "run_on_sentences",
      reason: "Run-on or poorly controlled sentences",
      evidence: snippet,
      band_impact: 0.5,
    });
  }

  if (/past tense|tense inconsisten|verb tense|article/.test(lower)) {
    add({
      criterion: "grammatical_range_accuracy",
      trigger_pattern: "past_tense_inconsistency",
      reason: "Tense or article accuracy issues",
      evidence: snippet,
      band_impact: 0.5,
    });
  }

  if (/linking|cohesion|coherence|transition|paragraph flow|topic sentence/.test(lower)) {
    const pattern = /paragraph|topic sentence/.test(lower)
      ? "poor_paragraph_linking"
      : "weak_coherence_markers";
    add({
      criterion: "coherence_cohesion",
      trigger_pattern: pattern,
      reason: "Weak cohesion or paragraph linking",
      evidence: snippet,
      band_impact: 0.5,
    });
  }

  if (/very unique|intensifier|very\s+\w+|really\s+\w+/.test(lower)) {
    add({
      criterion: "lexical_resource",
      trigger_pattern: "redundant_intensifiers",
      reason: "Redundant intensifiers weaken lexical precision",
      evidence: snippet,
      band_impact: 0.25,
    });
  }

  if (
    input.taskType === "task2" &&
    /position|thesis|argument|does not address|off-topic|unclear opinion/.test(lower)
  ) {
    add({
      criterion: "task_response",
      trigger_pattern: "weak_task_response",
      reason: "Weak or unclear position in Task 2",
      evidence: snippet,
      band_impact: 0.5,
    });
  }

  if (
    input.taskType === "task1" &&
    /overview|key features|data|trend|comparison|inaccurate/.test(lower)
  ) {
    add({
      criterion: "task_achievement",
      trigger_pattern: "weak_task_achievement",
      reason: "Task 1 overview or data description needs work",
      evidence: snippet,
      band_impact: 0.5,
    });
  }

  const bands = input.bands ?? {};
  const criterionBands: Array<{ criterion: RoadmapCriterion; band: number; pattern: string }> =
    [
      {
        criterion: "task_achievement",
        band: Number(bands.ta) || 9,
        pattern: "weak_task_achievement",
      },
      {
        criterion: "task_response",
        band: Number(bands.ta) || 9,
        pattern: "weak_task_response",
      },
      {
        criterion: "coherence_cohesion",
        band: Number(bands.cc) || 9,
        pattern: "weak_coherence_markers",
      },
      {
        criterion: "lexical_resource",
        band: Number(bands.lr) || 9,
        pattern: "repetitive_vocabulary",
      },
      {
        criterion: "grammatical_range_accuracy",
        band: Number(bands.gra) || 9,
        pattern: "run_on_sentences",
      },
    ];

  if (results.length === 0) {
    const weakest = [...criterionBands].sort((a, b) => a.band - b.band)[0];
    if (weakest && weakest.band < 6.5) {
      const pattern =
        input.taskType === "task1" ? "weak_task_achievement" : weakest.pattern;
      add({
        criterion:
          input.taskType === "task1"
            ? "task_achievement"
            : input.taskType === "task2" && pattern === "weak_task_response"
              ? "task_response"
              : weakest.criterion,
        trigger_pattern: pattern,
        reason: `Lowest writing criterion flagged for practice (${weakest.criterion})`,
        evidence: snippet,
        band_impact: 0.25,
      });
    }
  }

  return results;
}

export function knownRecommendationPatterns(): Set<string> {
  return new Set(PRACTICE_RECOMMENDATION_SEEDS.map((row) => row.trigger_pattern));
}
