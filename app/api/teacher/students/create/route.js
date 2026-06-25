import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";
import { createStudentAccount } from "@/lib/users/createStudentAccount";

export const runtime = "nodejs";

async function requireTeacher() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (normalizeRole(session.user.role) !== "teacher") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function POST(request) {
  try {
    const auth = await requireTeacher();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name : "";
    const email = typeof body.email === "string" ? body.email : "";
    const temporaryPassword =
      typeof body.temporaryPassword === "string"
        ? body.temporaryPassword
        : typeof body.password === "string"
          ? body.password
          : "";
    const sendWelcomeEmail = body.sendWelcomeEmail !== false;

    const result = await createStudentAccount({
      name,
      email,
      temporaryPassword,
      sendWelcomeEmail,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      userId: result.userId,
      name: result.name,
      email: result.email,
      role: "student",
      isActive: true,
      mustChangePassword: true,
      emailSent: result.emailSent,
      emailMode: result.emailMode ?? null,
    });
  } catch (err) {
    console.error("[teacher/students/create]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create student" },
      { status: 500 }
    );
  }
}
