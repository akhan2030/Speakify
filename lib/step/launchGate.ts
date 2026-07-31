/** STEP launch visibility — default hidden until explicitly opened. */
export type StepLaunchMode = "hidden" | "beta" | "public";

export const STEP_COURSE_SLUG = "step-preparation";
export const STEP_REGISTRATION_SLUG = "step-test";

function readLaunchMode(): StepLaunchMode {
  const raw = (
    process.env.STEP_LAUNCH_MODE ??
    process.env.NEXT_PUBLIC_STEP_LAUNCH_MODE ??
    "hidden"
  )
    .trim()
    .toLowerCase();
  if (raw === "public" || raw === "beta") return raw;
  return "hidden";
}

/** Current launch mode (hidden = not listed, no new enrollments). */
export function getStepLaunchMode(): StepLaunchMode {
  return readLaunchMode();
}

/** Listed in courses hub, nav, and onboarding programme picker. */
export function isStepPubliclyDiscoverable(): boolean {
  return getStepLaunchMode() === "public";
}

/** `/register/step-test` accepts new sign-ups (beta = direct URL only). */
export function isStepRegistrationOpen(): boolean {
  const mode = getStepLaunchMode();
  return mode === "public" || mode === "beta";
}

export function isStepCourseSlug(slug: string): boolean {
  return slug === STEP_COURSE_SLUG;
}

export function filterStepFromCatalog<T extends { slug: string }>(items: T[]): T[] {
  if (isStepPubliclyDiscoverable()) return items;
  return items.filter((item) => !isStepCourseSlug(item.slug));
}

import { isActiveStepStudent } from "@/lib/routing/stepStudentGate";

export function isStepStudentUser(
  user:
    | {
        stepEnrolled?: boolean;
        enrolledPrograms?: unknown;
        programSelected?: unknown;
        programType?: unknown;
      }
    | null
    | undefined
): boolean {
  if (!user) return false;
  return isActiveStepStudent(user);
}
