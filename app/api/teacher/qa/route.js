import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { computeStats, normalizeIssue } from "@/lib/qaIssues";

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

async function requireTeacher() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "teacher") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

async function fetchTeachers(supabase) {
  const { data } = await supabase
    .from("users")
    .select("name")
    .eq("role", "teacher")
    .order("name", { ascending: true });

  return (data ?? [])
    .map((row) => row.name)
    .filter(Boolean);
}

export async function GET() {
  try {
    const auth = await requireTeacher();
    if (auth.error) return auth.error;

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({
        issues: [],
        stats: computeStats([]),
        teachers: [],
      });
    }

    const supabase = getSupabase();
    const [issuesResult, teachers] = await Promise.all([
      supabase
        .from("qa_issues")
        .select("*")
        .order("created_at", { ascending: false }),
      fetchTeachers(supabase),
    ]);

    if (issuesResult.error) {
      console.warn("[teacher/qa] GET", issuesResult.error.message);
      return NextResponse.json({
        issues: [],
        stats: computeStats([]),
        teachers,
        error: issuesResult.error.message,
      });
    }

    const issues = (issuesResult.data ?? []).map(normalizeIssue);
    const stats = computeStats(issues);

    return NextResponse.json({ issues, stats, teachers });
  } catch (err) {
    console.error("[teacher/qa] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load issues" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireTeacher();
    if (auth.error) return auth.error;

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body?.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Issue title is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const row = {
      title,
      description: String(body?.description ?? "").trim() || null,
      issue_type: String(body?.issue_type ?? body?.issueType ?? "technical_error").trim(),
      severity: String(body?.severity ?? "medium").trim(),
      affected_area: String(body?.affected_area ?? body?.affectedArea ?? "").trim() || null,
      affected_url: String(body?.affected_url ?? body?.affectedUrl ?? "").trim() || null,
      content_id: String(body?.content_id ?? body?.contentId ?? "").trim() || null,
      suggested_fix: String(body?.suggested_fix ?? body?.suggestedFix ?? "").trim() || null,
      assigned_to: String(body?.assigned_to ?? body?.assignedTo ?? "").trim() || null,
      quick_fix: Boolean(body?.quick_fix ?? body?.quickFix),
      status: String(body?.status ?? "detected").trim(),
      resolution_notes: null,
      created_by: auth.session.user.id,
      created_at: now,
      updated_at: now,
    };

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("qa_issues")
      .insert(row)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ issue: normalizeIssue(data) }, { status: 201 });
  } catch (err) {
    console.error("[teacher/qa] POST", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create issue" },
      { status: 500 }
    );
  }
}
