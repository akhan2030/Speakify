/**
 * Sourced STEP blueprint for Speakify (independent research pass + NCA/ETEC public text).
 *
 * High confidence is not a live 2026 candidate bulletin. Speakify is an independent
 * prep product: reopen with a visible disclosure, never as implied-official.
 * Do not treat https://qiyas.sa commercial prep as the government portal.
 * Candidate login: Nafath / قياس on e-services.etec.gov.sa.
 *
 * STEP is not EPT: EPT is a separate Qiyas placement product (80 items, 90 minutes,
 * Structure + Reading + Compositional Analysis, no listening).
 */

export type StepFactConfidence =
  | "high_public"
  | "medium_single_source"
  | "inferred"
  | "speakify_study"
  | "unknown";

export type StepFact = {
  id: string;
  label: string;
  value: string;
  confidence: StepFactConfidence;
  source: string;
  studentFacing: boolean;
};

export const STEP_OFFICIAL_SOURCES = {
  etecLingual: {
    title: "ETEC / Qiyas language tests (STEP)",
    url: "https://etec.gov.sa/en/productsandservices/Qiyas/lingual",
    note: "Government page. Indexed public copy describes STEP as CEFR-based, 100 scored MCQs plus trial items, four-option answers, three-hour allowance including instructions, offered three times per year on paper with more continuous CBT.",
  },
  etecMustaqbalhum: {
    title: "ETEC Mustaqbalhum — Training for STEP",
    url: "https://etec.gov.sa/en/programs/mustaqbalhum",
    note: "Confirms STEP exists as an English proficiency measure.",
  },
  ncaStudentGuide2012: {
    title: "STEP: A Guide for Students — National Center for Assessment in Higher Education",
    dated: "19 March 2012",
    note: "Official NCA publication. Four components and weights. Guide says weights may later change after statistical analysis.",
  },
  ncaThirdEditionPamphlet: {
    title: "STEP — Third Edition (NCA pamphlet)",
    note: "Same four components, 100 questions, ~3 hours including trial items. Listening: candidates see A–D only, not the dialogue or the printed questions.",
  },
  ajelNews: {
    title: "Mainstream Saudi news (Ajel) reporting STEP structure",
    note: "One article corroborates 40/30/20/10, 150 SAR, and up to 10 attempts in three years. A second Ajel article reports 117–133 questions and 2.5–3 hours instead of a flat 100 questions / 3 hours. Same outlet, contradictory totals. Not a government bulletin.",
  },
  etecCandidateLogin: {
    title: "Qiyas candidate e-services (ETEC)",
    url: "https://e-services.etec.gov.sa/Qiyas.TRAS.Web.Internet/",
    note: "Nafath login. Live 2026 seat order and clocks, if published, sit behind authentication.",
  },
} as const;

export const STEP_STUDY_SEQUENCE_NOTE =
  "Speakify study sequence (not confirmed test-day order): Reading → Structure → Listening → Compositional Analysis. Per-section minutes are Speakify pacing. Live STEP seat time is reported as roughly 2.5–3 hours; public sources disagree on the exact figure.";

/** Student-facing totals — ranges, because the best public sources contradict each other. */
export const STEP_PUBLISHED_ITEM_RANGE = "approximately 100–130 scored items";
export const STEP_PUBLISHED_SEAT_RANGE = "roughly 2.5–3 hours";

export const STEP_INDEPENDENT_PREP_DISCLOSURE =
  "Structure based on the most current publicly available Qiyas/ETEC information; not verified against a live official test-day account. Speakify is not affiliated with or certified by Qiyas/ETEC.";

export const STEP_EPT_NOTE =
  "Do not confuse STEP with Qiyas EPT. EPT is a shorter placement test (typically 80 questions / 90 minutes) covering Structure, Reading, and Compositional Analysis with no listening. Speakify STEP always includes listening.";

export const STEP_SOURCE_CHECKLIST: StepFact[] = [
  {
    id: "name",
    label: "Official names",
    value: "Standardized Test of English Proficiency (STEP) / كفايات اللغة الإنجليزية",
    confidence: "high_public",
    source: "ETEC; NCA student guide",
    studentFacing: true,
  },
  {
    id: "administrator",
    label: "Administrator",
    value: "National Center for Assessment (Qiyas) under ETEC",
    confidence: "high_public",
    source: "ETEC; NCA",
    studentFacing: true,
  },
  {
    id: "cefr",
    label: "Framework",
    value: "ETEC describes STEP as based on the Common European Framework of Reference (CEFR). Speakify study scores are not official CEFR certificates.",
    confidence: "high_public",
    source: "ETEC language-tests page",
    studentFacing: true,
  },
  {
    id: "format",
    label: "Item format",
    value:
      "Four-option MCQs (A–D). No speaking. No free essay. ETEC/NCA describe 100 scored items plus unscored trial items; a second Ajel article reports 117–133 questions. Student copy uses approximately 100–130 scored items.",
    confidence: "high_public",
    source: "ETEC; NCA (100 + trial); Ajel (117–133 in a second article)",
    studentFacing: true,
  },
  {
    id: "components",
    label: "Four components and weights",
    value: "Reading Comprehension 40% · Structure/Grammar 30% · Listening Comprehension 20% · Compositional / Written Analysis 10%",
    confidence: "high_public",
    source: "NCA guide + pamphlet; corroborated by Ajel",
    studentFacing: true,
  },
  {
    id: "question_counts",
    label: "Scored items (live exam)",
    value:
      "Public sources disagree: ETEC/NCA 100 scored plus trial items vs Ajel 117–133. Speakify weighted practice papers use 100 items at 40/30/20/10. Student-facing copy: approximately 100–130 scored items.",
    confidence: "unknown",
    source: "ETEC/NCA vs second Ajel article",
    studentFacing: true,
  },
  {
    id: "seat_time",
    label: "Total seat time",
    value:
      "Sources disagree: ETEC/NCA three hours including instructions vs Ajel 2.5–3 hours. Student-facing copy: roughly 2.5–3 hours.",
    confidence: "unknown",
    source: "ETEC/NCA vs second Ajel article",
    studentFacing: true,
  },
  {
    id: "frequency",
    label: "How often it is offered",
    value: "Paper sittings three times per year; computer-based testing available more continuously",
    confidence: "high_public",
    source: "ETEC public page (indexed)",
    studentFacing: true,
  },
  {
    id: "section_minutes",
    label: "Minutes per section",
    value: "Speakify scored-practice clocks 60 / 45 / 30 / 15 (150 minutes). Not published as official section clocks.",
    confidence: "speakify_study",
    source: "Speakify LMS only",
    studentFacing: true,
  },
  {
    id: "section_order",
    label: "Test-day section order",
    value: "Unknown. Sources list categories, not administration sequence.",
    confidence: "unknown",
    source: "No source states seat order",
    studentFacing: true,
  },
  {
    id: "listening_ui",
    label: "Listening presentation",
    value: "Hear the recording once. See A–D only during listening — not the dialogue and not the printed question stem.",
    confidence: "high_public",
    source: "NCA Third Edition pamphlet",
    studentFacing: true,
  },
  {
    id: "scoring_scale",
    label: "Score report legend",
    value: "No universal pass/fail. Institutions set their own cutoffs. A 0–100 report scale is widely cited but not independently confirmed in this pass.",
    confidence: "unknown",
    source: "ETEC purpose language; commercial 0–100 claims not copied as fact",
    studentFacing: true,
  },
  {
    id: "fee",
    label: "Registration fee",
    value: "150 SAR (single news source — confirm on the ETEC payment screen)",
    confidence: "medium_single_source",
    source: "Ajel",
    studentFacing: true,
  },
  {
    id: "attempts",
    label: "Attempt limit",
    value: "Up to 10 attempts within a three-year window (same news source)",
    confidence: "medium_single_source",
    source: "Ajel",
    studentFacing: true,
  },
];

export const STEP_STRUCTURE_CODE_TOUCHPOINTS = [
  "lib/step/officialBlueprint.ts",
  "lib/step/examModel.ts",
  "lib/step/mockExam/constants.ts",
  "lib/step/exitTest/constants.ts",
  "lib/step/miniMock/constants.ts",
  "lib/step/phases.ts",
  "lib/step/prompts.ts",
  "agent/stepQuestionAgent.js",
  "lib/dashboards/programJourneys.ts",
  "components/StepSidebar.tsx",
] as const;

export const STEP_REGISTRATION_POLICY =
  "Open /register/step-test as an independent Speakify prep product with a visible disclosure. Not affiliated with or certified by Qiyas/ETEC. 40/30/20/10 weights remain the structural backbone. Item count and seat time are published as ranges (approximately 100–130 scored items; roughly 2.5–3 hours) because public sources contradict exact totals. Section order and per-section clocks stay Speakify study sequence. This is not a live 2026 candidate notice.";
