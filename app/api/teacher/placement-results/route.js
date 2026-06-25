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
      return NextResponse.json({ results: [] });
    }

    const supabase = getSupabase();

    const { data: attempts, error } = await supabase
      .from("placement_attempts")
      .select(
        "id, student_id, full_name, email, overall_band, cefr_level, completed_at, confidence_score, total_questions, target_band_score, ielts_purpose"
      )
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (error) throw error;

    const studentIds = [
      ...new Set(
        (attempts ?? [])
          .map((a) => a.student_id)
          .filter((id) => id && !String(id).startsWith("guest_"))
      ),
    ];

    let usersById = new Map();
    if (studentIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", studentIds);

      if (usersError) throw usersError;
      usersById = new Map((users ?? []).map((u) => [u.id, u]));
    }

    const results = (attempts ?? [])
      .filter((a) => !String(a.student_id).startsWith("guest_"))
      .map((a) => {
        const user = usersById.get(a.student_id);
        return {
          attemptId: a.id,
          studentId: a.student_id,
          name: a.full_name || user?.name || "Unknown",
          email: a.email || user?.email || "—",
          overallBand: a.overall_band != null ? Number(a.overall_band) : null,
          cefrLevel: a.cefr_level ?? "—",
          completedAt: a.completed_at,
          completedAtLabel: a.completed_at
            ? new Date(a.completed_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—",
          confidenceScore: a.confidence_score,
          totalQuestions: a.total_questions,
        };
      });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[teacher/placement-results]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load results" },
      { status: 500 }
    );
  }
}
