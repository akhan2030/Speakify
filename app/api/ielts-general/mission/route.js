import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { ACCELERATOR_TRACKS, recommendTrack } from "@/lib/accelerator/tracks";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { getGeneralMissionTasksForDay } from "@/lib/ielts-general/missionTasks";
import {
  getDaySubtitle,
  getStudyDay,
  getStudyWeekDates,
  getNextStudyWeekDates,
  STUDY_DAY_FULL,
} from "@/lib/ielts/studyWeek";
import {
  missionTaskKey,
  todayDateKey,
  parseMissionTaskKey,
} from "@/lib/ielts/missionKeys";
import {
  fetchCompletionsForRange,
  completionsSetForDate,
  attachTaskCompletion,
  updateStudyStreak,
} from "@/lib/ielts/updateStudyStreak";

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

function gtDayCompletionStatus(dateKey, studyDay, completedIds) {
  const tasks = getGeneralMissionTasksForDay(studyDay);
  const done = tasks.filter((t) =>
    completedIds.has(missionTaskKey(dateKey, t.id))
  ).length;
  return {
    completed: done,
    total: tasks.length,
    fullyComplete: done === tasks.length && tasks.length > 0,
    partial: done > 0 && done < tasks.length,
  };
}

function computeTrackWeek(completions, weekCount) {
  const thisWeek = getStudyWeekDates();
  const nextWeek = getNextStudyWeekDates();
  const allDays = [...thisWeek, ...nextWeek];

  let completedWeeks = 0;
  for (let w = 0; w < weekCount; w += 1) {
    const weekStart = w * 7;
    const weekDays = allDays.slice(weekStart, weekStart + 7);
    if (weekDays.length < 7) break;
    const weekDone = weekDays.every((d) => {
      const ids = completionsSetForDate(completions, d.dateKey);
      return gtDayCompletionStatus(d.dateKey, d.day, ids).fullyComplete;
    });
    if (weekDone) completedWeeks += 1;
    else break;
  }

  const currentWeek = Math.min(weekCount, Math.max(1, completedWeeks + 1));
  const totalDays = weekCount * 7;
  const doneDays =
    completions.length > 0
      ? new Set(
          completions.map(
            (c) =>
              parseMissionTaskKey(c.task_id).dateKey ??
              String(c.completed_at).slice(0, 10)
          )
        ).size
      : 0;
  const progressPercent = Math.min(100, Math.round((doneDays / totalDays) * 100));

  return { currentWeek, progressPercent, completedWeeks };
}

function buildWeekPayload(completions, weekDates, todayKey, trackCurrentWeek) {
  return weekDates.map((d) => {
    const ids = completionsSetForDate(completions, d.dateKey);
    const status = gtDayCompletionStatus(d.dateKey, d.day, ids);
    const tasks = attachTaskCompletion(getGeneralMissionTasksForDay(d.day), d.dateKey, ids);
    const isToday = d.dateKey === todayKey;
    const isFuture = d.dateKey > todayKey;

    return {
      ...d,
      subtitle: getDaySubtitle(d.day),
      tasks,
      ...status,
      isToday,
      isFuture,
      canComplete: isToday,
      weekNumber: trackCurrentWeek,
      statusLabel: status.fullyComplete
        ? "completed"
        : status.partial
          ? "in_progress"
          : isToday
            ? "today"
            : isFuture
              ? "upcoming"
              : "missed",
    };
  });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await fetchStudentProfile(studentId);
    const placementBand =
      profile.placementBand ?? profile.currentBand ?? profile.skillBands?.reading ?? null;
    const trackId = recommendTrack(placementBand);
    const trackMeta = ACCELERATOR_TRACKS[trackId];
    const todayKey = todayDateKey();

    let completions = [];

    if (process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      const supabase = getSupabase();
      const thisWeek = getStudyWeekDates();
      const nextWeek = getNextStudyWeekDates();
      const rangeStart = thisWeek[0].dateKey;
      const rangeEnd = nextWeek[6].dateKey;
      completions = await fetchCompletionsForRange(
        supabase,
        studentId,
        rangeStart,
        rangeEnd
      );
    }

    const { currentWeek, progressPercent } = computeTrackWeek(
      completions,
      trackMeta.weekCount
    );

    const thisWeekDays = buildWeekPayload(
      completions,
      getStudyWeekDates(),
      todayKey,
      currentWeek
    );
    const nextWeekDays = buildWeekPayload(
      completions,
      getNextStudyWeekDates(),
      todayKey,
      currentWeek + 1
    );

    const weeks = Array.from({ length: trackMeta.weekCount }, (_, i) => {
      const week = i + 1;
      let status = "locked";
      if (week < currentWeek) status = "completed";
      else if (week === currentWeek) status = "current";
      return {
        week,
        title: trackMeta.weekTitles[i] ?? `Week ${week}`,
        status,
      };
    });

    return NextResponse.json({
      track: {
        id: trackId,
        name: trackMeta.name,
        currentWeek,
        weekCount: trackMeta.weekCount,
        progressPercent,
        weeks,
        weekTitle: trackMeta.weekTitles[currentWeek - 1] ?? "",
      },
      weeklyPlan: {
        thisWeek: thisWeekDays,
        nextWeek: nextWeekDays,
      },
    });
  } catch (err) {
    console.error("[ielts-general/mission GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load programme" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json(
        { error: "Run supabase/ielts_self_study_setup.sql first" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { taskId, action = "complete", timeSpentMinutes } = body;
    const todayKey = todayDateKey();

    if (!taskId || typeof taskId !== "string") {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }

    const supabase = getSupabase();
    const studyDay = getStudyDay();
    const missionTasks = getGeneralMissionTasksForDay(studyDay);
    const baseTaskId = taskId.includes("::")
      ? parseMissionTaskKey(taskId).taskId
      : taskId;
    const task = missionTasks.find((t) => t.id === baseTaskId);

    if (!task) {
      return NextResponse.json({ error: "Unknown task for today" }, { status: 400 });
    }

    const fullKey = missionTaskKey(todayKey, task.id);

    if (action === "uncomplete") {
      await supabase
        .from("daily_task_completions")
        .delete()
        .eq("student_id", studentId)
        .eq("task_id", fullKey);
    } else {
      const { data: existing } = await supabase
        .from("daily_task_completions")
        .select("id")
        .eq("student_id", studentId)
        .eq("task_id", fullKey)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabase.from("daily_task_completions").insert({
          student_id: studentId,
          task_id: fullKey,
          task_type: task.taskType,
          day_of_week: studyDay,
          time_spent_minutes: Number(timeSpentMinutes) || task.minutes,
        });

        if (insertError) {
          throw insertError;
        }
      }
    }

    const streakResult = await updateStudyStreak(
      supabase,
      studentId,
      Number(timeSpentMinutes) || task.minutes
    );

    const completions = await fetchCompletionsForRange(
      supabase,
      studentId,
      todayKey,
      todayKey
    );
    const completedIds = completionsSetForDate(completions, todayKey);
    const tasks = attachTaskCompletion(missionTasks, todayKey, completedIds);
    const allComplete = tasks.every((t) => t.completed);

    return NextResponse.json({
      ok: true,
      task: tasks.find((t) => t.id === task.id),
      completedCount: tasks.filter((t) => t.completed).length,
      totalCount: tasks.length,
      allComplete,
      remainingMinutes: tasks
        .filter((t) => !t.completed)
        .reduce((sum, t) => sum + t.minutes, 0),
      streak: streakResult,
    });
  } catch (err) {
    console.error("[ielts-general/mission POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update task" },
      { status: 500 }
    );
  }
}
