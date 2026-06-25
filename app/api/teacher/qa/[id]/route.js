import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { normalizeIssue } from "@/lib/qaIssues";

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

export async function GET(_request, { params }) {
  try {
    const auth = await requireTeacher();
    if (auth.error) return auth.error;

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Issue id required" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const supabase = getSupabase();
    const [issueResult, teachersResult] = await Promise.all([
      supabase.from("qa_issues").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("users")
        .select("name")
        .eq("role", "teacher")
        .order("name", { ascending: true }),
    ]);

    if (issueResult.error) throw issueResult.error;
    if (!issueResult.data) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const teachers = (teachersResult.data ?? [])
      .map((row) => row.name)
      .filter(Boolean);

    return NextResponse.json({
      issue: normalizeIssue(issueResult.data),
      teachers,
    });
  } catch (err) {
    console.error("[teacher/qa/[id]] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load issue" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireTeacher();
    if (auth.error) return auth.error;

    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Issue id required" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const updates = { updated_at: new Date().toISOString() };

    const fields = [
      ["title", "title"],
      ["description", "description"],
      ["issue_type", "issue_type", "issueType"],
      ["severity", "severity"],
      ["affected_area", "affected_area", "affectedArea"],
      ["affected_url", "affected_url", "affectedUrl"],
      ["content_id", "content_id", "contentId"],
      ["suggested_fix", "suggested_fix", "suggestedFix"],
      ["assigned_to", "assigned_to", "assignedTo"],
      ["status", "status"],
      ["resolution_notes", "resolution_notes", "resolutionNotes"],
    ];

    for (const [col, ...keys] of fields) {
      const key = keys.find((k) => body[k] !== undefined);
      if (key !== undefined) {
        const val = body[key];
        updates[col] = typeof val === "string" ? val.trim() || null : val;
      }
    }

    if (body.quick_fix !== undefined || body.quickFix !== undefined) {
      updates.quick_fix = Boolean(body.quick_fix ?? body.quickFix);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("qa_issues")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ issue: normalizeIssue(data) });
  } catch (err) {
    console.error("[teacher/qa/[id]] PATCH", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update issue" },
      { status: 500 }
    );
  }
}
