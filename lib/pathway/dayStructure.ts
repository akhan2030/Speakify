export type PathwayDayType =
  | "input"
  | "practice"
  | "application"
  | "review"
  | "assessment";

export type PathwayDayTemplate = {
  dayType: PathwayDayType;
  dayName: string;
  dayLabel: string;
  icon: string;
  theme: string;
  contentBadge: "new" | "review";
  skill: string;
  defaultMinutes: number;
};

export const PATHWAY_DAYS: PathwayDayTemplate[] = [
  {
    dayType: "input",
    dayName: "Monday",
    dayLabel: "Input Day",
    icon: "📖",
    theme: "grammar + vocabulary introduction",
    contentBadge: "new",
    skill: "grammar",
    defaultMinutes: 45,
  },
  {
    dayType: "practice",
    dayName: "Tuesday",
    dayLabel: "Practice Day",
    icon: "✏️",
    theme: "exercises + listening",
    contentBadge: "new",
    skill: "listening",
    defaultMinutes: 45,
  },
  {
    dayType: "application",
    dayName: "Wednesday",
    dayLabel: "Application Day",
    icon: "🗣️",
    theme: "speaking + writing task",
    contentBadge: "new",
    skill: "speaking",
    defaultMinutes: 50,
  },
  {
    dayType: "review",
    dayName: "Thursday",
    dayLabel: "Review Day",
    icon: "🔄",
    theme: "spaced repetition",
    contentBadge: "review",
    skill: "general",
    defaultMinutes: 40,
  },
  {
    dayType: "assessment",
    dayName: "Friday",
    dayLabel: "Assessment Day",
    icon: "📝",
    theme: "weekly quiz",
    contentBadge: "new",
    skill: "general",
    defaultMinutes: 45,
  },
];

export function getDayTemplate(dayType: string): PathwayDayTemplate | undefined {
  return PATHWAY_DAYS.find((d) => d.dayType === dayType);
}

export function defaultLessonTitle(
  day: PathwayDayTemplate,
  weekNumber: number,
  focusAreas: string
): string {
  const focus = focusAreas.split(",")[0]?.trim() || "Core skills";
  const titles: Record<PathwayDayType, string> = {
    input: `Week ${weekNumber}: ${focus} — grammar & vocabulary`,
    practice: `Week ${weekNumber}: Guided practice & listening`,
    application: `Week ${weekNumber}: Speaking & writing application`,
    review: `Week ${weekNumber}: 30% revisit — mixed skills review`,
    assessment: `Week ${weekNumber}: Weekly progress quiz`,
  };
  return titles[day.dayType];
}
