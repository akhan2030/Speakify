/**
 * IELTS Speaking Module v2 — structured scoring contract.
 * Phase 3+ (UI, adaptive learning, charts) must read from this schema.
 *
 * overall_band = mean of the four criterion bands, rounded to nearest 0.5
 * Each criterion weight is always 0.25 (IELTS official equal weighting).
 * Every deduction must include reason + evidence (quote or metric) + band_impact.
 */

export type SpeakingCriterionKey =
  | "fluency_coherence"
  | "lexical_resource"
  | "grammatical_range_accuracy"
  | "pronunciation";

export type ScoreDeduction = {
  reason: string;
  evidence: string;
  band_impact: number;
  error_type?: ErrorType | string;
};

export type CriterionScore = {
  band: number;
  weight: 0.25;
  deductions: ScoreDeduction[];
  strengths?: string[];
};

export type WordTiming = {
  word: string;
  start: number;
  end: number;
  /** 0–1 when available from STT; Whisper often omits this. */
  confidence?: number;
};

export type FluencyMetrics = {
  words_per_minute: number;
  pause_count: number;
  average_pause_ms: number;
  filler_word_count: number;
  filler_word_rate: number;
  self_correction_count: number;
  speaking_seconds: number;
  total_words: number;
};

export type PronunciationMetrics = {
  accuracy_score?: number;
  fluency_score?: number;
  prosody_score?: number;
  /** True when no dedicated pronunciation API was available. */
  estimated: boolean;
  notes?: string;
  low_confidence_words?: string[];
};

export type StructuredSpeakingScore = {
  overall_band: number;
  criteria: Record<SpeakingCriterionKey, CriterionScore>;
  transcript_with_annotations?: string;
  session_id?: string;
  fluency_metrics?: FluencyMetrics;
  pronunciation_metrics?: PronunciationMetrics;
};

export const CRITERION_WEIGHT = 0.25 as const;

export const CRITERION_LABELS: Record<SpeakingCriterionKey, string> = {
  fluency_coherence: "Fluency & Coherence",
  lexical_resource: "Lexical Resource",
  grammatical_range_accuracy: "Grammatical Range & Accuracy",
  pronunciation: "Pronunciation",
};

export const ERROR_TYPE_TAXONOMY = [
  "past_tense_inconsistency",
  "article_omission",
  "subject_verb_agreement",
  "run_on_sentences",
  "limited_complex_structures",
  "filler_word_overuse",
  "frequent_hesitation",
  "slow_speech_rate",
  "repetitive_vocabulary",
  "basic_vocabulary_only",
  "incorrect_collocation",
  "word_stress_error",
  "consonant_confusion",
  "unclear_pronunciation",
  "weak_coherence_markers",
] as const;

export type ErrorType = (typeof ERROR_TYPE_TAXONOMY)[number];

export function roundToHalfBand(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 2) / 2;
}

export function computeOverallBand(
  criteria: Record<SpeakingCriterionKey, CriterionScore>
): number {
  const bands = [
    criteria.fluency_coherence.band,
    criteria.lexical_resource.band,
    criteria.grammatical_range_accuracy.band,
    criteria.pronunciation.band,
  ];
  const mean = bands.reduce((a, b) => a + b, 0) / bands.length;
  return roundToHalfBand(mean);
}

function asBand(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(9, Math.max(0, roundToHalfBand(n)));
}

function normalizeDeductions(raw: unknown): ScoreDeduction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const reason = String(row.reason || "").trim();
      const evidence = String(row.evidence || "").trim();
      if (!reason || !evidence) return null;
      return {
        reason,
        evidence,
        band_impact: Number(row.band_impact) || -0.5,
        error_type: row.error_type ? String(row.error_type) : undefined,
      };
    })
    .filter(Boolean) as ScoreDeduction[];
}

function normalizeCriterion(raw: unknown, fallbackBand = 0): CriterionScore {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    band: asBand(row.band, fallbackBand),
    weight: CRITERION_WEIGHT,
    deductions: normalizeDeductions(row.deductions),
    strengths: Array.isArray(row.strengths)
      ? row.strengths.map((s) => String(s)).filter(Boolean)
      : undefined,
  };
}

/** Validate / coerce LLM or partial output into the locked contract. */
export function normalizeStructuredScore(
  raw: unknown,
  sessionId?: string,
  fluencyMetrics?: FluencyMetrics,
  pronunciationMetrics?: PronunciationMetrics
): StructuredSpeakingScore {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const criteriaRaw =
    row.criteria && typeof row.criteria === "object"
      ? (row.criteria as Record<string, unknown>)
      : {};

  const criteria: Record<SpeakingCriterionKey, CriterionScore> = {
    fluency_coherence: normalizeCriterion(criteriaRaw.fluency_coherence),
    lexical_resource: normalizeCriterion(criteriaRaw.lexical_resource),
    grammatical_range_accuracy: normalizeCriterion(
      criteriaRaw.grammatical_range_accuracy
    ),
    pronunciation: normalizeCriterion(criteriaRaw.pronunciation),
  };

  const overall =
    row.overall_band != null
      ? asBand(row.overall_band)
      : computeOverallBand(criteria);

  return {
    overall_band: overall,
    criteria,
    transcript_with_annotations: row.transcript_with_annotations
      ? String(row.transcript_with_annotations)
      : undefined,
    session_id: sessionId,
    fluency_metrics: fluencyMetrics,
    pronunciation_metrics: pronunciationMetrics,
  };
}

/** Map legacy feedback shape into the v2 schema (compat / migration). */
export function legacyFeedbackToStructuredScore(
  feedback: {
    overallBand?: number;
    criteria?: {
      fluencyCoherence?: number;
      lexicalResource?: number;
      grammaticalRange?: number;
      pronunciation?: number;
    };
    criterionFeedback?: Record<
      string,
      { band?: number; note?: string; evidence?: string }
    >;
  },
  sessionId?: string
): StructuredSpeakingScore {
  const criteria = feedback.criteria ?? {};
  const cf = feedback.criterionFeedback ?? {};

  const criterion = (
    legacyBand: number | undefined,
    feedbackKey: string
  ): CriterionScore => {
    const detail = cf[feedbackKey] ?? {};
    const deductions: ScoreDeduction[] = [];
    if (detail.note || detail.evidence) {
      deductions.push({
        reason: String(detail.note || "Needs improvement"),
        evidence: String(detail.evidence || "See transcript"),
        band_impact: -0.5,
      });
    }
    return {
      band: asBand(detail.band ?? legacyBand ?? feedback.overallBand ?? 0),
      weight: CRITERION_WEIGHT,
      deductions,
    };
  };

  const structuredCriteria = {
    fluency_coherence: criterion(criteria.fluencyCoherence, "fluency"),
    lexical_resource: criterion(criteria.lexicalResource, "lexical"),
    grammatical_range_accuracy: criterion(criteria.grammaticalRange, "grammar"),
    pronunciation: criterion(criteria.pronunciation, "pronunciation"),
  };

  return {
    overall_band: asBand(feedback.overallBand ?? computeOverallBand(structuredCriteria)),
    session_id: sessionId,
    criteria: structuredCriteria,
  };
}

/** Flatten structured score into the legacy feedback fields the UI already uses. */
export function structuredScoreToLegacyFeedback(score: StructuredSpeakingScore) {
  const c = score.criteria;
  return {
    overallBand: score.overall_band,
    criteria: {
      fluencyCoherence: c.fluency_coherence.band,
      lexicalResource: c.lexical_resource.band,
      grammaticalRange: c.grammatical_range_accuracy.band,
      pronunciation: c.pronunciation.band,
    },
    criterionFeedback: {
      fluency: {
        band: c.fluency_coherence.band,
        note: c.fluency_coherence.deductions[0]?.reason || c.fluency_coherence.strengths?.[0] || "",
        evidence: c.fluency_coherence.deductions[0]?.evidence || "",
      },
      lexical: {
        band: c.lexical_resource.band,
        note: c.lexical_resource.deductions[0]?.reason || c.lexical_resource.strengths?.[0] || "",
        evidence: c.lexical_resource.deductions[0]?.evidence || "",
      },
      grammar: {
        band: c.grammatical_range_accuracy.band,
        note:
          c.grammatical_range_accuracy.deductions[0]?.reason ||
          c.grammatical_range_accuracy.strengths?.[0] ||
          "",
        evidence: c.grammatical_range_accuracy.deductions[0]?.evidence || "",
        exampleError: c.grammatical_range_accuracy.deductions[0]?.evidence,
      },
      pronunciation: {
        band: c.pronunciation.band,
        note: c.pronunciation.deductions[0]?.reason || c.pronunciation.strengths?.[0] || "",
        evidence: c.pronunciation.deductions[0]?.evidence || "",
      },
    },
    structuredScore: score,
  };
}
