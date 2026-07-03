import OpenAI from "openai";
import type {
  FluencyMetrics,
  PronunciationMetrics,
  StructuredSpeakingScore,
} from "@/lib/speaking/scoringSchema";
import {
  ERROR_TYPE_TAXONOMY,
  normalizeStructuredScore,
} from "@/lib/speaking/scoringSchema";
import { pronunciationMetricsToBandHint } from "@/lib/speaking/pronunciationAssessment";

const STRUCTURED_SCORING_SYSTEM = `You are a senior IELTS Speaking examiner. Score using official band descriptors and the measured metrics provided. Do not invent metrics — use the numbers given.

OFFICIAL BAND DESCRIPTORS (bands 5–9):

FLUENCY & COHERENCE
9: Speaks fluently with only rare repetition/self-correction; coherent, fully appropriate discourse markers.
8: Fluent with only occasional hesitation for content; coherent development.
7: Willing to speak at length; some hesitation/repetition/self-correction; uses a range of connectives.
6: Willing to speak at length but loses coherence at times; uses connectives with some inaccuracy.
5: Usually maintains flow but needs repetition/self-correction; overuses simple connectives; may be hesitant.

LEXICAL RESOURCE
9: Precise, natural, sophisticated vocabulary; idiomatic control.
8: Wide vocabulary, flexible and precise; occasional inaccuracies.
7: Flexible vocabulary for topics; some less common items; awareness of style/collocation with some errors.
6: Adequate vocabulary for topics; attempts paraphrase; some inappropriate choices.
5: Limited flexibility; frequent errors; paraphrase may fail.

GRAMMATICAL RANGE & ACCURACY
9: Full range of structures; rare minor errors.
8: Wide range; majority error-free; occasional inappropriacies.
7: Range of complex structures; frequent error-free sentences; some errors persist.
6: Mix of simple and complex; errors with complex structures; communication rarely impeded.
5: Limited range; simple sentences accurate but complex structures faulty; errors frequent.

PRONUNCIATION
9: Full range of features; effortless intelligibility.
8: Wide range; occasional lapses; easy to understand.
7: Shows all positive features of band 6 and some of band 8.
6: Uses a range of features with mixed control; can be understood throughout though mispronunciation reduces clarity at times.
5: Limited control; mispronunciation frequent; listener needs effort.

FEW-SHOT CALIBRATION (do not copy scores blindly — calibrate judgment):
- Band 5 sample traits: short answers, basic vocab ("good/nice"), tense errors ("I go yesterday"), frequent um/uh, limited development.
- Band 6 sample traits: adequate length, some complex attempts, occasional grammar slips, intelligible pronunciation, some repetition.
- Band 7 sample traits: extended answers, flexible vocab, mostly accurate complex grammar, clear pronunciation, coherent argument.
- Band 8 sample traits: natural fluency, precise lexis, rare errors, sophisticated development.

ERROR TYPES (use when applicable): ${ERROR_TYPE_TAXONOMY.join(", ")}

Return ONLY valid JSON matching this schema exactly:
{
  "overall_band": 6.5,
  "criteria": {
    "fluency_coherence": {
      "band": 6.0,
      "weight": 0.25,
      "deductions": [
        { "reason": "...", "evidence": "quote or metric", "band_impact": -0.5, "error_type": "filler_word_overuse" }
      ],
      "strengths": ["optional"]
    },
    "lexical_resource": { "band": 6.5, "weight": 0.25, "deductions": [], "strengths": [] },
    "grammatical_range_accuracy": { "band": 6.5, "weight": 0.25, "deductions": [], "strengths": [] },
    "pronunciation": { "band": 6.5, "weight": 0.25, "deductions": [], "strengths": [] }
  },
  "transcript_with_annotations": "optional brief annotated notes"
}

Rules:
- Every deduction MUST include reason, evidence (real quote from transcript OR a provided metric), and band_impact.
- overall_band must equal the mean of the four criterion bands, rounded to nearest 0.5.
- Pronunciation: if metrics.estimated is true, label pronunciation notes as estimated and do not invent phoneme-level claims.
- Prefer 0–3 deductions per criterion; strengths optional.
- Be consistent: same evidence should not produce wildly different bands across runs.`;

export async function runStructuredScoring(input: {
  openai: OpenAI;
  sessionId: string;
  studentTranscript: string;
  fluencyMetrics: FluencyMetrics;
  pronunciationMetrics: PronunciationMetrics;
}): Promise<StructuredSpeakingScore> {
  const pronunciationHint = pronunciationMetricsToBandHint(input.pronunciationMetrics);

  const userPayload = {
    transcript: input.studentTranscript,
    fluency_metrics: input.fluencyMetrics,
    pronunciation_metrics: input.pronunciationMetrics,
    pronunciation_band_hint: pronunciationHint,
    instructions:
      "Score this IELTS Speaking performance. Anchor fluency judgments to fluency_metrics (WPM, pauses, fillers). Anchor pronunciation to pronunciation_metrics and the band hint (adjust only with transcript evidence).",
  };

  const response = await input.openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: STRUCTURED_SCORING_SYSTEM },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2800,
    temperature: 0.2,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  return normalizeStructuredScore(
    parsed,
    input.sessionId,
    input.fluencyMetrics,
    input.pronunciationMetrics
  );
}

/** Build legacy-compatible coaching fields from structured score. */
export function structuredToCoachingFields(score: StructuredSpeakingScore) {
  const topImprovements = Object.entries(score.criteria)
    .flatMap(([key, criterion]) =>
      criterion.deductions.map((d) => ({
        category: key,
        issue: d.reason,
        example: d.evidence,
        suggestion: d.reason,
        studentQuote: d.evidence,
        improvedVersion: "",
        error_type: d.error_type,
        band_impact: d.band_impact,
      }))
    )
    .sort((a, b) => Math.abs(b.band_impact) - Math.abs(a.band_impact))
    .slice(0, 5);

  const strengths = Object.values(score.criteria)
    .flatMap((c) => c.strengths || [])
    .slice(0, 5);

  const saudiSpecificErrors = score.criteria.grammatical_range_accuracy.deductions
    .filter((d) =>
      ["article_omission", "past_tense_inconsistency", "subject_verb_agreement"].includes(
        String(d.error_type || "")
      )
    )
    .map((d) => ({
      type: d.error_type || "Grammar",
      example: d.evidence,
      correction: d.reason,
      count: 1,
    }));

  const vocabularyChallenge = score.criteria.lexical_resource.deductions
    .flatMap((d) => d.evidence.split(/[^a-zA-Z]+/))
    .filter((w) => w.length > 4)
    .slice(0, 5);

  return { topImprovements, strengths, saudiSpecificErrors, vocabularyChallenge };
}
