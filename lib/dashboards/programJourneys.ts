import { STEP_EXAM_MODEL, STEP_SECTIONS } from "@/lib/step/examModel";
import { parseEnrollmentSlugs } from "@/lib/programType";

export type JourneyStep = {
  key: string;
  label: string;
  icon: string;
  hex: string;
  color: string;
};

export type ProgramJourneyId =
  | "ielts_academic"
  | "ielts_general"
  | "toefl"
  | "step"
  | "pathway"
  | "business_english"
  | "legal_english"
  | "kids_english";

export type ProgramJourney = {
  id: ProgramJourneyId;
  title: string;
  caption: string;
  sidebarGroup: string;
  scoreNoun: string;
  targetPrefix: string;
  hasExamDate: boolean;
  steps: JourneyStep[];
  sourceNote?: string;
};

const IELTS_STEPS: JourneyStep[] = [
  { key: "listening", label: "Listening", icon: "🎧", hex: "#0F6E62", color: "var(--listening)" },
  { key: "reading", label: "Reading", icon: "📖", hex: "#3D5A99", color: "var(--reading)" },
  { key: "writing", label: "Writing", icon: "✍️", hex: "#8A5A1A", color: "var(--writing)" },
  { key: "speaking", label: "Speaking", icon: "🗣️", hex: "#B85C48", color: "var(--speaking)" },
];

/**
 * Official TOEFL iBT administration sequence from 21 Jan 2026:
 * Reading → Listening → Writing → Speaking.
 *
 * Primary sources (ETS, not prep sites):
 * - Teacher FAQ: "What will be the test sequence? Test takers will receive the
 *   Reading section first, followed by the Listening section, Writing section
 *   and Speaking section." https://www.ets.org/pdfs/toefl/teacher-faq.pdf
 * - Test Overview PDF (© 2026 ETS): same sentence under Test Structure.
 *   https://www.ets.org/pdfs/toefl/toefl-ibt-test-overview.pdf
 * - Test-taker content table (current): Reading, Listening, Writing, Speaking
 *   https://www.ets.org/toefl/test-takers/ibt/about/content.html
 *
 * Pre-2026 (and some leftover ETS transcripts / third-party sites) used
 * Reading → Listening → Speaking → Writing. Do not use that for the 2026+ LMS.
 * Lists that say "reading, listening, speaking, and writing" are skill names,
 * not test-day order.
 */
const TOEFL_STEPS: JourneyStep[] = [
  { key: "reading", label: "Reading", icon: "📖", hex: "#3D5A99", color: "var(--reading)" },
  { key: "listening", label: "Listening", icon: "🎧", hex: "#0F6E62", color: "var(--listening)" },
  { key: "writing", label: "Writing", icon: "✍️", hex: "#8A5A1A", color: "var(--writing)" },
  { key: "speaking", label: "Speaking", icon: "🗣️", hex: "#B85C48", color: "var(--speaking)" },
];

const STEP_ICONS: Record<string, { icon: string; hex: string; color: string }> = {
  reading: { icon: "📖", hex: "#3D5A99", color: "var(--reading)" },
  structure: { icon: "✏️", hex: "#5B4B8A", color: "var(--structure)" },
  listening: { icon: "🎧", hex: "#0F6E62", color: "var(--listening)" },
  compositional_analysis: { icon: "📋", hex: "#8A5A1A", color: "var(--compositional)" },
};

export const PROGRAM_JOURNEYS: Record<ProgramJourneyId, ProgramJourney> = {
  ielts_academic: {
    id: "ielts_academic",
    title: "Your IELTS journey",
    caption: "In real exam order — Listening → Reading → Writing → Speaking",
    sidebarGroup: "Exam order",
    scoreNoun: "Band",
    targetPrefix: "Band",
    hasExamDate: true,
    steps: IELTS_STEPS,
  },
  ielts_general: {
    id: "ielts_general",
    title: "Your IELTS journey",
    caption: "Same exam order as Academic — Listening → Reading → Writing → Speaking. Content differs; structure does not.",
    sidebarGroup: "Exam order",
    scoreNoun: "Band",
    targetPrefix: "Band",
    hasExamDate: true,
    steps: IELTS_STEPS.map((step) =>
      step.key === "writing" ? { ...step, label: "Writing" } : step
    ),
  },
  toefl: {
    id: "toefl",
    title: "Your TOEFL iBT journey",
    caption: "Official 2026 ETS sequence — Reading → Listening → Writing → Speaking",
    sidebarGroup: "Test order",
    scoreNoun: "Estimate",
    targetPrefix: "Target",
    hasExamDate: true,
    steps: TOEFL_STEPS,
    sourceNote:
      "ETS 2026 test sequence (official FAQ + overview PDF): Reading → Listening → Writing → Speaking. Current ETS scoring is 1–6 per section, with a 0–120 comparable overall during the transition — not the old 0–30 section scale. Estimates here stay honest until TOEFL attempts are stored.",
  },
  step: {
    id: "step",
    title: "Your STEP test journey",
    caption: `Four computer-based MCQ sections — ${STEP_EXAM_MODEL.sectionOrder
      .map((id) => STEP_SECTIONS[id].label)
      .join(" → ")}. Not an IELTS-style speaking/essay paper.`,
    sidebarGroup: "Test sections",
    scoreNoun: "Score",
    targetPrefix: "Target",
    hasExamDate: false,
    steps: STEP_EXAM_MODEL.sectionOrder.map((id) => {
      const spec = STEP_SECTIONS[id];
      const visual = STEP_ICONS[id];
      return {
        key: id,
        label: spec.label,
        icon: visual.icon,
        hex: visual.hex,
        color: visual.color,
      };
    }),
    sourceNote:
      "NCA student guide (19 March 2012) and NCA Third Edition pamphlet: RC 40% / ST 30% / LC 20% / CA 10%, 100 scored MCQs, ~3 hours with trial items. Weights may have been revised. This rail is Speakify study order, not confirmed 2025/2026 test-day order. Candidate login is e-services.etec.gov.sa — not commercial qiyas.sa. Public registration stays closed until a current official notice is on file.",
  },
  pathway: {
    id: "pathway",
    title: "This level's sequence",
    caption: "Vocabulary → Grammar → Reading → Speaking practice for your current CEFR level — not an exam skill order",
    sidebarGroup: "This level",
    scoreNoun: "Progress",
    targetPrefix: "Level",
    hasExamDate: false,
    steps: [
      { key: "vocabulary", label: "Vocabulary", icon: "🔤", hex: "#8A641C", color: "var(--writing)" },
      { key: "grammar", label: "Grammar", icon: "📝", hex: "#5B4B8A", color: "var(--structure)" },
      { key: "reading", label: "Reading", icon: "📖", hex: "#3D5A99", color: "var(--reading)" },
      { key: "speaking", label: "Speaking", icon: "🗣️", hex: "#B85C48", color: "var(--speaking)" },
    ],
  },
  business_english: {
    id: "business_english",
    title: "Your workplace sequence",
    caption: "Curriculum order — Meetings → Presentations → Emails → Negotiation",
    sidebarGroup: "Curriculum",
    scoreNoun: "Progress",
    targetPrefix: "Target",
    hasExamDate: false,
    steps: [
      { key: "meetings", label: "Meetings", icon: "🤝", hex: "#0F6E62", color: "var(--listening)" },
      { key: "presentations", label: "Presentations", icon: "📊", hex: "#3D5A99", color: "var(--reading)" },
      { key: "email", label: "Emails", icon: "✉️", hex: "#8A5A1A", color: "var(--writing)" },
      { key: "negotiation", label: "Negotiation", icon: "💼", hex: "#B85C48", color: "var(--speaking)" },
    ],
  },
  legal_english: {
    id: "legal_english",
    title: "Your legal English sequence",
    caption: "Curriculum order — Contracts → Legal writing → Client meetings → Case analysis",
    sidebarGroup: "Curriculum",
    scoreNoun: "Progress",
    targetPrefix: "Target",
    hasExamDate: false,
    steps: [
      { key: "contracts", label: "Contracts", icon: "📜", hex: "#3D5A99", color: "var(--reading)" },
      { key: "legal-writing", label: "Legal writing", icon: "✍️", hex: "#8A5A1A", color: "var(--writing)" },
      { key: "client-meetings", label: "Client meetings", icon: "🗣️", hex: "#B85C48", color: "var(--speaking)" },
      { key: "case-analysis", label: "Case analysis", icon: "⚖️", hex: "#5B4B8A", color: "var(--structure)" },
    ],
  },
  kids_english: {
    id: "kids_english",
    title: "Your learning path",
    caption: "Unit order — Phonics → Stories → Games → Speaking",
    sidebarGroup: "Units",
    scoreNoun: "Progress",
    targetPrefix: "Level",
    hasExamDate: false,
    steps: [
      { key: "phonics", label: "Phonics", icon: "🔤", hex: "#0F6E62", color: "var(--listening)" },
      { key: "stories", label: "Stories", icon: "📚", hex: "#3D5A99", color: "var(--reading)" },
      { key: "games", label: "Games", icon: "🎮", hex: "#8A5A1A", color: "var(--writing)" },
      { key: "speaking", label: "Speaking", icon: "🗣️", hex: "#B85C48", color: "var(--speaking)" },
    ],
  },
};

export function journeyStepMap(journey: ProgramJourney): Record<string, JourneyStep & { order: number }> {
  return Object.fromEntries(
    journey.steps.map((step, index) => [step.key, { ...step, order: index + 1 }])
  );
}

export function isToeflEnrolment(user?: {
  programType?: string | null;
  programSelected?: string | null;
  enrolledPrograms?: unknown;
} | null): boolean {
  if (!user) return false;
  const selected = String(user.programSelected ?? "").toLowerCase();
  const type = String(user.programType ?? "").toLowerCase();
  if (selected.includes("toefl") || type.includes("toefl")) return true;
  return parseEnrollmentSlugs(user.enrolledPrograms).some((slug) => slug.includes("toefl"));
}
