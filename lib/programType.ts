import {
  SPECIALTY_PROGRAM_IDS,
  type SpecialtyProgramId,
} from "@/lib/specialtyPrograms";

export type CoreProgramType = "pathway" | "ielts" | "ielts_general";
export type ProgramType = CoreProgramType | SpecialtyProgramId;

const SPECIALTY_SET = new Set<string>(SPECIALTY_PROGRAM_IDS);

export function isSpecialtyProgramType(value: string): value is SpecialtyProgramId {
  return SPECIALTY_SET.has(value);
}

export function normalizeProgramType(value: unknown): ProgramType {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  if (v === "pathway" || v === "english_pathway" || v === "english-pathway") {
    return "pathway";
  }
  if (v === "ielts_general" || v === "ielts general" || v === "general") {
    return "ielts_general";
  }
  if (v === "business_english" || v === "business") return "business_english";
  if (v === "legal_english" || v === "legal") return "legal_english";
  if (v === "kids_english" || v === "kids") return "kids_english";
  if (v === "ielts" || v === "toefl" || v === "step") return "ielts";
  return "ielts";
}

export function studentDashboardPath(programType: ProgramType): string {
  switch (programType) {
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
    default:
      return "/dashboard/ielts/student";
  }
}

const ACADEMIC_STUDENT_PREFIX = "/dashboard/ielts/student";
const GT_STUDENT_PREFIX = "/dashboard/ielts-general/student";

export function isIeltsVariantProgram(
  program: ProgramType
): program is "ielts" | "ielts_general" {
  return program === "ielts" || program === "ielts_general";
}

/** Map an Academic student URL to GT (or the reverse) when programmes are mismatched. */
export function mirrorIeltsStudentDashboardPath(
  pathname: string,
  targetProgram: "ielts" | "ielts_general"
): string {
  if (
    targetProgram === "ielts_general" &&
    pathname.startsWith(ACADEMIC_STUDENT_PREFIX)
  ) {
    return pathname.replace(ACADEMIC_STUDENT_PREFIX, GT_STUDENT_PREFIX);
  }
  if (targetProgram === "ielts" && pathname.startsWith(GT_STUDENT_PREFIX)) {
    return pathname.replace(GT_STUDENT_PREFIX, ACADEMIC_STUDENT_PREFIX);
  }
  return studentDashboardPath(targetProgram);
}

export function dashboardPathForUser(
  role: string | null | undefined,
  programType: ProgramType
): string {
  if (role === "teacher") return "/dashboard/teacher";
  return studentDashboardPath(programType);
}

export function isProgramStudentPath(pathname: string): boolean {
  return (
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
}): ProgramType {
  const base = normalizeProgramType(input.programType);
  const enrolled = normalizeEnrolledProgramsForGuard(
    input.enrolledPrograms,
    base
  );
  const selected = String(input.programSelected ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

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
  return base;
}

function normalizeEnrolledProgramsForGuard(
  value: unknown,
  fallback: ProgramType
): ProgramType[] {
  const programs = new Set<ProgramType>();
  const add = (raw: string) => {
    const normalized = normalizeProgramType(raw);
    programs.add(normalized);
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

  if (programs.size === 0) programs.add(fallback);
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

  // Academic and GT are separate dashboards — never cross-access by enrollment alone.
  if (isIeltsVariantProgram(expectedProgram) && isIeltsVariantProgram(resolved)) {
    return resolved === expectedProgram;
  }

  const enrolled = normalizeEnrolledProgramsForGuard(
    input.enrolledPrograms,
    normalizeProgramType(input.programType)
  );
  if (enrolled.includes(expectedProgram)) return true;
  return resolved === expectedProgram;
}
