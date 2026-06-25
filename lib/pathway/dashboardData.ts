import { CEFR_SUB_LEVELS, getNextLevelSlug } from "@/lib/course/cefrLevels";
import { computePathwaySkillPercents } from "@/lib/programs/pathway/skillProgress";
import { normalizeCefrCode } from "@/lib/pathway/levelDisplay";

export const WEEKLY_FOCUS = [
  { key: "grammar", label: "Grammar focus this week", detail: "Present perfect vs past simple" },
  { key: "vocabulary", label: "Vocabulary target", detail: "15 new words" },
  { key: "speaking", label: "Speaking task", detail: "Describe a daily routine (2 min)" },
  { key: "writing", label: "Writing task", detail: "Write a 120-word email" },
];

export function levelProgressPercent(currentWeek: number, weekCount: number) {
  const w = currentWeek || 1;
  const total = weekCount || 4;
  return Math.min(100, Math.round((w / total) * 100));
}

export function assessmentInfo(
  currentWeek: number,
  weekCount: number,
  levelCode: string
) {
  const week = currentWeek || 1;
  const total = weekCount || 4;
  const midWeek = Math.max(2, Math.ceil(total / 2));

  if (week < midWeek) {
    return {
      title: `Mid-Level Assessment — Week ${week} of ${total}`,
      subtitle: `Your ${levelCode} mid-level check opens at week ${midWeek}`,
      progress: Math.round((week / midWeek) * 100),
      type: "mid-level" as const,
    };
  }

  const daysUntilGrad = Math.max(0, (total - week) * 7 + (7 - new Date().getDay()));
  return {
    title: "Level Graduation Test",
    subtitle: `Unlocks in ${daysUntilGrad} day${daysUntilGrad === 1 ? "" : "s"}`,
    progress: levelProgressPercent(week, total),
    type: "graduation" as const,
  };
}

export function buildMilestones(
  levels: Array<{ code: string; name?: string; status: string }>,
  currentCode: string
) {
  const codes = ["A1.1", "A1.2", "B1.1", "B1.2", "B2.1"];
  return codes.map((code) => {
    const match = levels.find((l) => l.code === code);
    const meta = CEFR_SUB_LEVELS.find((l) => l.code === code);
    let status = match?.status ?? "locked";
    if (!match && code === currentCode) status = "active";
    return {
      code,
      name: match?.name ?? meta?.name ?? code,
      status: status as "completed" | "active" | "locked",
    };
  });
}

export function resolveNextLevel(currentCode: string) {
  const normalized = normalizeCefrCode(currentCode);
  const currentMeta =
    CEFR_SUB_LEVELS.find((l) => l.code === normalized) ?? CEFR_SUB_LEVELS[4];
  const nextSlug = getNextLevelSlug(currentMeta.slug);
  const nextMeta = nextSlug
    ? CEFR_SUB_LEVELS.find((l) => l.slug === nextSlug)
    : null;
  return { currentMeta, nextMeta };
}

export function buildSkillPercents(
  progressJson: Record<string, unknown>,
  grammarJson: Record<string, unknown>
) {
  return computePathwaySkillPercents({
    grammar: grammarJson as Parameters<typeof computePathwaySkillPercents>[0]["grammar"],
    vocabulary: progressJson.vocabulary as Parameters<
      typeof computePathwaySkillPercents
    >[0]["vocabulary"],
    reading: progressJson.reading as Parameters<
      typeof computePathwaySkillPercents
    >[0]["reading"],
    listening: progressJson.listening as Parameters<
      typeof computePathwaySkillPercents
    >[0]["listening"],
    speaking: progressJson.speaking as Parameters<
      typeof computePathwaySkillPercents
    >[0]["speaking"],
    writing: progressJson.writing as Parameters<
      typeof computePathwaySkillPercents
    >[0]["writing"],
  });
}
