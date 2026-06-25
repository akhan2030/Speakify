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

export async function PATCH(request, { params }) {
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

    const homeworkId = String(params?.id ?? "").trim();
    if (!homeworkId) {
      return NextResponse.json({ error: "Homework id required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const submission =
      body?.submission != null ? String(body.submission) : null;

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const supabase = getSupabase();

    const { data: existing, error: fetchError } = await supabase
      .from("homework")
      .select("id, student_id, status, module")
      .eq("id", homeworkId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }
    if (existing.student_id !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "This homework has already been submitted" },
        { status: 400 }
      );
    }

    const isWriting = String(existing.module).toLowerCase() === "writing";
    if (isWriting && !String(submission ?? "").trim()) {
      return NextResponse.json(
        { error: "Essay submission is required for writing tasks" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("homework")
      .update({
        status: "submitted",
        submission: isWriting
          ? String(submission).trim()
          : submission?.trim() || "Marked complete by student",
      })
      .eq("id", homeworkId)
      .eq("student_id", studentId)
      .select(
        "id, module, task_description, due_date, status, submission, teacher_feedback"
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, assignment: data });
  } catch (err) {
    console.error("[student/homework/[id]] PATCH", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit homework" },
      { status: 500 }
    );
  }
}
