import type { GatewayProgramme } from "@/lib/onboarding/types";

export type OnboardingProgrammeOption = {
  id: GatewayProgramme;
  icon: string;
  title: string;
  subtitle: string;
  assessmentLabel: string;
};

/** All Speakify programmes shown on onboarding Step 1. */
export const ONBOARDING_PROGRAMME_OPTIONS: OnboardingProgrammeOption[] = [
  {
    id: "ielts",
    icon: "🎯",
    title: "IELTS Academic",
    subtitle: "Academic band preparation",
    assessmentLabel: "IELTS band placement test",
  },
  {
    id: "ielts_general",
    icon: "✉️",
    title: "IELTS General",
    subtitle: "General training band preparation",
    assessmentLabel: "IELTS General band placement test",
  },
  {
    id: "toefl",
    icon: "🎓",
    title: "TOEFL",
    subtitle: "University admission test",
    assessmentLabel: "TOEFL readiness diagnostic",
  },
  {
    id: "step",
    icon: "🏛",
    title: "STEP",
    subtitle: "Qiyas university test",
    assessmentLabel: "STEP readiness diagnostic",
  },
  {
    id: "pathway",
    icon: "📚",
    title: "English Pathway",
    subtitle: "CEFR pathway levels (A1–C2)",
    assessmentLabel: "CEFR level placement test",
  },
  {
    id: "business_english",
    icon: "💼",
    title: "Business English",
    subtitle: "Professional communication",
    assessmentLabel: "Business English diagnostic",
  },
  {
    id: "legal_english",
    icon: "⚖️",
    title: "Legal English",
    subtitle: "Legal and professional language",
    assessmentLabel: "Legal English diagnostic",
  },
  {
    id: "kids_english",
    icon: "🌟",
    title: "Kids English",
    subtitle: "English for young learners",
    assessmentLabel: "Age-appropriate placement check",
  },
];

export const GATEWAY_PROGRAMME_IDS: GatewayProgramme[] = ONBOARDING_PROGRAMME_OPTIONS.map(
  (p) => p.id
);

export function placementAssessmentTitle(programme: GatewayProgramme): string {
  const meta = ONBOARDING_PROGRAMME_OPTIONS.find((p) => p.id === programme);
  if (!meta) return "Quick Level Check — 15 questions";
  return `${meta.assessmentLabel} — 15 questions`;
}

export function enrolledProgramsForGateway(programme: GatewayProgramme): string[] {
  switch (programme) {
    case "ielts":
      return ["ielts"];
    case "ielts_general":
      return ["ielts_general"];
    case "toefl":
      return ["toefl"];
    case "step":
      return ["step"];
    case "pathway":
      return ["pathway"];
    case "business_english":
      return ["business_english"];
    case "legal_english":
      return ["legal_english"];
    case "kids_english":
      return ["kids_english"];
    default:
      return ["ielts"];
  }
}

export function programTypeForGateway(programme: GatewayProgramme): string {
  switch (programme) {
    case "pathway":
      return "pathway";
    case "business_english":
      return "business_english";
    case "legal_english":
      return "legal_english";
    case "kids_english":
      return "kids_english";
    case "step":
    case "ielts":
    case "ielts_general":
    case "toefl":
    default:
      return "ielts";
  }
}
