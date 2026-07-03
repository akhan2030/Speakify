/**
 * IELTS Speaking Module v2 — structured scoring contract.
 * Phase 3+ (UI, adaptive learning, charts) must read from this schema.
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
  error_type?: string;
};

export type CriterionScore = {
  band: number;
  weight: 0.25;
  deductions: ScoreDeduction[];
  strengths?: string[];
};

export type StructuredSpeakingScore = {
  overall_band: number;
  criteria: Record<SpeakingCriterionKey, CriterionScore>;
  transcript_with_annotations?: string;
  session_id?: string;
  fluency_metrics?: FluencyMetrics;
  pronunciation_metrics?: PronunciationMetrics;
};

export type FluencyMetrics = {
  words_per_minute: number;
  pause_count: number;
  average_pause_ms: number;
  filler_word_count: number;
  filler_word_rate: number;
  self_correction_count: number;
  speaking_seconds: number;
};

export type PronunciationMetrics = {
  accuracy_score?: number;
  fluency_score?: number;
  prosody_score?: number;
  estimated: boolean;
  notes?: string;
};

export const CRITERION_WEIGHT = 0.25 as const;

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

/** Map legacy feedback shape into the v2 schema when full pipeline is not ready. */
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
    topImprovements?: Array<{
      category?: string;
      issue?: string;
      studentQuote?: string;
      suggestion?: string;
    }>;
  },
  sessionId?: string
): StructuredSpeakingScore {
  const criteria = feedback.criteria ?? {};
  const cf = feedback.criterionFeedback ?? {};

  const criterion = (
    key: SpeakingCriterionKey,
    legacyBand: number | undefined,
    feedbackKey: string
  ): CriterionScore => {
    const detail = cf[feedbackKey] ?? {};
    const deductions: ScoreDeduction[] = [];
    if (detail.note || detail.evidence) {
      deductions.push({
        reason: String(detail.note || "Needs improvement"),
        evidence: String(detail.evidence || ""),
        band_impact: -0.5,
      });
    }
    return {
      band: Number(detail.band ?? legacyBand ?? feedback.overallBand ?? 0),
      weight: CRITERION_WEIGHT,
      deductions,
    };
  };

  return {
    overall_band: Number(feedback.overallBand ?? 0),
    session_id: sessionId,
    criteria: {
      fluency_coherence: criterion(
        "fluency_coherence",
        criteria.fluencyCoherence,
        "fluency"
      ),
      lexical_resource: criterion(
        "lexical_resource",
        criteria.lexicalResource,
        "lexical"
      ),
      grammatical_range_accuracy: criterion(
        "grammatical_range_accuracy",
        criteria.grammaticalRange,
        "grammar"
      ),
      pronunciation: criterion(
        "pronunciation",
        criteria.pronunciation,
        "pronunciation"
      ),
    },
  };
}
