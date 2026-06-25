import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

function normalizeRole(role: unknown): string | null {
  if (role == null) return null;
  const value = String(role).trim().toLowerCase();
  if (value === "teacher" || value === "student") return value;
  return null;
}

export default withAuth(
  function middleware(req) {
    const role = normalizeRole(req.nextauth.token?.role);
    const mustChangePassword = req.nextauth.token?.mustChangePassword === true;
    const { pathname } = req.nextUrl;

    if (mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }

    if (pathname.startsWith("/dashboard/teacher") && role !== "teacher") {
      return NextResponse.redirect(new URL("/dashboard/student", req.url));
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
