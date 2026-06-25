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

  const programType = normalizeProgramType(session.user?.programType);

  return NextResponse.json({
    id: session.user.id ?? null,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role,
    programType,
    dashboardPath: dashboardPathForSessionUser({ role, programType }),
    mustChangePassword: session.user?.mustChangePassword === true,
  });
}
