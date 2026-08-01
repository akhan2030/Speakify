import {
  SPECIALTY_PROGRAM_IDS,
  type SpecialtyProgramId,
} from "@/lib/specialtyPrograms";

export { mirrorIeltsStudentDashboardPath } from "@/lib/ieltsStudentRouteMirror";

export type CoreProgramType = "pathway" | "ielts" | "ielts_general" | "classroom" | "step";
export type ProgramType = CoreProgramType | SpecialtyProgramId;

/** Multi-programme students with no resolved dashboard route land here. */
export const PROGRAMME_PICKER_PATH = "/dashboard/home";

const SPECIALTY_SET = new Set<string>(SPECIALTY_PROGRAM_IDS);

export function isSpecialtyProgramType(value: string): value is SpecialtyProgramId {
  return SPECIALTY_SET.has(value);
}

/** Parse enrolled_programs into lowercase slug list (preserves step, etc.). */
export function parseEnrollmentSlugs(value: unknown): string[] {
  const out: string[] = [];

  const add = (raw: string) => {
    const v = raw.trim().toLowerCase().replace(/-/g, "_");
    if (v) out.push(v);
  };

  if (Array.isArray(value)) {
    for (const entry of value) add(String(entry));
  } else if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) add(String(entry));
      } else {
        for (const part of value.split(",")) add(part);
      }
    } catch {
      for (const part of value.split(",")) add(part);
    }
  }

  return out;
}

/**
 * Map a stored programme slug to a known LMS programme type.
 * Returns null for empty, STEP, TOEFL, or any unrecognized slug — never silently "ielts".
 */
export function normalizeProgramType(value: unknown): ProgramType | null {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  if (!v) return null;

  if (v === "pathway" || v === "english_pathway" || v === "english-pathway") {
    return "pathway";
  }
  if (
    v === "classroom" ||
    v === "in_person" ||
    v === "in-person" ||
    v === "textbook"
  ) {
    return "classroom";
  }
  if (v === "ielts_general" || v === "ielts general" || v === "general") {
    return "ielts_general";
  }
  if (v === "business_english" || v === "business") return "business_english";
  if (v === "legal_english" || v === "legal") return "legal_english";
  if (v === "kids_english" || v === "kids") return "kids_english";
  if (v === "ielts") return "ielts";
  if (v === "step" || v === "step_test") return "step";

  if (v === "toefl") {
    return null;
  }

  if (typeof process !== "undefined") {
    console.warn(
      `[programType] unrecognized program slug "${v}" — routing to programme picker`
    );
  }
  return null;
}

export function studentDashboardPath(programType: ProgramType | null): string {
  switch (programType) {
    case "classroom":
      return "/classroom";
    case "pathway":
      return "/dashboard/pathway/student";
    case "ielts_general":
      return "/dashboard/ielts-general/student";
    case "business_english":
      return "/dashboard/business-english/student";
    case "legal_english":
      return "/dashboard/legal-english/student";
    case "kids_english":
      return "/dashboard/kids-english/student";
    case "ielts":
      return "/dashboard/ielts/student";
    case "step":
      return "/dashboard/step/student/diagnostic";
    default:
      return PROGRAMME_PICKER_PATH;
  }
}

export function isIeltsVariantProgram(
  program: ProgramType | null | undefined
): program is "ielts" | "ielts_general" {
  return program === "ielts" || program === "ielts_general";
}

export function dashboardPathForUser(
  role: string | null | undefined,
  programType: ProgramType | null
): string {
  if (role === "teacher") return "/dashboard/teacher";
  return studentDashboardPath(programType);
}

export function isProgramStudentPath(pathname: string): boolean {
  const isClassroomStudentPath =
    (pathname === "/classroom" || pathname.startsWith("/classroom/")) &&
    !pathname.startsWith("/classroom/teacher");
  return (
    isClassroomStudentPath ||
    pathname.startsWith("/dashboard/pathway/student") ||
    pathname.startsWith("/dashboard/ielts/student") ||
    pathname.startsWith("/dashboard/ielts-general/student") ||
    pathname.startsWith("/dashboard/step/student") ||
    pathname.startsWith("/dashboard/business-english/student") ||
    pathname.startsWith("/dashboard/legal-english/student") ||
    pathname.startsWith("/dashboard/kids-english/student")
  );
}

export function isPathwayStudentPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard/pathway/student");
}

/** Resolve the student's primary programme from session fields. */
export function resolveStudentProgramType(input: {
  programType?: unknown;
  enrolledPrograms?: unknown;
  programSelected?: unknown;
}): ProgramType | null {
  const slugs = parseEnrollmentSlugs(input.enrolledPrograms);
  const selected = String(input.programSelected ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  if (selected === "step" || slugs.includes("step")) {
    return "step";
  }

  const enrolled = normalizeEnrolledProgramsForGuard(input.enrolledPrograms);

  if (selected === "ielts_general" && enrolled.includes("ielts_general")) {
    return "ielts_general";
  }
  if (selected === "ielts" && enrolled.includes("ielts")) {
    return "ielts";
  }
  if (enrolled.includes("ielts_general") && !enrolled.includes("ielts")) {
    return "ielts_general";
  }
  if (enrolled.length === 1) return enrolled[0];
  if (enrolled.length > 1) return null;

  // Empty enrollment: never fall back to program_type (DB default is often 'ielts').
  return null;
}

function normalizeEnrolledProgramsForGuard(value: unknown): ProgramType[] {
  const programs = new Set<ProgramType>();
  const add = (raw: string) => {
    const normalized = normalizeProgramType(raw);
    if (normalized) programs.add(normalized);
  };

  if (Array.isArray(value)) {
    for (const entry of value) add(String(entry));
  } else if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) add(String(entry));
      }
    } catch {
      for (const part of value.split(",")) add(part);
    }
  }

  return Array.from(programs);
}

/** Whether a student may open a programme-specific dashboard route. */
export function canAccessStudentDashboard(
  expectedProgram: ProgramType,
  input: {
    programType?: unknown;
    enrolledPrograms?: unknown;
    programSelected?: unknown;
  }
): boolean {
  const resolved = resolveStudentProgramType(input);
  if (!resolved) return false;

  if (isIeltsVariantProgram(expectedProgram) && isIeltsVariantProgram(resolved)) {
    return resolved === expectedProgram;
  }

  const enrolled = normalizeEnrolledProgramsForGuard(input.enrolledPrograms);
  if (enrolled.includes(expectedProgram)) return true;
  return resolved === expectedProgram;
}
