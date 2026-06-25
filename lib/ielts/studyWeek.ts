export type StudyDay =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export const STUDY_DAYS: StudyDay[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const STUDY_DAY_LABELS: Record<StudyDay, string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

export const STUDY_DAY_FULL: Record<StudyDay, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export function getStudyDay(date = new Date()): StudyDay {
  const days: StudyDay[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
}

export function getDaySubtitle(day: StudyDay): string {
  const subtitles: Record<StudyDay, string> = {
    sunday: "Start fresh — vocabulary + grammar foundations",
    monday: "IELTS strategy + skill input",
    tuesday: "IELTS practice tasks",
    wednesday: "Full IELTS task — Writing or Speaking",
    thursday: "Weak area review + vocabulary",
    friday: "Mini IELTS mock — 1 section",
    saturday: "Review week + prepare for Sunday",
  };
  return subtitles[day];
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatFullDate(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysUntilExam(examDate: string | null | undefined): number | null {
  if (!examDate) return null;
  const exam = new Date(`${examDate}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : 0;
}

export function getStreakMotivation(streak: number): string {
  if (streak >= 30) return "30 days — this is what Band 7 students do";
  if (streak >= 21) return "Three weeks — elite preparation";
  if (streak >= 14) return "Two weeks — this is becoming automatic";
  if (streak >= 7) return "One week strong — you are in the habit";
  if (streak >= 3) return "Building momentum — keep going";
  return "Start your streak today — one task is enough";
}

export type WeekCalendarDay = {
  day: StudyDay;
  label: string;
  status: "studied" | "missed" | "today" | "future";
};

export function buildStudyWeekCalendar(
  studiedDates: Set<string>,
  today = new Date()
): WeekCalendarDay[] {
  const todayKey = today.toISOString().slice(0, 10);
  const dayIndex = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayIndex);

  return STUDY_DAYS.map((day, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const dateKey = d.toISOString().slice(0, 10);
    let status: WeekCalendarDay["status"] = "missed";
    if (dateKey === todayKey) status = "today";
    else if (d > today) status = "future";
    else if (studiedDates.has(dateKey)) status = "studied";
    return { day, label: STUDY_DAY_LABELS[day], status };
  });
}

export function getTomorrowDay(today: StudyDay): StudyDay {
  const idx = STUDY_DAYS.indexOf(today);
  return STUDY_DAYS[(idx + 1) % 7];
}

export function getRecommendedMockDay(today: StudyDay): string {
  if (today === "friday" || today === "saturday" || today === "sunday") {
    return "This Friday";
  }
  return "This Friday";
}

export type StudyWeekDate = {
  day: StudyDay;
  dateKey: string;
  label: string;
  fullLabel: string;
};

export function getStudyWeekDates(referenceDate = new Date()): StudyWeekDate[] {
  const today = new Date(referenceDate);
  today.setHours(12, 0, 0, 0);
  const dayIndex = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayIndex);

  return STUDY_DAYS.map((day, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return {
      day,
      dateKey: d.toISOString().slice(0, 10),
      label: STUDY_DAY_LABELS[day],
      fullLabel: STUDY_DAY_FULL[day],
    };
  });
}

export function getNextStudyWeekDates(referenceDate = new Date()): StudyWeekDate[] {
  const next = new Date(referenceDate);
  next.setDate(next.getDate() + 7);
  return getStudyWeekDates(next);
}

export function dateKeyToStudyDay(dateKey: string): StudyDay {
  const d = new Date(`${dateKey}T12:00:00`);
  return getStudyDay(d);
}
