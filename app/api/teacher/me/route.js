import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let studentAccess = false;

    if (process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      const supabase = createClient(
        getSupabaseUrl(),
        process.env.SUPABASE_SERVICE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data } = await supabase
        .from("users")
        .select("student_access")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data?.student_access === true) {
        studentAccess = true;
      }
    }

    return NextResponse.json({
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      studentAccess,
    });
  } catch (err) {
    console.error("[teacher/me]", err);
    return NextResponse.json({ studentAccess: false });
  }
}
