import { normalizeProgramType, type ProgramType } from "@/lib/programType";
import { normalizeRole } from "@/lib/roles";

export function normalizeEnrolledPrograms(
  value: unknown,
  programType?: ProgramType | null
): string[] {
  const programs = new Set<string>();

  if (Array.isArray(value)) {
    for (const entry of value) {
      const v = String(entry).trim().toLowerCase();
      if (v === "ielts" || v === "pathway") programs.add(v);
    }
  } else if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          const v = String(entry).trim().toLowerCase();
          if (v === "ielts" || v === "pathway") programs.add(v);
        }
      }
    } catch {
      for (const part of value.split(",")) {
        const v = part.trim().toLowerCase();
        if (v === "ielts" || v === "pathway") programs.add(v);
      }
    }
  }

  if (programs.size === 0 && programType) {
    programs.add(programType);
  }

  if (programs.size === 0) {
    programs.add("ielts");
  }

  return Array.from(programs);
}

export function resolveStudentDashboardPath(input: {
  programType?: unknown;
  enrolledPrograms?: unknown;
}): string {
  const programType = normalizeProgramType(input.programType);
  const programs = normalizeEnrolledPrograms(input.enrolledPrograms, programType);

  const hasIELTS =
    programs.includes("ielts") || programType === "ielts";
  const hasPathway =
    programs.includes("pathway") || programType === "pathway";

  if (hasIELTS && hasPathway) return "/dashboard/home";
  if (hasPathway && !hasIELTS) return "/dashboard/pathway/student";
  return "/dashboard/ielts/student";
}

export function dashboardPathForStudentUser(user: {
  role?: string | null;
  programType?: unknown;
  enrolledPrograms?: unknown;
}): string {
  const role = normalizeRole(user.role);
  if (role === "teacher") return "/dashboard/teacher";
  if (role === "student") {
    return resolveStudentDashboardPath({
      programType: user.programType,
      enrolledPrograms: user.enrolledPrograms,
    });
  }
  return "/login";
}
