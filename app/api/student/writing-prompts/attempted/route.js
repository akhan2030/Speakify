import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_KEY) return null;
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskType = new URL(request.url).searchParams.get("taskType");
    if (taskType !== "task1" && taskType !== "task2") {
      return NextResponse.json({ error: "taskType must be task1 or task2" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ promptIds: [] });
    }

    const { data, error } = await supabase
      .from("writing_attempts")
      .select("prompt_id")
      .eq("student_id", studentId)
      .eq("task_type", taskType)
      .not("prompt_id", "is", null);

    if (error) {
      // Column may not exist yet — degrade gracefully
      if (error.message?.includes("prompt_id")) {
        return NextResponse.json({ promptIds: [] });
      }
      throw error;
    }

    const promptIds = [
      ...new Set(
        (data ?? [])
          .map((row) => row.prompt_id)
          .filter((id) => typeof id === "string" && id.length > 0)
      ),
    ];

    return NextResponse.json({ promptIds });
  } catch (err) {
    console.error("[writing-prompts/attempted]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load attempted prompts" },
      { status: 500 }
    );
  }
}
