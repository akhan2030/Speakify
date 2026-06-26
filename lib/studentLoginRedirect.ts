import {
  normalizeProgramType,
  studentDashboardPath,
  type ProgramType,
} from "@/lib/programType";
import { dashboardPathForRole, normalizeRole } from "@/lib/roles";

const KNOWN_PROGRAMS: ProgramType[] = [
  "ielts",
  "pathway",
  "business_english",
  "legal_english",
  "kids_english",
];

function isKnownProgram(value: string): value is ProgramType {
  return (KNOWN_PROGRAMS as string[]).includes(value);
}

export function normalizeEnrolledPrograms(
  value: unknown,
  programType?: ProgramType | null
): ProgramType[] {
  const programs = new Set<ProgramType>();

  const add = (raw: string) => {
    const normalized = normalizeProgramType(raw);
    if (isKnownProgram(normalized)) programs.add(normalized);
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

  if (programs.length > 1) return "/dashboard/home";
  return studentDashboardPath(programs[0] ?? programType);
}

export function dashboardPathForStudentUser(user: {
  role?: string | null;
  programType?: unknown;
  enrolledPrograms?: unknown;
}): string {
  const role = normalizeRole(user.role);
  return dashboardPathForRole(role) ?? "/login";
}
