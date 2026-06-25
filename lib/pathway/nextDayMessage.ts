import { PATHWAY_DAYS, type PathwayDayType } from "@/lib/pathway/dayStructure";

export function getNextDayEncouragement(dayType: PathwayDayType): string | null {
  const idx = PATHWAY_DAYS.findIndex((d) => d.dayType === dayType);
  if (idx < 0 || idx >= PATHWAY_DAYS.length - 1) {
    return "Well done! You finished this week's pathway lessons.";
  }
  const next = PATHWAY_DAYS[idx + 1];
  return `Well done! Come back tomorrow for ${next.dayName} ${next.dayLabel}.`;
}
