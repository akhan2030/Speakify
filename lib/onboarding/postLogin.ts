import { dashboardPathForStudentUser } from "@/lib/studentLoginRedirect";
import { normalizeRole } from "@/lib/roles";

export function shouldSkipGateway(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "teacher";
}

export function resolvePostLoginPath(user: {
  role?: string | null;
  mustChangePassword?: boolean;
  onboardingCompleted?: boolean;
  programType?: string | null;
  enrolledPrograms?: unknown;
  stepEnrolled?: boolean;
}): string {
  if (user.mustChangePassword) return "/change-password";

  const role = normalizeRole(user.role);
  if (shouldSkipGateway(role)) {
    return dashboardPathForStudentUser(user);
  }

  if (user.onboardingCompleted !== true) {
    return "/onboarding";
  }

  return dashboardPathForStudentUser(user);
}
