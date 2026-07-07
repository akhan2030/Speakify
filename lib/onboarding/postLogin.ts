import { dashboardPathForStudentUser } from "@/lib/studentLoginRedirect";
import { normalizeRole } from "@/lib/roles";
import { hasDashboardAccess, requiresProgrammePayment } from "@/lib/payments/access";

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
  paymentStatus?: string | null;
  paymentCompedUntil?: string | null;
  programSelected?: string | null;
  hasDashboardAccess?: boolean;
}): string {
  if (user.mustChangePassword) return "/change-password";

  const role = normalizeRole(user.role);
  if (shouldSkipGateway(role)) {
    return dashboardPathForStudentUser(user);
  }

  if (user.onboardingCompleted !== true) {
    return "/onboarding";
  }

  const accessUser = {
    role,
    paymentStatus: user.paymentStatus,
    paymentCompedUntil: user.paymentCompedUntil,
    enrolledPrograms: user.enrolledPrograms,
    programSelected: user.programSelected,
  };

  if (
    requiresProgrammePayment(accessUser) &&
    !hasDashboardAccess(accessUser) &&
    user.hasDashboardAccess !== true
  ) {
    return "/checkout";
  }

  return dashboardPathForStudentUser(user);
}
