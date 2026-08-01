import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { shouldSkipGateway } from "@/lib/onboarding/postLogin";
import { dashboardPathForStudentUser, normalizeEnrolledPrograms, parseRawEnrolledPrograms } from "@/lib/studentLoginRedirect";
import { dashboardPathForRole, normalizeRole } from "@/lib/roles";
import { hasDashboardAccess, requiresProgrammePayment, isMockOnlyPurchaseIntent } from "@/lib/payments/access";
import { resolveLegacyStudentRedirect } from "@/lib/legacyStudentRoutes";
import {
  normalizeProgramType,
  resolveStudentProgramType,
  mirrorIeltsStudentDashboardPath,
  isIeltsVariantProgram,
  parseEnrollmentSlugs,
} from "@/lib/programType";
import { isInPersonStudent } from "@/lib/classroom/studentTypeRouter";
import {
  fetchGatewayBypassStatus,
  gatewayIsComplete,
} from "@/lib/auth/gatewayStatus";

import { isActiveStepStudent } from "@/lib/routing/stepStudentGate";
import {
  IELTS_MOCK_LOBBY_PATH,
  isIeltsAcademicMockPath,
} from "@/lib/mock-test/ieltsMockRoutes";

function paymentContextFromToken(token: {
  role?: string;
  paymentStatus?: string;
  paymentCompedUntil?: string;
  programSelected?: string;
  programType?: string;
  enrolledPrograms?: unknown;
  purchaseIntent?: string;
}) {
  const role = normalizeRole(token.role);
  const programType = normalizeProgramType(token.programType);
  const enrolledPrograms = normalizeEnrolledPrograms(token.enrolledPrograms, programType);
  const accessUser = {
    role,
    paymentStatus: token.paymentStatus,
    paymentCompedUntil: token.paymentCompedUntil,
    enrolledPrograms,
    programSelected: token.programSelected,
    purchaseIntent: token.purchaseIntent,
  };
  return {
    requiresPayment: requiresProgrammePayment(accessUser),
    hasDashboardAccess: hasDashboardAccess(accessUser),
    isMockOnly: isMockOnlyPurchaseIntent(token.purchaseIntent),
  };
}


export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token as {
      role?: string;
      sub?: string;
      mustChangePassword?: boolean;
      onboardingCompleted?: boolean;
      programType?: string;
      enrolledPrograms?: unknown;
      stepEnrolled?: boolean;
      paymentStatus?: string;
      paymentCompedUntil?: string;
      programSelected?: string;
      studentType?: string;
      purchaseIntent?: string;
    };
    const role = normalizeRole(token?.role);
    const mustChangePassword = token?.mustChangePassword === true;
    let onboardingCompleted = token?.onboardingCompleted === true;
    let { requiresPayment, hasDashboardAccess: dashboardAccess, isMockOnly } =
      paymentContextFromToken(token);
    const { pathname } = req.nextUrl;

    if (
      role === "student" &&
      token?.sub &&
      !shouldSkipGateway(role) &&
      (!onboardingCompleted || (requiresPayment && !dashboardAccess))
    ) {
      const bypass = await fetchGatewayBypassStatus(String(token.sub));
      if (gatewayIsComplete(bypass)) {
        onboardingCompleted = true;
      }
      if (bypass) {
        dashboardAccess = bypass.hasDashboardAccess;
        requiresPayment = bypass.requiresPayment;
        isMockOnly = bypass.isMockOnly;
      }
    }

    if (mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }

    if (role === "student" && !shouldSkipGateway(role) && !mustChangePassword) {
      if (!onboardingCompleted && pathname !== "/onboarding") {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }

      if (onboardingCompleted && pathname === "/onboarding") {
        if (requiresPayment && !dashboardAccess) {
          return NextResponse.redirect(new URL("/checkout", req.url));
        }
        const home = dashboardPathForStudentUser({
          role,
          programType: token?.programType,
          enrolledPrograms: token?.enrolledPrograms,
          stepEnrolled: token?.stepEnrolled,
          programSelected: token?.programSelected,
        });
        return NextResponse.redirect(new URL(home, req.url));
      }

      if (
        onboardingCompleted &&
        requiresPayment &&
        !dashboardAccess &&
        pathname.startsWith("/dashboard") &&
        !(isMockOnly && isIeltsAcademicMockPath(pathname))
      ) {
        return NextResponse.redirect(new URL("/checkout?reason=payment_required", req.url));
      }

      if (
        onboardingCompleted &&
        dashboardAccess &&
        (pathname === "/checkout" ||
          (pathname.startsWith("/checkout/") && !pathname.startsWith("/checkout/mock")))
      ) {
        const home = dashboardPathForStudentUser({
          role,
          programType: token?.programType,
          enrolledPrograms: token?.enrolledPrograms,
          stepEnrolled: token?.stepEnrolled,
          programSelected: token?.programSelected,
        });
        return NextResponse.redirect(new URL(home, req.url));
      }
    }

    if (
      (pathname.startsWith("/dashboard/admin") ||
        pathname.startsWith("/admin/classroom")) &&
      role !== "admin"
    ) {
      const fallback = dashboardPathForRole(role) ?? "/login";
      return NextResponse.redirect(new URL(fallback, req.url));
    }

    if (pathname.startsWith("/dashboard/teacher") && role !== "teacher") {
      const fallback = dashboardPathForRole(role) ?? "/login";
      return NextResponse.redirect(new URL(fallback, req.url));
    }

    if (
      (pathname.startsWith("/classroom-teacher") ||
        pathname.startsWith("/classroom/teacher")) &&
      role !== "teacher" &&
      role !== "admin"
    ) {
      const fallback = dashboardPathForRole(role) ?? "/login";
      return NextResponse.redirect(new URL(fallback, req.url));
    }

    if (
      pathname.startsWith("/classroom") &&
      !pathname.startsWith("/classroom/teacher") &&
      !pathname.startsWith("/classroom-teacher") &&
      role === "student"
    ) {
      const inPerson = isInPersonStudent(token?.studentType, {
        programType: token?.programType,
      });
      if (!inPerson) {
        const home = dashboardPathForStudentUser({
          role,
          programType: token?.programType,
          enrolledPrograms: token?.enrolledPrograms,
          stepEnrolled: token?.stepEnrolled,
          programSelected: token?.programSelected,
          studentType: token?.studentType,
        });
        return NextResponse.redirect(new URL(home, req.url));
      }
    }

    // In-person students stay in /classroom (never the self-study LMS)
    if (
      role === "student" &&
      isInPersonStudent(token?.studentType, {
        programType: token?.programType,
      }) &&
      pathname.startsWith("/dashboard")
    ) {
      return NextResponse.redirect(new URL("/classroom", req.url));
    }

    if (pathname === "/dashboard/home" && role === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }

    if (role === "student" && onboardingCompleted && isMockOnly) {
      // Only hijack to the Academic mock lobby for true mock-product accounts
      // (ielts-only / empty enrollment). Never steal STEP, GT, pathway, etc.
      const slugs = parseEnrollmentSlugs(token?.enrolledPrograms);
      const isMockProductPrimary =
        slugs.length === 0 ||
        slugs.every((s) => s === "ielts" || s === "toefl");
      if (
        isMockProductPrimary &&
        pathname.startsWith("/dashboard") &&
        !isIeltsAcademicMockPath(pathname)
      ) {
        return NextResponse.redirect(new URL(IELTS_MOCK_LOBBY_PATH, req.url));
      }
    }

    if (role === "student" && onboardingCompleted) {
      const stepStudent = isActiveStepStudent({
        stepEnrolled: token?.stepEnrolled,
        enrolledPrograms: token?.enrolledPrograms,
        programSelected: token?.programSelected,
        programType: token?.programType,
      });

      if (
        stepStudent &&
        pathname.startsWith("/dashboard/ielts") &&
        !isIeltsAcademicMockPath(pathname)
      ) {
        return NextResponse.redirect(new URL("/dashboard/step/student", req.url));
      }

      const programType = resolveStudentProgramType({
        programType: token?.programType,
        enrolledPrograms: token?.enrolledPrograms,
        programSelected: token?.programSelected,
      });

      if (pathname.startsWith("/dashboard/student")) {
        const legacyTarget = resolveLegacyStudentRedirect(pathname, programType);
        if (legacyTarget && legacyTarget !== pathname) {
          const url = new URL(legacyTarget, req.url);
          url.search = req.nextUrl.search;
          return NextResponse.redirect(url);
        }
      }

      if (!stepStudent && programType && isIeltsVariantProgram(programType)) {
        const mirrored = mirrorIeltsStudentDashboardPath(pathname, programType);
        if (mirrored !== pathname) {
          const url = new URL(mirrored, req.url);
          url.search = req.nextUrl.search;
          return NextResponse.redirect(url);
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const role = normalizeRole(token?.role);
        if (req.nextUrl.pathname === "/onboarding" || req.nextUrl.pathname.startsWith("/checkout")) {
          return Boolean(role);
        }
        return Boolean(role);
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/classroom/:path*",
    "/classroom",
    "/classroom-teacher",
    "/classroom-teacher/:path*",
    "/admin/classroom/:path*",
    "/admin/classroom",
    "/change-password",
    "/onboarding",
    "/checkout",
    "/checkout/:path*",
  ],
};
