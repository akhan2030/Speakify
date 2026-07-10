import {
  PRACTICE_SKILLS,
  getTodayDateKey,
} from "@/lib/dailyPractice/ensureSkillCoverage";
import { parseDailyPracticeProgramme } from "@/lib/dailyPractice/programme";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { getMissionTasksForDay } from "@/lib/ielts/missionTasks";
import { getGeneralMissionTasksForDay } from "@/lib/ielts-general/missionTasks";
import { getStudyDay } from "@/lib/ielts/studyWeek";
import { getProfileAcceleratorTrack } from "@/lib/course/studentProfile";
import {
  missionTaskKey,
  todayDateKey,
} from "@/lib/ielts/missionKeys";
import { updateStudyStreak } from "@/lib/ielts/updateStudyStreak";

export const DAILY_PRACTICE_TOTAL = PRACTICE_SKILLS.length;

export function dailyPracticeTaskKey(programme, dateKey, taskId) {
  return `dp::${programme}::${dateKey}::${taskId}`;
}

export function parseDailyPracticeTaskKey(key) {
  const parts = String(key ?? "").split("::");
  if (parts[0] !== "dp" || parts.length < 4) return null;
  return {
    programme: parts[1],
    dateKey: parts[2],
    taskId: parts.slice(3).join("::"),
  };
}

export async function fetchDailyPracticeCompletions(
  supabase,
  studentId,
  programme,
  dateKey
) {
  const prefix = `dp::${programme}::${dateKey}::`;
  const { data, error } = await supabase
    .from("daily_task_completions")
    .select("task_id, completed_at, time_spent_minutes")
    .eq("student_id", studentId)
    .like("task_id", `${prefix}%`);

  if (error) {
    console.warn("[dailyPractice/completions] fetch:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    taskId: row.task_id.slice(prefix.length),
    completedAt: row.completed_at,
    timeSpentMinutes: row.time_spent_minutes,
  }));
}

export function attachPracticeCompletion(tasks, completedTaskIds) {
  const done = new Set(completedTaskIds);
  return tasks.map((task) => ({
    ...task,
    completed: done.has(task.id),
  }));
}

export function pickNextDailyPracticeTask(tasks, completedTaskIds) {
  const done = new Set(completedTaskIds);
  return tasks.find((task) => !done.has(task.id)) ?? null;
}

async function syncMissionDailyPracticeCheckbox(
  supabase,
  studentId,
  programme,
  profile
) {
  const dateKey = todayDateKey();
  const studyDay = getStudyDay();
  const trackId = getProfileAcceleratorTrack(profile);
  const missionTasks =
    programme === "ielts_general"
      ? getGeneralMissionTasksForDay(studyDay)
      : getMissionTasksForDay(studyDay, trackId);
  const missionItem = missionTasks.find((t) => t.id === "daily-practice");
  if (!missionItem) return;

  const fullKey = missionTaskKey(dateKey, missionItem.id);
  const { data: existing } = await supabase
    .from("daily_task_completions")
    .select("id")
    .eq("student_id", studentId)
    .eq("task_id", fullKey)
    .maybeSingle();

  if (existing) return;

  await supabase.from("daily_task_completions").insert({
    student_id: studentId,
    task_id: fullKey,
    task_type: missionItem.taskType,
    day_of_week: studyDay,
    time_spent_minutes: missionItem.minutes,
  });
}

export async function markDailyPracticeTaskComplete({
  supabase,
  studentId,
  programme,
  taskId,
  timeSpentMinutes = 10,
  taskMeta = null,
}) {
  const parsedProgramme = parseDailyPracticeProgramme(programme);
  const dateKey = getTodayDateKey();
  const fullKey = dailyPracticeTaskKey(parsedProgramme, dateKey, taskId);

  const { data: existing } = await supabase
    .from("daily_task_completions")
    .select("id")
    .eq("student_id", studentId)
    .eq("task_id", fullKey)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await supabase
      .from("daily_task_completions")
      .insert({
        student_id: studentId,
        task_id: fullKey,
        task_type: "daily_practice",
        day_of_week: new Date().getUTCDay(),
        time_spent_minutes: Number(timeSpentMinutes) || 10,
      });

    if (insertError) {
      throw insertError;
    }
  }

  const streakResult = await updateStudyStreak(
    supabase,
    studentId,
    Number(timeSpentMinutes) || taskMeta?.estimated_minutes || 10
  );

  const completedRows = await fetchDailyPracticeCompletions(
    supabase,
    studentId,
    parsedProgramme,
    dateKey
  );
  const completedTaskIds = completedRows.map((row) => row.taskId);
  const completedCount = completedTaskIds.length;
  const allComplete = completedCount >= DAILY_PRACTICE_TOTAL;

  if (allComplete) {
    const profile = await fetchStudentProfile(studentId);
    await syncMissionDailyPracticeCheckbox(
      supabase,
      studentId,
      parsedProgramme,
      profile
    );
  }

  return {
    dateKey,
    programme: parsedProgramme,
    completedTaskIds,
    completedCount,
    totalCount: DAILY_PRACTICE_TOTAL,
    allComplete,
    streak: streakResult,
  };
}

export async function loadDailyPracticeProgress({
  supabase,
  studentId,
  programme,
  tasks = null,
}) {
  const parsedProgramme = parseDailyPracticeProgramme(programme);
  const dateKey = getTodayDateKey();
  const completedRows = await fetchDailyPracticeCompletions(
    supabase,
    studentId,
    parsedProgramme,
    dateKey
  );
  const completedTaskIds = completedRows.map((row) => row.taskId);
  const completedCount = completedTaskIds.length;
  const totalCount = DAILY_PRACTICE_TOTAL;

  let taskList = tasks;
  if (!taskList) {
    taskList = [];
  }

  const tasksWithStatus = attachPracticeCompletion(taskList, completedTaskIds);
  const nextTask = pickNextDailyPracticeTask(taskList, completedTaskIds);

  return {
    dateKey,
    programme: parsedProgramme,
    completedTaskIds,
    completedCount,
    totalCount,
    allComplete: completedCount >= totalCount && totalCount > 0,
    tasksWithStatus,
    nextTask,
  };
}
