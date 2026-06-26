import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { dashboardPathForRole, normalizeRole } from "@/lib/roles";

export default withAuth(
  function middleware(req) {
    const role = normalizeRole(req.nextauth.token?.role);
    const mustChangePassword = req.nextauth.token?.mustChangePassword === true;
    const { pathname } = req.nextUrl;

    if (mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", req.url));
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
      authorized: ({ token }) => Boolean(normalizeRole(token?.role)),
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/change-password"],
};
