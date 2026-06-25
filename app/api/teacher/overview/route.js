import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { computeTeacherOverview, emptyOverview } from "@/lib/teacherOverview";

export const runtime = "nodejs";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      console.warn("[teacher/overview] Supabase not configured");
      return NextResponse.json(emptyOverview());
    }

    const supabase = getSupabase();
    const overview = await computeTeacherOverview(supabase);

    return NextResponse.json(overview);
  } catch (err) {
    console.error("[teacher/overview]", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to load overview",
        ...emptyOverview(),
      },
      { status: 500 }
    );
  }
}
