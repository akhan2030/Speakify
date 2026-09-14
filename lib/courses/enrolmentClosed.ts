export type ComingSoonCopy = {
  title: string;
  body: string;
  registerError: string;
};

const TOEFL: ComingSoonCopy = {
  title: "TOEFL Accelerator",
  body:
    "Speakify TOEFL is in preparation. Registration is closed so students are not enrolled on the IELTS Academic programme by mistake.",
  registerError: "TOEFL registration is coming soon.",
};

const PATHWAY: ComingSoonCopy = {
  title: "English Pathway",
  body:
    "Speakify General English (CEFR Pathway) is in preparation. Registration is closed so students are not enrolled on the IELTS Academic programme by mistake.",
  registerError: "English Pathway registration is coming soon.",
};

const BUSINESS: ComingSoonCopy = {
  title: "Business English",
  body:
    "Speakify Business English is in preparation. Registration is closed so students are not enrolled on the IELTS Academic programme by mistake.",
  registerError: "Business English registration is coming soon.",
};

const LEGAL: ComingSoonCopy = {
  title: "Legal English",
  body:
    "Speakify Legal English is in preparation. Registration is closed so students are not enrolled on the IELTS Academic programme by mistake.",
  registerError: "Legal English registration is coming soon.",
};

const KIDS: ComingSoonCopy = {
  title: "Kids English",
  body:
    "Speakify Kids English is in preparation. Registration is closed so students are not enrolled on the IELTS Academic programme by mistake.",
  registerError: "Kids English registration is coming soon.",
};

function norm(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

/** Course hub / detail slugs that must not open a working enrolment CTA. */
export const COMING_SOON_COURSE_SLUGS = [
  "toefl-accelerator",
  "english-pathway",
  "business-english",
  "legal-english",
  "kids-english",
] as const;

export function comingSoonForCourseSlug(slug: string): ComingSoonCopy | null {
  switch (norm(slug)) {
    case "toefl-accelerator":
    case "toefl":
      return TOEFL;
    case "english-pathway":
    case "pathway":
      return PATHWAY;
    case "business-english":
      return BUSINESS;
    case "legal-english":
      return LEGAL;
    case "kids-english":
      return KIDS;
    default:
      return null;
  }
}

/**
 * Block crafted POSTs the same way as TOEFL: after field validation, before
 * creating a user. Matches registration slugs, course slugs, and programType.
 */
export function comingSoonRegisterError(
  registrationSlug: string,
  courseSlug: string,
  programType?: string
): string | null {
  const keys = [registrationSlug, courseSlug, programType ?? ""].map(norm);
  for (const key of keys) {
    if (
      key === "toefl" ||
      key === "toefl-prep" ||
      key === "toefl-accelerator" ||
      key.startsWith("toefl")
    ) {
      return TOEFL.registerError;
    }
    if (key === "pathway" || key === "english-pathway" || key === "englishpathway") {
      return PATHWAY.registerError;
    }
    if (key === "business-english" || key === "businessenglish") {
      return BUSINESS.registerError;
    }
    if (key === "legal-english" || key === "legalenglish") {
      return LEGAL.registerError;
    }
    if (key === "kids-english" || key === "kidsenglish") {
      return KIDS.registerError;
    }
  }
  return null;
}
