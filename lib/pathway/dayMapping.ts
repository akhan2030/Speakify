import type { PathwayDayType } from "@/lib/pathway/dayStructure";

export const DAY_QUERY_TO_TYPE: Record<string, PathwayDayType> = {
  monday: "input",
  tuesday: "practice",
  wednesday: "application",
  thursday: "review",
  friday: "assessment",
  input: "input",
  practice: "practice",
  application: "application",
  review: "review",
  assessment: "assessment",
};

export function resolveDayType(dayParam: string | null | undefined): PathwayDayType | null {
  if (!dayParam) return null;
  return DAY_QUERY_TO_TYPE[dayParam.toLowerCase()] ?? null;
}

export function dayTypeToQuery(dayType: PathwayDayType): string {
  const map: Record<PathwayDayType, string> = {
    input: "monday",
    practice: "tuesday",
    application: "wednesday",
    review: "thursday",
    assessment: "friday",
  };
  return map[dayType];
}

export function weekDayKey(week: number, dayType: PathwayDayType) {
  return `week-${week}-${dayType}`;
}
