/**
 * Sourced STEP blueprint for Speakify.
 *
 * Registration stays closed until a *current* (2025/2026) ETEC/Qiyas candidate
 * notice confirms or revises these figures. This file is the honest map of
 * what public official documents actually say versus what Speakify infers.
 *
 * Do not treat https://qiyas.sa (commercial prep) as the government portal.
 * Current candidate login is Nafath / قياس on e-services.etec.gov.sa.
 */

export type StepFactConfidence = "official_published" | "inferred" | "unknown" | "speakify_study";

export type StepFact = {
  id: string;
  label: string;
  value: string;
  confidence: StepFactConfidence;
  source: string;
  askFor: string;
};

/**
 * Primary public official document we can actually retrieve without a
 * candidate login: NCA “STEP: A Guide for Students”, intro dated 19 March 2012
 * (Dr. Abdulrahman H. al-Shamrani, Department of Language Testing).
 * A shorter “Third Edition” pamphlet from NCA (qiyas.org contact block) repeats
 * the same four components, 100 scored items, and ~3 hour seat time.
 */
export const STEP_OFFICIAL_SOURCES = {
  ncaStudentGuide2012: {
    title: "STEP: A Guide for Students — National Center for Assessment in Higher Education",
    dated: "19 March 2012",
    note: "Official NCA publication. Not a 2025/2026 candidate bulletin. The guide itself says component weights may later change after statistical analysis.",
  },
  ncaThirdEditionPamphlet: {
    title: "STEP Standardized Test of English Proficiency — Third Edition (NCA pamphlet)",
    dated: "undated pamphlet; NCA contact block uses qiyas.org / faq@qiyas.org",
    note: "Same four components, 100 questions, 3 hours including trial items. Listening: test-taker sees options A–D only, not the dialogue or the questions.",
  },
  etecPublic: {
    title: "ETEC / Mustaqbalhum — Training for STEP",
    url: "https://etec.gov.sa/en/programs/mustaqbalhum",
    note: "Confirms STEP exists and measures English proficiency. Does not publish section weights, counts, or seat order on the public page.",
  },
  etecCandidateLogin: {
    title: "Qiyas candidate e-services (ETEC)",
    url: "https://e-services.etec.gov.sa/Qiyas.TRAS.Web.Internet/",
    note: "Nafath / قياس login. Structure details, if any, sit behind authentication. This agent cannot log in.",
  },
} as const;

/** Exact fields to capture from a 2025/2026 official notice or sitting. */
export const STEP_SOURCE_CHECKLIST: StepFact[] = [
  {
    id: "name",
    label: "Official English and Arabic names",
    value: "Standardized Test of English Proficiency (STEP) / كفايات اللغة الإنجليزية",
    confidence: "official_published",
    source: "NCA student guide 2012; ETEC Mustaqbalhum page",
    askFor: "Confirm the live product name on the 2025/2026 registration screen.",
  },
  {
    id: "administrator",
    label: "Administrator",
    value: "National Center for Assessment (Qiyas) under ETEC",
    confidence: "official_published",
    source: "NCA guide; ETEC site; e-services.etec.gov.sa login chrome",
    askFor: "Confirm branding on the current candidate portal.",
  },
  {
    id: "format",
    label: "Item format",
    value: "Four-option multiple choice (A–D); no speaking; no free essay",
    confidence: "official_published",
    source: "NCA student guide 2012 (CA is analysis of writing, not an essay); Third Edition pamphlet listening instructions",
    askFor: "Confirm CBT still has no speaking / no constructed writing.",
  },
  {
    id: "components",
    label: "Four components and published weights",
    value: "RC 40% · ST 30% · LC 20% · CA 10%",
    confidence: "official_published",
    source:
      "NCA student guide 2012 and Third Edition pamphlet. Both say weights may be revised after statistical analysis.",
    askFor: "Current weights on a 2025/2026 ticket, portal, or official PDF — not a prep-site blog.",
  },
  {
    id: "question_counts",
    label: "Scored question counts",
    value: "100 scored items total; 40 / 30 / 20 / 10 inferred from the published percentages",
    confidence: "inferred",
    source: "NCA: “The actual STEP test has 100 questions distributed among the four components.” Percentages → counts if 1 point per item.",
    askFor: "Exact scored items per section on a current form (and whether trial items make the on-screen total > 100).",
  },
  {
    id: "seat_time",
    label: "Total seat time",
    value: "~3 hours including non-scored trial items and instructions",
    confidence: "official_published",
    source: "NCA student guide 2012; Third Edition pamphlet",
    askFor: "Current timed length and whether sections are separately timed.",
  },
  {
    id: "section_minutes",
    label: "Minutes per section",
    value: "Speakify study budgets 60 / 45 / 30 / 15 (150 min scored) — not stated in the NCA guide",
    confidence: "speakify_study",
    source: "Speakify LMS only",
    askFor: "Official per-section clock if the live CBT uses one.",
  },
  {
    id: "section_order",
    label: "Test-day section order",
    value: "Unknown. Speakify study rail uses RC → ST → LC → CA",
    confidence: "unknown",
    source: "NCA lists components as RC, ST, LC, CA in that prose order; that is not a confirmed CBT navigation order",
    askFor: "Screenshot of section sequence on test day or in the candidate instructions.",
  },
  {
    id: "navigation",
    label: "Can you return to a previous section?",
    value: "Unknown for current CBT (Speakify mocks lock sections after submit)",
    confidence: "unknown",
    source: "Speakify product rule, not NCA text",
    askFor: "Whether the live CBT allows review across sections.",
  },
  {
    id: "listening_ui",
    label: "Listening presentation",
    value: "Hear recording once; see A–D only — not the dialogue and not the question stem",
    confidence: "official_published",
    source: "NCA Third Edition pamphlet listening instructions",
    askFor: "Confirm current CBT still hides stems during audio.",
  },
  {
    id: "scoring_scale",
    label: "Score scale / pass-fail / validity",
    value: "Not specified as 0–100 / 3 years in the 2012 guide body we retrieved",
    confidence: "unknown",
    source: "Common on commercial prep pages; not copied here as official",
    askFor: "Score report legend (min/max, validity years, IRT vs percent-correct).",
  },
  {
    id: "fee",
    label: "Registration fee",
    value: "Not taken from an official live fee table in this pass",
    confidence: "unknown",
    source: "Prep sites often say 150 SAR — not used as official here",
    askFor: "Fee on the current ETEC payment screen.",
  },
];

/**
 * Files to edit when a current official source arrives.
 * Keep public marketing closed until these match the new source.
 */
export const STEP_STRUCTURE_CODE_TOUCHPOINTS = [
  "lib/step/officialBlueprint.ts (this file — update facts + confidence)",
  "lib/step/examModel.ts (canonical LMS numbers, labels, order, URLs)",
  "lib/step/mockExam/constants.ts (100-item mock split and minutes)",
  "lib/step/exitTest/constants.ts",
  "lib/step/miniMock/constants.ts (if section mix should follow live weights)",
  "lib/step/phases.ts (copy that mentions 40% / 30%)",
  "lib/step/prompts.ts and agent/stepQuestionAgent.js (generation mix)",
  "lib/dashboards/programJourneys.ts (STEP rail + sourceNote)",
  "components/StepSidebar.tsx (section nav labels)",
  "Public copy only after reopen: lib/courses/catalog.ts, lib/courses/pageContent.ts, lib/registration.ts, Coming soon pages",
] as const;

export const STEP_REGISTRATION_POLICY =
  "Keep /register/step-test and /courses/step-preparation closed until STEP_SOURCE_CHECKLIST items components, question_counts, section_order, and scoring_scale are confidence official_published from a 2025/2026 ETEC/Qiyas notice — not only the 2012 NCA guide.";
