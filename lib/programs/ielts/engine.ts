import { getProgramTerminology } from "@/lib/programs/terminology";
import type { PathwayLevelId, PathwaySkill } from "@/lib/programs/terminology";
import type { ProgramContentEngine, SkillProgressMap, SkillUnit } from "@/lib/programs/types";

function bandToPercent(band: number | null | undefined): number {
  if (band == null || !Number.isFinite(band)) return 0;
  return Math.min(100, Math.round((band / 9) * 100));
}

const emptySkills = (): SkillProgressMap => ({
  grammar: 0,
  vocabulary: 0,
  reading: 0,
  listening: 0,
  speaking: 0,
  writing: 0,
  pronunciation: 0,
});

/** IELTS Accelerator engine — band scores, mock exams, task types. */
export const ieltsEngine: ProgramContentEngine = {
  programType: "ielts",
  terminology: getProgramTerminology("ielts"),

  getSkillUnits(_levelId, _skill, _week): SkillUnit[] {
    return [];
  },

  getDefaultSkillProgress(_levelId) {
    return emptySkills();
  },

  getRecommendedFocus(_levelId, _week, _skillProgress) {
    return {
      skill: "speaking" as PathwaySkill,
      label: "Speaking Part 2 practice",
      reason: "Lowest estimated band score this week.",
    };
  },

  getGraduationReadiness(skillProgress) {
    const values = Object.values(skillProgress).filter((v) => v > 0);
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  },

  computeSkillPercents(input) {
    const speaking = input.speaking as { band?: number } | undefined;
    const writing = input.writing as { band?: number } | undefined;
    return {
      ...emptySkills(),
      reading: bandToPercent((input.reading as { band?: number })?.band),
      listening: bandToPercent((input.listening as { band?: number })?.band),
      speaking: bandToPercent(speaking?.band),
      writing: bandToPercent(writing?.band),
    };
  },
};

export function ieltsDashboardPath(): string {
  return "/dashboard/ielts/student";
}
