import type { StudentProfile } from "@/lib/course/studentProfile";
import type { ReadinessMeterData } from "@/lib/course/readinessMeter";
import { cefrCodeToSlug } from "@/lib/pathway/levelDisplay";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  monday: "Input Day — grammar & vocabulary",
  tuesday: "Practice Day — exercises & listening",
  wednesday: "Application Day — speaking & writing",
  thursday: "Review Day — 30% revisit",
  friday: "Assessment Day — weekly quiz",
};

export type DailyTask = {
  id: string;
  day: (typeof DAYS)[number];
  label: string;
  href: string;
  estimatedMinutes: number;
  completed: boolean;
  isToday: boolean;
  isPriority: boolean;
};

export type WeeklySchedule = {
  levelSlug: string;
  levelName: string;
  currentWeek: number;
  todayPriority: DailyTask | null;
  tasks: DailyTask[];
  targetDate: string | null;
  weakestSkill: string | null;
};

function todayDayIndex() {
  const d = new Date().getDay();
  if (d === 0 || d === 6) return 0;
  return d - 1;
}

export function buildWeeklySchedule(input: {
  profile: StudentProfile;
  meter: ReadinessMeterData;
  cefrLevel: string;
  currentWeek?: number;
  weeklyScores?: Record<string, { completed?: boolean }>;
}): WeeklySchedule {
  const slug = cefrCodeToSlug(input.cefrLevel);
  const week = input.currentWeek ?? 1;
  const todayIdx = todayDayIndex();

  const weakest = [...input.meter.skills]
    .filter((s) => s.band != null)
    .sort((a, b) => a.percent - b.percent)[0];

  const tasks: DailyTask[] = DAYS.map((day, i) => {
    const dayType = ["input", "practice", "application", "review", "assessment"][i];
    const key = `week-${week}-${dayType}`;
    const completed = Boolean(input.weeklyScores?.[key]?.completed);
    const href = `/dashboard/student/pathway/${slug}/lesson?week=${week}&day=${day}`;
    return {
      id: key,
      day,
      label: DAY_LABELS[day],
      href,
      estimatedMinutes: day === "friday" ? 30 : day === "wednesday" ? 50 : 45,
      completed,
      isToday: i === todayIdx,
      isPriority: weakest?.skill === "grammar" ? day === "monday" : i === todayIdx,
    };
  });

  const todayPriority =
    tasks.find((t) => t.isToday && !t.completed) ??
    tasks.find((t) => !t.completed) ??
    null;

  if (todayPriority) todayPriority.isPriority = true;

  return {
    levelSlug: slug,
    levelName: input.cefrLevel,
    currentWeek: week,
    todayPriority,
    tasks,
    targetDate: input.meter.projectedAchievement?.projectedDateLabel ?? null,
    weakestSkill: weakest?.label ?? null,
  };
}
