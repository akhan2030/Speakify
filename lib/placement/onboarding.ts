export type PlacementIeltsModule = "academic" | "general_training";

export type PlacementOnboarding = {
  fullName: string;
  email: string;
  phone: string;
  educationLevel: string;
  fieldOfStudy: string;
  /** Academic (charts/graphs) vs General Training (letters). */
  ieltsModule: PlacementIeltsModule;
  ieltsPurpose: string;
  targetBandScore: string;
  scoreDeadline: string;
};

export const EDUCATION_LEVELS = [
  "High School Student",
  "High School Graduate",
  "Diploma Holder",
  "Bachelor's Degree",
  "Master's Degree or Above",
] as const;

export const IELTS_PURPOSES = [
  "University Admission (Saudi or Abroad)",
  "Job Promotion",
  "Immigration",
  "Professional License (Medical/Engineering)",
  "Personal Growth",
  "Other",
] as const;

export const TARGET_BAND_OPTIONS = [
  "5.0",
  "5.5",
  "6.0",
  "6.5",
  "7.0",
  "7.5",
  "8.0+",
] as const;

export const DEADLINE_OPTIONS = [
  { value: "1_month", label: "Within 1 month" },
  { value: "2_3_months", label: "2–3 months" },
  { value: "6_months", label: "6 months" },
  { value: "no_deadline", label: "No deadline" },
  { value: "custom_date", label: "Specific date" },
] as const;

export const IELTS_MODULE_OPTIONS = [
  { value: "academic" as const, label: "IELTS Academic", hint: "University — graphs, charts & essays" },
  {
    value: "general_training" as const,
    label: "IELTS General Training",
    hint: "Migration, work & residency — letters & essays",
  },
];

export const EMPTY_ONBOARDING: PlacementOnboarding = {
  fullName: "",
  email: "",
  phone: "",
  educationLevel: "",
  fieldOfStudy: "",
  ieltsModule: "academic",
  ieltsPurpose: "",
  targetBandScore: "",
  scoreDeadline: "",
};

export function parseTargetBandNumeric(value: string): number | null {
  const cleaned = value.replace("+", "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function onboardingToDbRow(onboarding: PlacementOnboarding) {
  return {
    full_name: onboarding.fullName.trim(),
    email: onboarding.email.trim().toLowerCase(),
    phone: onboarding.phone.trim() || null,
    education_level: onboarding.educationLevel || null,
    field_of_study: onboarding.fieldOfStudy.trim() || null,
    ielts_purpose: onboarding.ieltsPurpose || null,
    target_band_score: parseTargetBandNumeric(onboarding.targetBandScore),
    score_deadline: onboarding.scoreDeadline.trim() || null,
  };
}

export function validateOnboardingStep1(o: PlacementOnboarding): string | null {
  if (!o.fullName.trim()) return "Full name is required.";
  if (!o.email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email.trim())) {
    return "Enter a valid email address.";
  }
  if (!o.educationLevel) return "Select your education level.";
  if (!o.fieldOfStudy.trim()) return "Field of study is required.";
  return null;
}

export function validateOnboardingStep2(o: PlacementOnboarding): string | null {
  if (!o.ieltsModule) return "Select whether you are preparing for Academic or General Training.";
  if (!o.ieltsPurpose) return "Select your IELTS purpose.";
  if (!o.targetBandScore) return "Select your required band score.";
  if (!o.scoreDeadline) return "Select a deadline.";
  const isDate =
    /^\d{4}-\d{2}-\d{2}$/.test(o.scoreDeadline) ||
    o.scoreDeadline.includes("T");
  if (o.scoreDeadline === "custom_date") return "Choose a target date.";
  if (
    ["1_month", "2_3_months", "6_months", "no_deadline"].includes(
      o.scoreDeadline
    )
  ) {
    return null;
  }
  if (!isDate) return "Choose a valid deadline.";
  return null;
}
