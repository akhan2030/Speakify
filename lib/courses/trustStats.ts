/**
 * Shared catalog/onboarding lines. Do not put unmeasured success rates here.
 * Percentages in this file were invented as hub “trust signals” (commit f17dab8,
 * 16 Jul 2026) with no query behind them. Keep copy descriptive until a real
 * measured cohort exists.
 */
export const COURSE_TRUST_STATS: Partial<
  Record<
    string,
    {
      /** Compact line for course cards */
      card: string;
      /** Longer line for heroes / onboarding */
      full: string;
    }
  >
> = {
  "ielts-foundation": {
    card: "6-week Academic Foundation",
    full: "IELTS Academic Foundation — format, core grammar, and skill practice toward Band 5.0–5.5 study goals.",
  },
  "ielts-plus": {
    card: "6-week Academic Plus",
    full: "IELTS Academic Plus — the mid-tier accelerator for Band 6.0–6.5 study goals.",
  },
  "ielts-elite": {
    card: "4-week Academic Elite",
    full: "IELTS Academic Elite — intensive practice for Band 7.0+ study goals.",
  },
  "ielts-gt-foundation": {
    card: "GT Foundation track",
    full: "IELTS General Training Foundation — letters, everyday reading, and core skills.",
  },
  "ielts-gt-plus": {
    card: "GT Plus track",
    full: "IELTS General Training Plus — mid-tier GT practice for Band 6.0–6.5 study goals.",
  },
  "ielts-gt-elite": {
    card: "GT Elite track",
    full: "IELTS General Training Elite — intensive GT practice for Band 7.0+ study goals.",
  },
  "step-preparation": {
    card: "Independent STEP prep",
    full: "Speakify STEP Accelerator — independent Qiyas prep on 40/30/20/10 weights. Not affiliated with or certified by Qiyas/ETEC.",
  },
  "english-pathway": {
    card: "13 micro-levels",
    full: "English Pathway — weekly lessons from Absolute Beginner through Advanced. Level-up rates are not published until they are measured.",
  },
};

/** Onboarding/hub line — no unmeasured conversion rate. */
export const HUB_HERO_TRUST =
  "Placement recommends a track from your estimate. Study goals are not official IELTS results.";
