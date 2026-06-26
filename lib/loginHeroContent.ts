import type { LoginProgramContext } from "@/lib/courses/loginPaths";

export type LoginHeroProgramme =
  | "ielts"
  | "pathway"
  | "business_english"
  | "legal_english"
  | "kids_english"
  | "general";

export type LoginHeroContent = {
  eyebrow: string;
  headline: string;
  headlineHighlight: string;
  bullets: [string, string, string];
  footer?: string;
  footerBold?: string;
};

/** Left login hero copy — one entry per programme. Layout/colours are shared in LoginWelcomePanel. */
export const LOGIN_HERO_CONTENT: Record<LoginHeroProgramme, LoginHeroContent> = {
  ielts: {
    eyebrow: "The Speakify way",
    headline: "You do not need more IELTS tricks.",
    headlineHighlight: "You need better English.",
    bullets: [
      "We will show you exactly where you are.",
      "We will show you exactly where you need to be.",
      "We will walk with you every step between those two points.",
    ],
    footer: "When your English is ready —",
    footerBold: "your IELTS score will follow.",
  },
  pathway: {
    eyebrow: "English Pathway",
    headline: "Build real English skills,",
    headlineHighlight: "level by level.",
    bullets: [
      "CEFR-based lessons across reading, writing, listening, and speaking.",
      "Weekly plans that match your current level and goals.",
      "Clear progress from A1 through advanced levels.",
    ],
    footer: "When your foundations are strong —",
    footerBold: "the next level opens naturally.",
  },
  business_english: {
    eyebrow: "Business English",
    headline: "You do not need more jargon.",
    headlineHighlight: "You need clearer communication.",
    bullets: [
      "We will help you lead meetings and presentations with confidence.",
      "We will sharpen your email, report, and negotiation language.",
      "We will practise real workplace scenarios step by step.",
    ],
    footer: "When your professional English is ready —",
    footerBold: "global opportunities follow.",
  },
  legal_english: {
    eyebrow: "Legal English",
    headline: "You do not need more complex words.",
    headlineHighlight: "You need precise legal English.",
    bullets: [
      "We will build your contract, clause, and case-summary vocabulary.",
      "We will strengthen legal writing and document analysis skills.",
      "We will practise client-facing communication in professional contexts.",
    ],
    footer: "When your legal English is precise —",
    footerBold: "your professional credibility grows.",
  },
  kids_english: {
    eyebrow: "Kids English",
    headline: "Learning English should feel like play,",
    headlineHighlight: "not pressure.",
    bullets: [
      "We use stories, songs, and games to make new words stick.",
      "We build speaking confidence one small step at a time.",
      "We celebrate every win so children want to come back tomorrow.",
    ],
    footer: "When learning feels fun —",
    footerBold: "confidence grows every day.",
  },
  general: {
    eyebrow: "Speakify LMS",
    headline: "One platform for every",
    headlineHighlight: "Speakify programme.",
    bullets: [
      "Each course has its own dashboard and learning path.",
      "Sign in to continue exactly where you left off.",
      "Pick your programme and start learning with Speakify.",
    ],
  },
};

export function loginHeroProgrammeFromContext(
  context: LoginProgramContext
): LoginHeroProgramme {
  if (context === "general") return "general";
  return context;
}
