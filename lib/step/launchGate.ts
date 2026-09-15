/** STEP launch — public independent prep; Coming soon is off unless env hides it. */
import { isActiveStepStudent } from "@/lib/routing/stepStudentGate";

export type StepLaunchMode = "hidden" | "beta" | "public";

export const STEP_COURSE_SLUG = "step-preparation";
export const STEP_REGISTRATION_SLUG = "step-test";

function readLaunchMode(): StepLaunchMode {
  const raw = (
    process.env.STEP_LAUNCH_MODE ??
    process.env.NEXT_PUBLIC_STEP_LAUNCH_MODE ??
    "public"
  )
    .trim()
    .toLowerCase();
  if (raw === "hidden" || raw === "beta") return raw;
  return "public";
}

export function getStepLaunchMode(): StepLaunchMode {
  return readLaunchMode();
}

export function isStepPubliclyDiscoverable(): boolean {
  return readLaunchMode() !== "hidden";
}

/** `/register/step-test` — open as independent prep. Set STEP_LAUNCH_MODE=hidden to close. */
export function isStepRegistrationOpen(): boolean {
  return readLaunchMode() !== "hidden";
}

export function isStepCourseSlug(slug: string): boolean {
  return slug === STEP_COURSE_SLUG;
}

export function filterStepFromCatalog<T extends { slug: string }>(items: T[]): T[] {
  if (isStepPubliclyDiscoverable()) return items;
  return items.filter((item) => !isStepCourseSlug(item.slug));
}

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
