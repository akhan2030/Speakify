import {
  SPECIALTY_PROGRAM_IDS,
  type SpecialtyProgramId,
} from "@/lib/specialtyPrograms";

export type CoreProgramType = "pathway" | "ielts";
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
    pathname.startsWith("/dashboard/business-english/student") ||
    pathname.startsWith("/dashboard/legal-english/student") ||
    pathname.startsWith("/dashboard/kids-english/student")
  );
}

export function isPathwayStudentPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard/pathway/student");
}
