import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/course/enrollment";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const lessonId = body.lessonId?.trim();
    const status = body.status ?? "completed";
    const score = body.score != null ? Number(body.score) : null;

    if (!lessonId) {
      return NextResponse.json({ error: "lessonId required" }, { status: 400 });
    }

    const supabase = getSupabase();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("student_progress")
      .upsert(
        {
          student_id: studentId,
          lesson_id: lessonId,
          exercise_id: null,
          status,
          score,
          attempts: 1,
          started_at: now,
          completed_at: status === "completed" ? now : null,
          updated_at: now,
        },
        { onConflict: "student_id,lesson_id,exercise_id" }
      )
      .select("id, status")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, progress: data });
  } catch (err) {
    console.error("[course/progress]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save progress" },
      { status: 500 }
    );
  }
}
