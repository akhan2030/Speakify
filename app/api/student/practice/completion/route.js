import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { parseDailyPracticeProgramme } from "@/lib/dailyPractice/programme";
import { fetchStudentDailyPracticeTasks } from "@/lib/dailyPractice/fetchStudentTasks";
import {
  loadDailyPracticeProgress,
  markDailyPracticeTaskComplete,
  pickNextDailyPracticeTask,
} from "@/lib/dailyPractice/completions";

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

function serializeNextTask(task) {
  if (!task) return null;
  return {
    id: task.id,
    title: task.title,
    skill: task.skill,
    practiceHref: task.practiceHref,
    estimatedMinutes: task.estimated_minutes ?? task.estimatedMinutes ?? null,
  };
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programme = parseDailyPracticeProgramme(searchParams.get("programme"));

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const supabase = getSupabase();
    const { tasks } = await fetchStudentDailyPracticeTasks(
      supabase,
      session.user.id,
      programme
    );
    const progress = await loadDailyPracticeProgress({
      supabase,
      studentId: session.user.id,
      programme,
      tasks,
    });

    return NextResponse.json({
      ...progress,
      nextTask: serializeNextTask(progress.nextTask),
    });
  } catch (err) {
    console.error("[student/practice/completion] GET", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const taskId = String(body.taskId ?? "").trim();
    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const programme = parseDailyPracticeProgramme(body.programme);
    const timeSpentMinutes = Number(body.timeSpentMinutes) || 10;

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const supabase = getSupabase();
    const { tasks } = await fetchStudentDailyPracticeTasks(
      supabase,
      session.user.id,
      programme
    );
    const taskMeta = tasks.find((task) => task.id === taskId) ?? null;

    const result = await markDailyPracticeTaskComplete({
      supabase,
      studentId: session.user.id,
      programme,
      taskId,
      timeSpentMinutes,
      taskMeta,
    });

    const nextTask = pickNextDailyPracticeTask(tasks, result.completedTaskIds);

    return NextResponse.json({
      ...result,
      nextTask: serializeNextTask(nextTask),
    });
  } catch (err) {
    console.error("[student/practice/completion] POST", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
