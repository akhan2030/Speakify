import {
  normalizeProgramType,
  studentDashboardPath,
  resolveStudentProgramType,
  type ProgramType,
} from "@/lib/programType";
import { classroomLoginOverride } from "@/lib/classroom/studentTypeRouter";
import { dashboardPathForRole, normalizeRole } from "@/lib/roles";
import { STEP_ROUTES } from "@/lib/step/paths";

const KNOWN_PROGRAMS: ProgramType[] = [
  "ielts",
  "ielts_general",
  "pathway",
  "classroom",
  "business_english",
  "legal_english",
  "kids_english",
];

function isKnownProgram(value: string): value is ProgramType {
  return (KNOWN_PROGRAMS as string[]).includes(value);
}

/** Parse enrolled_programs into lowercase slug list */
export function parseRawEnrolledPrograms(value: unknown): string[] {
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
  stepEnrolled?: boolean;
  programSelected?: unknown;
}): string {
  const programType = resolveStudentProgramType({
    programType: input.programType,
    enrolledPrograms: input.enrolledPrograms,
    programSelected: input.programSelected,
  });
  const programs = normalizeEnrolledPrograms(input.enrolledPrograms, programType);
  const raw = parseRawEnrolledPrograms(input.enrolledPrograms);
  const stepEnrolled = input.stepEnrolled === true;

  const isGeneralTraining =
    programType === "ielts_general" ||
    raw.includes("ielts_general") ||
    String(input.programSelected ?? "")
      .trim()
      .toLowerCase()
      .replace(/-/g, "_") === "ielts_general";

  // Stale step_enrolled flag with IELTS-only enrollment → IELTS dashboard (not STEP diagnostic)
  if (
    stepEnrolled &&
    programs.includes("ielts") &&
    !raw.includes("step")
  ) {
    return studentDashboardPath("ielts");
  }

  if (stepEnrolled) {
    const hasStepAndIelts = raw.includes("step") && raw.includes("ielts");
    const hasPathway = programs.includes("pathway");
    const hasOtherSpecialty =
      programs.includes("business_english") ||
      programs.includes("legal_english") ||
      programs.includes("kids_english");

    if (hasStepAndIelts || hasPathway || hasOtherSpecialty) {
      return "/dashboard/home";
    }

    return STEP_ROUTES.home;
  }

  if (isGeneralTraining) return "/dashboard/ielts-general/student";

  if (programs.length > 1) return "/dashboard/home";
  return studentDashboardPath(programs[0] ?? programType);
}

export function dashboardPathForStudentUser(user: {
  role?: string | null;
  programType?: unknown;
  enrolledPrograms?: unknown;
  stepEnrolled?: boolean;
  programSelected?: unknown;
  studentType?: unknown;
}): string {
  const role = normalizeRole(user.role);
  if (role === "teacher") return "/dashboard/teacher";
  if (role === "admin") return "/dashboard/admin";
  if (role !== "student") return "/login";

  const classroomPath = classroomLoginOverride({
    role,
    studentType: user.studentType,
    programType: user.programType,
  });
  if (classroomPath) return classroomPath;

  return resolveStudentDashboardPath({
    programType: user.programType,
    enrolledPrograms: user.enrolledPrograms,
    stepEnrolled: user.stepEnrolled,
    programSelected: user.programSelected,
  });
}
