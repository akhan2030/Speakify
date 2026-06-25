import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  ACCELERATOR_TRACKS,
  recommendTrack,
} from "@/lib/accelerator/tracks";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { getMissionTasksForDay } from "@/lib/ielts/missionTasks";
import {
  getStudyDay,
  getDaySubtitle,
  formatFullDate,
  getTomorrowDay,
  getStudyWeekDates,
  getNextStudyWeekDates,
  STUDY_DAY_FULL,
  dateKeyToStudyDay,
} from "@/lib/ielts/studyWeek";
import {
  missionTaskKey,
  todayDateKey,
  parseMissionTaskKey,
} from "@/lib/ielts/missionKeys";
import {
  updateStudyStreak,
  fetchCompletionsForRange,
  completionsSetForDate,
  dayCompletionStatus,
  attachTaskCompletion,
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
      return dayCompletionStatus(d.dateKey, d.day, ids).fullyComplete;
    });
    if (weekDone) completedWeeks += 1;
    else break;
  }

  const currentWeek = Math.min(weekCount, Math.max(1, completedWeeks + 1));
  const totalDays = weekCount * 7;
  const doneDays = completions.length > 0
    ? new Set(completions.map((c) => parseMissionTaskKey(c.task_id).dateKey ?? String(c.completed_at).slice(0, 10))).size
    : 0;
  const progressPercent = Math.min(100, Math.round((doneDays / totalDays) * 100));

  return { currentWeek, progressPercent, completedWeeks };
}

function buildWeekPayload(completions, weekDates, todayKey, trackCurrentWeek) {
  return weekDates.map((d) => {
    const ids = completionsSetForDate(completions, d.dateKey);
    const status = dayCompletionStatus(d.dateKey, d.day, ids);
    const tasks = attachTaskCompletion(getMissionTasksForDay(d.day), d.dateKey, ids);
    const isToday = d.dateKey === todayKey;
    const isFuture = d.dateKey > todayKey;
    const weekNum = trackCurrentWeek;

    return {
      ...d,
      subtitle: getDaySubtitle(d.day),
      tasks,
      ...status,
      isToday,
      isFuture,
      canComplete: isToday,
      weekNumber: weekNum,
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

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const todayKey = todayDateKey();
    const targetDateKey = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : todayKey;
    const studyDay = dateKeyToStudyDay(targetDateKey);
    const isToday = targetDateKey === todayKey;

    const profile = await fetchStudentProfile(studentId);
    const placementBand =
      profile.placementBand ?? profile.currentBand ?? profile.skillBands?.reading ?? null;
    const trackId = recommendTrack(placementBand);
    const trackMeta = ACCELERATOR_TRACKS[trackId];

    let completions = [];
    let streak = { current: profile.studyStreak ?? 0, longest: profile.studyStreak ?? 0 };

    if (process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()) {
      const supabase = getSupabase();
      const thisWeek = getStudyWeekDates();
      const nextWeek = getNextStudyWeekDates();
      const rangeStart = thisWeek[0].dateKey;
      const rangeEnd = nextWeek[6].dateKey;

      completions = await fetchCompletionsForRange(supabase, studentId, rangeStart, rangeEnd);

      const { data: streakRow } = await supabase
        .from("study_streaks")
        .select("current_streak, longest_streak")
        .eq("student_id", studentId)
        .maybeSingle();

      if (streakRow) {
        streak = {
          current: streakRow.current_streak ?? 0,
          longest: streakRow.longest_streak ?? 0,
        };
      }
    }

    const { currentWeek, progressPercent } = computeTrackWeek(completions, trackMeta.weekCount);
    const completedIds = completionsSetForDate(completions, targetDateKey);
    const tasks = attachTaskCompletion(
      getMissionTasksForDay(studyDay),
      targetDateKey,
      completedIds
    );
    const completedCount = tasks.filter((t) => t.completed).length;
    const remainingMinutes = tasks
      .filter((t) => !t.completed)
      .reduce((s, t) => s + t.minutes, 0);

    const tomorrowDay = getTomorrowDay(studyDay);
    const tomorrowTasks = getMissionTasksForDay(tomorrowDay);

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
      dateKey: targetDateKey,
      isToday,
      todayDate: formatFullDate(new Date(`${targetDateKey}T12:00:00`)),
      dayName: STUDY_DAY_FULL[studyDay],
      subtitle: getDaySubtitle(studyDay),
      tasks,
      completedCount,
      totalCount: tasks.length,
      remainingMinutes,
      allComplete: completedCount === tasks.length && tasks.length > 0,
      tomorrow: {
        dayName: STUDY_DAY_FULL[tomorrowDay],
        subtitle: getDaySubtitle(tomorrowDay),
        tasks: tomorrowTasks,
        totalMinutes: tomorrowTasks.reduce((s, t) => s + t.minutes, 0),
      },
      streak,
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
    console.error("[student/ielts-mission GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load mission" },
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
    const { taskId, action = "complete", timeSpentMinutes, dateKey: bodyDateKey } = body;
    const todayKey = todayDateKey();
    const dateKey = bodyDateKey && bodyDateKey === todayKey ? todayKey : todayKey;

    if (!taskId || typeof taskId !== "string") {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }

    if (dateKey !== todayKey) {
      return NextResponse.json(
        { error: "You can only complete today's tasks" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const studyDay = getStudyDay();
    const missionTasks = getMissionTasksForDay(studyDay);
    const baseTaskId = taskId.includes("::") ? parseMissionTaskKey(taskId).taskId : taskId;
    const task = missionTasks.find((t) => t.id === baseTaskId);

    if (!task) {
      return NextResponse.json({ error: "Unknown task for today" }, { status: 400 });
    }

    const fullKey = missionTaskKey(dateKey, task.id);

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
      dateKey,
      dateKey
    );
    const completedIds = completionsSetForDate(completions, dateKey);
    const tasks = attachTaskCompletion(missionTasks, dateKey, completedIds);
    const allComplete = tasks.every((t) => t.completed);

    return NextResponse.json({
      ok: true,
      task: tasks.find((t) => t.id === task.id),
      completedCount: tasks.filter((t) => t.completed).length,
      totalCount: tasks.length,
      allComplete,
      remainingMinutes: tasks.filter((t) => !t.completed).reduce((s, t) => s + t.minutes, 0),
      streak: streakResult,
      missionComplete: allComplete,
    });
  } catch (err) {
    console.error("[student/ielts-mission POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update task" },
      { status: 500 }
    );
  }
}
