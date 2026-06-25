import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";

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

function formatDate(dateKey) {
  if (!dateKey) return "—";
  return new Date(`${dateKey}T12:00:00.000Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapRow(row) {
  return {
    id: row.id,
    module: row.module,
    taskDescription: row.task_description,
    dueDate: row.due_date,
    dueDateLabel: formatDate(row.due_date),
    status: row.status ?? "pending",
    submission: row.submission ?? null,
    teacherFeedback: row.teacher_feedback ?? null,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const role = normalizeRole(session?.user?.role);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (role && role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      console.warn("[student/homework] Supabase not configured");
      return NextResponse.json({ assignments: [] });
    }

    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from("homework")
      .select(
        "id, student_id, module, task_description, due_date, status, submission, teacher_feedback, created_at"
      )
      .eq("student_id", studentId)
      .order("due_date", { ascending: true });

    if (error) {
      if (error.message?.includes("homework")) {
        return NextResponse.json({ assignments: [], tableMissing: true });
      }
      throw error;
    }

    return NextResponse.json({
      assignments: (rows ?? []).map(mapRow),
    });
  } catch (err) {
    console.error("[student/homework] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load homework" },
      { status: 500 }
    );
  }
}
