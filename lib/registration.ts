export const PROGRAM_TYPES = ["pathway", "ielts"] as const;
export type RegistrationProgramType = (typeof PROGRAM_TYPES)[number];

/** Public registration URLs — one dedicated link per program on the website */
export const REGISTRATION_SLUGS = ["pathway", "ielts", "toefl"] as const;
export type RegistrationSlug = (typeof REGISTRATION_SLUGS)[number];

export type RegistrationProgramConfig = {
  slug: RegistrationSlug;
  /** Stored in users.program_type */
  programType: RegistrationProgramType;
  label: string;
  tagline: string;
  description: string;
  bullets: string[];
  accent: string;
  registerPath: string;
};

export const REGISTRATION_PROGRAMS: Record<RegistrationSlug, RegistrationProgramConfig> = {
  pathway: {
    slug: "pathway",
    programType: "pathway",
    label: "English Pathway",
    tagline: "General English · CEFR levels",
    description:
      "Structured CEFR course from A1 to B2 with lessons, vocabulary, and level assessments.",
    bullets: [
      "CEFR level progression (A1 → B2)",
      "Weekly grammar & vocabulary focus",
      "Speaking, reading, listening & writing practice",
    ],
    accent: "#0d9488",
    registerPath: "/register/pathway",
  },
  ielts: {
    slug: "ielts",
    programType: "ielts",
    label: "IELTS Accelerator",
    tagline: "IELTS Academic · Band scores",
    description:
      "Full IELTS preparation with mock exams, band tracking, and AI-powered feedback.",
    bullets: [
      "Full Academic IELTS mock exams",
      "AI-powered speaking & writing feedback",
      "Detailed band prediction report",
    ],
    accent: "#c9972c",
    registerPath: "/register/ielts-accelerator",
  },
  toefl: {
    slug: "toefl",
    programType: "ielts",
    label: "TOEFL Preparation",
    tagline: "TOEFL iBT · Test prep",
    description:
      "TOEFL preparation with practice tests, skill tracking, and personalised study plans.",
    bullets: [
      "Reading, listening, speaking & writing practice",
      "Timed practice tests",
      "Progress tracking toward your target score",
    ],
    accent: "#2563eb",
    registerPath: "/register/toefl-prep",
  },
};

export function getRegistrationProgram(slug: string): RegistrationProgramConfig {
  const key = slug.toLowerCase() as RegistrationSlug;
  return REGISTRATION_PROGRAMS[key] ?? REGISTRATION_PROGRAMS.pathway;
}

export function isRegistrationSlug(value: string): value is RegistrationSlug {
  return REGISTRATION_SLUGS.includes(value as RegistrationSlug);
}

/** @deprecated Use REGISTRATION_PROGRAMS */
export const PROGRAM_OPTIONS = Object.values(REGISTRATION_PROGRAMS).filter(
  (p) => p.slug !== "toefl"
).map((p) => ({
  id: p.programType,
  label: p.label,
  tagline: p.tagline,
  description: p.description,
  bullets: p.bullets,
  accent: p.accent,
}));

export const ENGLISH_LEVELS = [
  "Beginner",
  "Elementary",
  "Pre-Intermediate",
  "Intermediate",
  "Upper-Intermediate",
  "Advanced",
] as const;

export const TARGET_BANDS = [
  "5.0",
  "5.5",
  "6.0",
  "6.5",
  "7.0",
  "7.5",
  "8.0+",
] as const;

export const STUDY_REASONS = [
  "University Admission",
  "Job Promotion",
  "Immigration",
  "Personal Growth",
  "Other",
] as const;

const ENGLISH_TO_CEFR: Record<(typeof ENGLISH_LEVELS)[number], string> = {
  Beginner: "A1.1",
  Elementary: "A2.1",
  "Pre-Intermediate": "B1.1",
  Intermediate: "B1.2",
  "Upper-Intermediate": "B2.1",
  Advanced: "C1.1",
};

export function englishLevelToCefr(level: string): string {
  return ENGLISH_TO_CEFR[level as (typeof ENGLISH_LEVELS)[number]] ?? "B1.1";
}

export type RegistrationPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  programType: RegistrationProgramType;
  englishLevel?: string;
  targetBand?: string;
  studyReason?: string;
  termsAccepted: boolean;
};

export function validateRegistration(
  body: Partial<RegistrationPayload> & { confirmPassword?: string }
): { ok: true; data: RegistrationPayload } | { ok: false; error: string } {
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const password = String(body.password ?? "");
  const confirmPassword = String(body.confirmPassword ?? "");
  const programTypeRaw = String(body.programType ?? "").trim().toLowerCase();
  const englishLevel = String(body.englishLevel ?? "").trim();
  const targetBand = String(body.targetBand ?? "").trim();
  const studyReason = String(body.studyReason ?? "").trim();
  const termsAccepted = Boolean(body.termsAccepted);

  if (!fullName || fullName.length < 2) {
    return { ok: false, error: "Please enter your full name." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!phone || phone.replace(/\D/g, "").length < 8) {
    return { ok: false, error: "Please enter a valid phone number." };
  }
  if (!password || password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }
  if (
    !programTypeRaw ||
    !PROGRAM_TYPES.includes(programTypeRaw as RegistrationProgramType)
  ) {
    return { ok: false, error: "Please choose a valid registration program." };
  }
  const programType = programTypeRaw as RegistrationProgramType;
  if (
    englishLevel &&
    !ENGLISH_LEVELS.includes(englishLevel as (typeof ENGLISH_LEVELS)[number])
  ) {
    return { ok: false, error: "Please select a valid English level." };
  }
  if (
    targetBand &&
    !TARGET_BANDS.includes(targetBand as (typeof TARGET_BANDS)[number])
  ) {
    return { ok: false, error: "Please select a valid IELTS target band." };
  }
  if (
    studyReason &&
    !STUDY_REASONS.includes(studyReason as (typeof STUDY_REASONS)[number])
  ) {
    return { ok: false, error: "Please select a valid study reason." };
  }
  if (!termsAccepted) {
    return {
      ok: false,
      error: "You must agree to the Terms and Privacy Policy.",
    };
  }

  return {
    ok: true,
    data: {
      fullName,
      email,
      phone,
      password,
      programType,
      englishLevel: englishLevel || undefined,
      targetBand: targetBand || undefined,
      studyReason: studyReason || undefined,
      termsAccepted,
    },
  };
}
