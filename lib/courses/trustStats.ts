/**
 * Shared social-proof copy for course hub + onboarding.
 * Keep short card lines here; onboarding may use longer variants.
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
    card: "92% reach Band 5.5+",
    full: "92% of students at your level who complete IELTS Foundation reach Band 5.5 or above.",
  },
  "ielts-plus": {
    card: "94% reach Band 6.0+",
    full: "94% of students at your level who complete IELTS Plus reach Band 6.0 or above.",
  },
  "ielts-elite": {
    card: "91% reach Band 7.0+",
    full: "91% of students at your level who complete IELTS Elite reach Band 7.0 or above.",
  },
  "ielts-gt-foundation": {
    card: "92% reach Band 5.5+",
    full: "92% of GT students who complete Foundation reach Band 5.5 or above.",
  },
  "ielts-gt-plus": {
    card: "94% reach Band 6.0+",
    full: "94% of GT students who complete Plus reach Band 6.0 or above.",
  },
  "ielts-gt-elite": {
    card: "91% reach Band 7.0+",
    full: "91% of GT students who complete Elite reach Band 7.0 or above.",
  },
  "step-preparation": {
    card: "Enrolment closed",
    full: "Public STEP registration is closed while we finish a sourced Qiyas/ETEC course. Existing students can still sign in.",
  },
  "english-pathway": {
    card: "87% advance a Pathway level",
    full: "87% of Pathway learners advance at least one Speakify Pathway level within a term.",
  },
};

/** Hub hero trust line (matches onboarding Plus social proof). */
export const HUB_HERO_TRUST =
  "94% of students at your level who complete IELTS Plus reach Band 6.0 or above.";
