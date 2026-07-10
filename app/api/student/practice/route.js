import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { parseDailyPracticeProgramme } from "@/lib/dailyPractice/programme";
import { fetchStudentDailyPracticeTasks } from "@/lib/dailyPractice/fetchStudentTasks";
import { loadDailyPracticeProgress } from "@/lib/dailyPractice/completions";

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

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ tasks: [], studentLevel: "B1.1" });
    }

    const { searchParams } = new URL(request.url);
    const programme = parseDailyPracticeProgramme(searchParams.get("programme"));

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ tasks: [], studentLevel: "B1.1" });
    }

    const supabase = getSupabase();
    const payload = await fetchStudentDailyPracticeTasks(
      supabase,
      session.user.id,
      programme
    );
    const progress = await loadDailyPracticeProgress({
      supabase,
      studentId: session.user.id,
      programme,
      tasks: payload.tasks,
    });

    return NextResponse.json({
      ...payload,
      tasks: progress.tasksWithStatus,
      progress: {
        dateKey: progress.dateKey,
        completedCount: progress.completedCount,
        totalCount: progress.totalCount,
        allComplete: progress.allComplete,
        completedTaskIds: progress.completedTaskIds,
      },
    });
  } catch (err) {
    console.error("[student/practice] GET", err);
    return NextResponse.json(
      { tasks: [], studentLevel: "B1.1", error: "Internal server error" },
      { status: 500 }
    );
  }
}
