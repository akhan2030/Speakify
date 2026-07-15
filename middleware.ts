import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { shouldSkipGateway } from "@/lib/onboarding/postLogin";
import { dashboardPathForStudentUser, normalizeEnrolledPrograms } from "@/lib/studentLoginRedirect";
import { dashboardPathForRole, normalizeRole } from "@/lib/roles";
import { hasDashboardAccess, requiresProgrammePayment } from "@/lib/payments/access";
import { resolveLegacyStudentRedirect } from "@/lib/legacyStudentRoutes";
import {
  normalizeProgramType,
  resolveStudentProgramType,
  mirrorIeltsStudentDashboardPath,
  isIeltsVariantProgram,
} from "@/lib/programType";
import { isInPersonStudent } from "@/lib/classroom/studentTypeRouter";

function paymentContextFromToken(token: {
  role?: string;
  paymentStatus?: string;
  paymentCompedUntil?: string;
  programSelected?: string;
  programType?: string;
  enrolledPrograms?: unknown;
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
  };
  return {
    requiresPayment: requiresProgrammePayment(accessUser),
    hasDashboardAccess: hasDashboardAccess(accessUser),
  };
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as {
      role?: string;
      mustChangePassword?: boolean;
      onboardingCompleted?: boolean;
      programType?: string;
      enrolledPrograms?: unknown;
      stepEnrolled?: boolean;
      paymentStatus?: string;
      paymentCompedUntil?: string;
      programSelected?: string;
      studentType?: string;
    };
    const role = normalizeRole(token?.role);
    const mustChangePassword = token?.mustChangePassword === true;
    const onboardingCompleted = token?.onboardingCompleted === true;
    const { requiresPayment, hasDashboardAccess } = paymentContextFromToken(token);
    const { pathname } = req.nextUrl;

    if (mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }

    if (role === "student" && !shouldSkipGateway(role) && !mustChangePassword) {
      if (!onboardingCompleted && pathname !== "/onboarding") {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }

      if (onboardingCompleted && pathname === "/onboarding") {
        if (requiresPayment && !hasDashboardAccess) {
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
        !hasDashboardAccess &&
        pathname.startsWith("/dashboard")
      ) {
        return NextResponse.redirect(new URL("/checkout?reason=payment_required", req.url));
      }

      if (
        onboardingCompleted &&
        hasDashboardAccess &&
        (pathname === "/checkout" || pathname.startsWith("/checkout/"))
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

    if (role === "student" && onboardingCompleted) {
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

      if (isIeltsVariantProgram(programType)) {
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
