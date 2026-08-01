import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dashboardPathForSessionUser } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";
import { normalizeProgramType } from "@/lib/programType";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = normalizeRole(session?.user?.role);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!role) {
    return NextResponse.json(
      { error: "Account role is not configured." },
      { status: 403 }
    );
  }

  const user = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
    programType?: string | null;
    enrolledPrograms?: unknown;
    stepEnrolled?: boolean;
    programSelected?: string | null;
    mustChangePassword?: boolean;
  };

  const programType = normalizeProgramType(user.programType);

  return NextResponse.json({
    id: user.id ?? null,
    name: user.name ?? null,
    email: user.email ?? null,
    role,
    programType,
    enrolledPrograms: user.enrolledPrograms ?? [],
    programSelected: user.programSelected ?? null,
    stepEnrolled: user.stepEnrolled === true,
    dashboardPath: dashboardPathForSessionUser({
      role,
      programType: user.programType,
      enrolledPrograms: user.enrolledPrograms,
      stepEnrolled: user.stepEnrolled,
      programSelected: user.programSelected,
    }),
    mustChangePassword: user.mustChangePassword === true,
  });
}
