import {
  isIeltsVariantProgram,
  studentDashboardPath,
  type ProgramType,
} from "@/lib/programType";

const LEGACY_STUDENT_PREFIX = "/dashboard/student";

/** Map legacy `/dashboard/student/*` URLs to programme-specific student routes. */
export function resolveLegacyStudentRedirect(
  pathname: string,
  programType: ProgramType
): string | null {
  if (!pathname.startsWith(LEGACY_STUDENT_PREFIX)) return null;

  const home = studentDashboardPath(programType);
  const rest = pathname.slice(LEGACY_STUDENT_PREFIX.length);

  if (rest.startsWith("/pathway") || rest.startsWith("/course")) {
    if (programType === "pathway") {
      if (rest === "/pathway" || rest === "/pathway/") {
        return "/dashboard/pathway/student/my-pathway";
      }
      if (rest.startsWith("/pathway/")) {
        return `/dashboard/pathway/student${rest.slice("/pathway".length)}`;
      }
      return `/dashboard/pathway/student${rest}`;
    }
    return home;
  }

  if (rest.startsWith("/accelerator")) {
    if (programType === "ielts_general") {
      return `${home}/progress`;
    }
    if (programType === "ielts") {
      if (rest === "/accelerator" || rest === "/accelerator/") {
        return `${home}/accelerator`;
      }
      return `${home}${rest}`;
    }
    return home;
  }

  if (rest === "/study-plan") {
    if (programType === "pathway") {
      return "/dashboard/pathway/student/study-plan";
    }
    return `${home}/weekly-plan`;
  }

  if (isIeltsVariantProgram(programType)) {
    return `${home}${rest}`;
  }

  return `${home}${rest}`;
}
