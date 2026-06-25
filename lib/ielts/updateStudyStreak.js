import { getMissionTasksForDay } from "@/lib/ielts/missionTasks";
import {
  missionTaskKey,
  parseMissionTaskKey,
  todayDateKey,
  yesterdayDateKey,
} from "@/lib/ielts/missionKeys";

export async function updateStudyStreak(supabase, studentId, timeSpentMinutes = 0) {
  const today = todayDateKey();
  const { data: row, error: fetchError } = await supabase
    .from("study_streaks")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.warn("[updateStudyStreak] fetch:", fetchError.message);
  }

  let currentStreak = row?.current_streak ?? 0;
  let longestStreak = row?.longest_streak ?? 0;
  let totalStudyDays = row?.total_study_days ?? 0;
  let totalHours = Number(row?.total_hours ?? 0);
  const lastStudyDate = row?.last_study_date ?? null;
  const hoursDelta = (Number(timeSpentMinutes) || 0) / 60;

  if (lastStudyDate !== today) {
    totalStudyDays += 1;
    if (lastStudyDate === yesterdayDateKey()) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  totalHours = Math.round((totalHours + hoursDelta) * 10) / 10;

  const payload = {
    student_id: studentId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_study_date: today,
    total_study_days: totalStudyDays,
    total_hours: totalHours,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from("study_streaks")
    .upsert(payload, { onConflict: "student_id" });

  if (upsertError) {
    console.warn("[updateStudyStreak] upsert:", upsertError.message);
    return { currentStreak, longestStreak, streakUpdated: false };
  }

  return {
    currentStreak,
    longestStreak,
    totalStudyDays,
    totalHours,
    streakUpdated: true,
  };
}

export async function fetchCompletionsForRange(supabase, studentId, startDate, endDate) {
  const { data, error } = await supabase
    .from("daily_task_completions")
    .select("task_id, completed_at, time_spent_minutes, day_of_week, task_type")
    .eq("student_id", studentId)
    .gte("completed_at", `${startDate}T00:00:00`)
    .lte("completed_at", `${endDate}T23:59:59`);

  if (error) {
    console.warn("[fetchCompletionsForRange]", error.message);
    return [];
  }
  return data ?? [];
}

export function completionsSetForDate(completions, dateKey) {
  const ids = new Set();
  for (const row of completions) {
    const parsed = parseMissionTaskKey(row.task_id);
    const rowDate = parsed.dateKey ?? String(row.completed_at).slice(0, 10);
    if (rowDate === dateKey) ids.add(row.task_id);
  }
  return ids;
}

export function dayCompletionStatus(dateKey, studyDay, completedIds) {
  const tasks = getMissionTasksForDay(studyDay);
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

export function attachTaskCompletion(tasks, dateKey, completedIds) {
  return tasks.map((task) => ({
    ...task,
    missionKey: missionTaskKey(dateKey, task.id),
    completed: completedIds.has(missionTaskKey(dateKey, task.id)),
  }));
}

export { parseMissionTaskKey, missionTaskKey };
