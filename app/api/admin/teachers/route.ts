import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { isValidEmail } from "@/lib/invites";
import { createTeacherUser } from "@/lib/teacherUsers";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      return NextResponse.json(
        { error: "Teacher creation is not available." },
        { status: 503 }
      );
    }

    const { userId, error, status } = await createTeacherUser(supabase, {
      fullName,
      email,
      password,
    });

    if (!userId) {
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({
      success: true,
      userId,
      email,
      password,
      name: fullName,
      loginUrl: "/login",
      dashboardUrl: "/dashboard/teacher",
    });
  } catch (err) {
    console.error("[api/admin/teachers]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create teacher." },
      { status: 500 }
    );
  }
}
