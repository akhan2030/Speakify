import {
  normalizeProgramType,
  parseEnrollmentSlugs,
  type ProgramType,
} from "@/lib/programType";

function normalizeEnrolledPrograms(
  value: unknown,
  fallback: ProgramType | null
): ProgramType[] {
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

  if (programs.size === 0 && fallback) {
    programs.add(fallback);
  }

  return Array.from(programs);
}

/**
 * True when the session should be treated as an active STEP student for route guards.
 * Matches resolveStudentDashboardPath — ignores stale step_enrolled on IELTS-only accounts.
 */
export function isActiveStepStudent(input: {
  stepEnrolled?: boolean;
  enrolledPrograms?: unknown;
  programSelected?: unknown;
  programType?: unknown;
}): boolean {
  const raw = parseEnrollmentSlugs(input.enrolledPrograms);
  const programSelected = String(input.programSelected ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  const stepEnrolled = input.stepEnrolled === true;
  const fallback = normalizeProgramType(input.programType);
  const programs = normalizeEnrolledPrograms(input.enrolledPrograms, fallback);

  if (
    stepEnrolled &&
    programs.includes("ielts") &&
    !raw.includes("step") &&
    programSelected !== "step"
  ) {
    return false;
  }

  return stepEnrolled || raw.includes("step") || programSelected === "step";
}
