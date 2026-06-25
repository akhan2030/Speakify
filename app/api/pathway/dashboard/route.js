import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { getPathwayDashboardPayload } from "@/lib/programs/pathway/engine";
import { normalizePathwayLevelId } from "@/lib/programs/terminology";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function safeQuery(query) {
  try {
    const result = await query;
    if (result.error) {
      console.warn("[pathway/dashboard]", result.error.message);
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !process.env.SUPABASE_URL) {
      return NextResponse.json({
        enrollment: null,
        currentLevel: null,
        allLevels: [],
        todayTasks: [],
        streak: null,
      });
    }

    const supabase = getSupabase();
    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const enrollment = await safeQuery(
      supabase
        .from("pathway_enrollments")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle()
    );

    const currentLevel = await safeQuery(
      supabase
        .from("pathway_level_progress")
        .select("*")
        .eq("student_id", studentId)
        .eq("status", "active")
        .maybeSingle()
    );

    const allLevels =
      (await safeQuery(
        supabase
          .from("pathway_level_progress")
          .select("*")
          .eq("student_id", studentId)
          .order("level_id")
      )) ?? [];

    const todayTasks =
      (await safeQuery(
        supabase
          .from("pathway_task_completions")
          .select("*")
          .eq("student_id", studentId)
          .eq("level_id", currentLevel?.level_id || "b1_1")
          .eq("week_number", currentLevel?.week_current || 1)
          .eq("day_of_week", today)
      )) ?? [];

    const streak = await safeQuery(
      supabase
        .from("study_streaks")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle()
    );

    const levelId = normalizePathwayLevelId(currentLevel?.level_id);
    const week = currentLevel?.week_current ?? 1;
    const enginePayload = getPathwayDashboardPayload({
      levelId,
      week,
      todayTasks,
      streak,
    });

    return NextResponse.json({
      programType: "english_pathway",
      enrollment,
      currentLevel,
      allLevels,
      todayTasks,
      streak,
      ...enginePayload,
    });
  } catch (err) {
    console.error("[pathway/dashboard]", err);
    return NextResponse.json(
      { error: "Failed to load pathway dashboard" },
      { status: 500 }
    );
  }
}
