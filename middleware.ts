import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { shouldSkipGateway } from "@/lib/onboarding/postLogin";
import { dashboardPathForStudentUser } from "@/lib/studentLoginRedirect";
import { dashboardPathForRole, normalizeRole } from "@/lib/roles";

export default withAuth(
  function middleware(req) {
    const role = normalizeRole(req.nextauth.token?.role);
    const mustChangePassword = req.nextauth.token?.mustChangePassword === true;
    const onboardingCompleted = (req.nextauth.token as { onboardingCompleted?: boolean })
      ?.onboardingCompleted === true;
    const { pathname } = req.nextUrl;

    if (mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }

    if (role === "student" && !shouldSkipGateway(role) && !mustChangePassword) {
      if (!onboardingCompleted && pathname !== "/onboarding") {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
      if (onboardingCompleted && pathname === "/onboarding") {
        const home = dashboardPathForStudentUser({
          role,
          programType: (req.nextauth.token as { programType?: string })?.programType,
          enrolledPrograms: (req.nextauth.token as { enrolledPrograms?: unknown })
            ?.enrolledPrograms,
          stepEnrolled: (req.nextauth.token as { stepEnrolled?: boolean })?.stepEnrolled,
        });
        return NextResponse.redirect(new URL(home, req.url));
      }
    }

    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      const fallback = dashboardPathForRole(role) ?? "/login";
      return NextResponse.redirect(new URL(fallback, req.url));
    }

    if (pathname.startsWith("/dashboard/teacher") && role !== "teacher") {
      const fallback = dashboardPathForRole(role) ?? "/login";
      return NextResponse.redirect(new URL(fallback, req.url));
    }

    if (pathname === "/dashboard/home" && role === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const role = normalizeRole(token?.role);
        if (req.nextUrl.pathname === "/onboarding") {
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
  matcher: ["/dashboard/:path*", "/change-password", "/onboarding"],
};
