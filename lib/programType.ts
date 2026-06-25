export type ProgramType = "pathway" | "ielts";

export function normalizeProgramType(value: unknown): ProgramType {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (v === "pathway" || v === "english_pathway" || v === "english-pathway") {
    return "pathway";
  }
  return "ielts";
}

export function studentDashboardPath(programType: ProgramType): string {
  return programType === "pathway"
    ? "/dashboard/pathway/student"
    : "/dashboard/ielts/student";
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
    pathname.startsWith("/dashboard/ielts/student")
  );
}

export function isPathwayStudentPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard/pathway/student");
}
