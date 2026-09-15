/**
 * Canonical STEP exam model for Speakify study tools.
 *
 * High-confidence public facts (ETEC + NCA + corroborating news): CEFR-based,
 * 100 scored four-option MCQs plus trial items, ~3 hour seat time, four
 * components at 40 / 30 / 20 / 10, no speaking or free essay.
 *
 * Speakify study conventions (not live test-day fact): section order and
 * 60/45/30/15 minute clocks. Scores here are percent-correct practice, not
 * an official CEFR certificate or a confirmed 0–100 Qiyas legend.
 */

import { SPEAKIFY_COLOR } from "@/lib/brand/tokens";
import {
  STEP_EPT_NOTE,
  STEP_OFFICIAL_SOURCES,
  STEP_REGISTRATION_POLICY,
  STEP_STUDY_SEQUENCE_NOTE,
} from "./officialBlueprint";

export const STEP_EXAM_ID = "step" as const;

export type StepSectionId =
  | "reading"
  | "structure"
  | "listening"
  | "compositional_analysis";

export type StepSection = {
  id: StepSectionId;
  /** Official English label used by Qiyas */
  label: string;
  /** Arabic label on qiyas.sa */
  labelAr: string;
  weightPercent: number;
  questionCount: number;
  /** Approximate minutes; total exam ~150 min for 100 scored questions */
  minutesBudget: number;
  /** Seconds per question guideline */
  secondsPerQuestion: number;
  description: string;
  questionTypes: string[];
  skills: string[];
  strategies: string[];
};

export type StepExamModel = {
  id: typeof STEP_EXAM_ID;
  fullName: string;
  acronym: string;
  administrator: string;
  administratorAr: string;
  website: string;
  sourceDocument: string;
  registrationPolicy: string;
  studySequenceNote: string;
  eptNote: string;
  cefrBased: true;
  totalQuestions: number;
  /** Official published seat time including instructions and trial items */
  totalSeatMinutes: number;
  /** Speakify scored-practice clock (not an official per-section sum) */
  totalMinutes: number;
  secondsPerQuestionAvg: number;
  format: "computer_based";
  deliveryRules: string[];
  scoring: {
    scaleMin: number;
    scaleMax: number;
    passFail: false;
    validityYears: number;
    scoringMethod: string;
    typicalUniversityMinimum: number;
    excellenceTarget: number;
  };
  registration: {
    feeSar: number;
    channels: string[];
  };
  sections: StepSection[];
  /** Speakify study rail — not confirmed CBT navigation order */
  sectionOrder: StepSectionId[];
  excludedSkills: string[];
  preparationTips: string[];
  commonMistakes: string[];
  researchUrls: string[];
};

export const STEP_SECTIONS: Record<StepSectionId, StepSection> = {
  reading: {
    id: "reading",
    label: "Reading Comprehension",
    labelAr: "فهم المقروء",
    weightPercent: 40,
    questionCount: 40,
    minutesBudget: 60, // Speakify study clock — not official
    secondsPerQuestion: 90,
    description:
      "Long and short passages on educational and social topics. Tests direct comprehension, inference, vocabulary-in-context, task-based reading, and critical evaluation.",
    questionTypes: [
      "word_meaning_in_context",
      "reading_to_perform_a_task",
      "general_understanding",
      "developing_an_interpretation",
      "examining_content",
      "main_idea_or_title",
    ],
    skills: [
      "Skimming and scanning",
      "Inference from context",
      "Identifying topic and main idea",
      "Cause and effect sequencing",
      "Fact vs opinion",
      "Table of contents / schedule / map tasks",
    ],
    strategies: [
      "Read questions before the passage to know what to look for",
      "Questions follow paragraph order — use them as a scan guide",
      "Bold words in passages usually have a dedicated vocabulary question",
      "Title and main-idea questions are always last for each passage",
      "Do not read the entire passage first — skim and scan strategically",
    ],
  },
  structure: {
    id: "structure",
    label: "Structure",
    labelAr: "التراكيب النحوية",
    weightPercent: 30,
    questionCount: 30,
    minutesBudget: 45, // Speakify study clock — not official
    secondsPerQuestion: 40,
    description:
      "Multiple-choice grammar items. Choose the grammatically correct completion or response. Distractors may look plausible but break grammar or meaning.",
    questionTypes: [
      "sentence_completion",
      "dialogue_response",
      "two_blank_completion",
      "subject_verb_agreement",
      "tense_selection",
      "articles_and_determiners",
      "prepositions",
      "comparatives_superlatives",
      "modals_and_conditionals",
      "passive_active_voice",
      "reported_speech",
      "gerunds_infinitives",
      "relative_clauses",
    ],
    skills: [
      "Verb tenses (simple, perfect, continuous, irregular forms)",
      "Subject–verb agreement",
      "Articles (a/an/the)",
      "Prepositions and phrasal patterns",
      "Modals and conditionals",
      "Passive vs active voice",
      "Reported speech",
      "Count vs non-count nouns",
      "Comparatives and superlatives",
    ],
    strategies: [
      "Grammar items should take no more than ~40 seconds each",
      "For two-blank items, both blanks must be correct — eliminate partial matches",
      "When two answers seem correct, choose the best shade of meaning",
      "Review tenses and prepositions — highest frequency on STEP",
    ],
  },
  listening: {
    id: "listening",
    label: "Listening Comprehension",
    labelAr: "الاستماع",
    weightPercent: 20,
    questionCount: 20,
    minutesBudget: 30, // Speakify study clock — not official
    secondsPerQuestion: 90,
    description:
      "Short and longer dialogues played once only. Questions appear after each recording. Test-takers see answer choices only — not the transcript or printed questions during the live exam.",
    questionTypes: [
      "short_dialogue_detail",
      "long_dialogue_detail",
      "numbers_dates_places",
      "idiomatic_expression_meaning",
      "speaker_intent",
      "inference_from_conversation",
    ],
    skills: [
      "Catching numbers, dates, and amounts",
      "Understanding idioms and informal speech",
      "Note-taking under time pressure",
      "Distinguishing similar-sounding numbers (13/30, 14/40)",
      "Following service / academic / everyday conversations",
    ],
    strategies: [
      "Each dialogue and question is heard only once — answer as you go",
      "Read answer choices before audio when preview is available",
      "Take brief notes — do not write so much that you miss audio",
      "Use headphones; do not rely on speakers during practice",
      "Longer dialogues correlate with more questions per recording",
    ],
  },
  compositional_analysis: {
    id: "compositional_analysis",
    label: "Compositional Analysis",
    labelAr: "التحليل الكتابي والمفردات",
    weightPercent: 10,
    questionCount: 10,
    minutesBudget: 15, // Speakify study clock — not official
    secondsPerQuestion: 90,
    description:
      "Written-form analysis: punctuation, capitalization, word order, sentence combining, paragraph logic, and identifying incorrect underlined words. No free writing or speaking.",
    questionTypes: [
      "correct_word_order",
      "punctuation_accuracy",
      "identify_incorrect_underlined",
      "sentence_combining",
      "signal_word_logic",
      "capitalization",
      "odd_word_out",
      "synonym_precision",
    ],
    skills: [
      "Punctuation (commas, colons, semicolons)",
      "Capitalization rules",
      "Sentence combining with conjunctions",
      "Signal words (however, because, although, as a result)",
      "Parallel structure",
      "Identifying ungrammatical underlined segments",
    ],
    strategies: [
      "Signal words reveal contrast, cause-effect, or sequence — match the connector to logic",
      "For 'find the incorrect word' items, read the full sentence before deciding",
      "For sentence-combining, test cause-effect vs time-order relationships",
    ],
  },
};

export const STEP_EXAM_MODEL: StepExamModel = {
  id: STEP_EXAM_ID,
  fullName: "Standardized Test of English Proficiency",
  acronym: "STEP",
  administrator: "National Center for Assessment (Qiyas) — ETEC",
  administratorAr: "المركز الوطني للقياس — هيئة تقويم التعليم والتدريب",
  website: STEP_OFFICIAL_SOURCES.etecCandidateLogin.url,
  sourceDocument:
    "ETEC public STEP description + NCA student guide (2012) / Third Edition pamphlet; 40/30/20/10 corroborated by Ajel. Not a 2026 candidate bulletin.",
  registrationPolicy: STEP_REGISTRATION_POLICY,
  studySequenceNote: STEP_STUDY_SEQUENCE_NOTE,
  eptNote: STEP_EPT_NOTE,
  cefrBased: true,
  totalQuestions: 100,
  totalSeatMinutes: 180,
  totalMinutes: 150,
  secondsPerQuestionAvg: 90,
  format: "computer_based",
  deliveryRules: [
    "ETEC: CEFR-based English proficiency test; 100 scored four-option MCQs plus unscored trial items",
    "ETEC: three-hour allowance including pre-test instructions; paper sittings three times per year, CBT more continuous",
    "No speaking section and no free-essay writing — Compositional Analysis is MCQ analysis of written form",
    "Listening: recording once; live candidates see A–D only, not the dialogue or printed stems (NCA pamphlet)",
    STEP_STUDY_SEQUENCE_NOTE,
    STEP_EPT_NOTE,
    "Speakify mocks lock a section after submit — live CBT return-to-previous-section is unconfirmed",
    "Dictionary and external aids are not permitted in Speakify timed practice",
  ],
  scoring: {
    scaleMin: 0,
    scaleMax: 100,
    passFail: false,
    validityYears: 0,
    scoringMethod:
      "Institutions set their own cutoffs; there is no universal pass mark. Speakify numbers are percent-correct on practice items, not a confirmed Qiyas 0–100 legend, IRT model, or official CEFR rating.",
    typicalUniversityMinimum: 0,
    excellenceTarget: 80,
  },
  registration: {
    feeSar: 150,
    channels: [
      "ETEC / Qiyas candidate e-services (Nafath)",
      "Fee 150 SAR and 10-attempt / 3-year limit: medium confidence (Ajel) — confirm on the live payment screen",
    ],
  },
  sections: Object.values(STEP_SECTIONS),
  sectionOrder: ["reading", "structure", "listening", "compositional_analysis"],
  excludedSkills: ["speaking", "free_writing"],
  preparationTips: [
    "Take at least 3 full timed practice tests before the real exam",
    "Simulate exam conditions: quiet room, headphones, no pausing the timer",
    "Focus on tenses, prepositions, and subject–verb agreement for Structure",
    "Practice skimming and scanning — do not read passages fully on first pass",
    "Train your ear for fast dialogues with numbers and idioms",
    "Review wrong answers for the grammar rule behind each item",
    "Do not memorise question wording — Qiyas changes phrasing",
    "Get adequate sleep before test day",
  ],
  commonMistakes: [
    "Reading the full passage before looking at questions",
    "Neglecting listening practice while over-focusing on grammar",
    "Spending more than 2 minutes on a single question",
    "Leaving listening questions unanswered — no penalty for guessing",
    "Using speakers instead of headphones during practice",
  ],
  researchUrls: [
    STEP_OFFICIAL_SOURCES.etecLingual.url,
    STEP_OFFICIAL_SOURCES.etecMustaqbalhum.url,
    STEP_OFFICIAL_SOURCES.etecCandidateLogin.url,
  ],
};

/** Question counts per section — use when building mock tests */
export function getStepSectionQuestionCounts(): Record<StepSectionId, number> {
  return Object.fromEntries(
    STEP_EXAM_MODEL.sections.map((s) => [s.id, s.questionCount])
  ) as Record<StepSectionId, number>;
}

/** Minutes budget per section */
export function getStepSectionTimeBudgets(): Record<StepSectionId, number> {
  return Object.fromEntries(
    STEP_EXAM_MODEL.sections.map((s) => [s.id, s.minutesBudget])
  ) as Record<StepSectionId, number>;
}

/** Map Speakify practice percent to an internal readiness band — not a university cutoff. */
export function stepScoreBand(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      label: "Excellence",
      color: "#059669",
      description: "Speakify Phase 4 target — keep full mocks under timed conditions",
    };
  }
  if (score >= 70) {
    return {
      label: "Strong",
      color: "#2563eb",
      description: "Solid practice level — push weak sections toward the 80 study target",
    };
  }
  if (score >= 65) {
    return {
      label: "Competitive",
      color: SPEAKIFY_COLOR.gold,
      description: "Speakify Phase 2 exit band — not a universal university cutoff",
    };
  }
  if (score >= 50) {
    return {
      label: "Developing",
      color: "#ea580c",
      description: "Foundation grammar and reading strategies still need timed reps",
    };
  }
  return {
    label: "Foundation",
    color: "#dc2626",
    description: "Build core grammar, vocabulary, and one-play listening habits",
  };
}
