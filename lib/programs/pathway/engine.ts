import {
  defaultSkillProgress,
  getPathwaySkillUnits,
  getRecommendedFocus,
} from "@/lib/pathway/curriculumContent";
import {
  getProgramTerminology,
  type PathwayLevelId,
  type PathwaySkill,
} from "@/lib/programs/terminology";
import type { ProgramContentEngine, SkillProgressMap } from "@/lib/programs/types";
import {
  averageSkillProgress,
  computePathwaySkillPercents,
} from "@/lib/programs/pathway/skillProgress";

export const pathwayEngine: ProgramContentEngine = {
  programType: "pathway",
  terminology: getProgramTerminology("pathway"),

  getSkillUnits(levelId, skill, week) {
    return getPathwaySkillUnits(levelId, skill, week);
  },

  getDefaultSkillProgress(levelId) {
    return defaultSkillProgress(levelId);
  },

  getRecommendedFocus(levelId, week, skillProgress) {
    return getRecommendedFocus(levelId, week, skillProgress);
  },

  getGraduationReadiness(skillProgress) {
    return averageSkillProgress(skillProgress);
  },

  computeSkillPercents(input) {
    return computePathwaySkillPercents(input as Parameters<typeof computePathwaySkillPercents>[0]);
  },
};

export function getPathwayDashboardPayload(input: {
  levelId: PathwayLevelId;
  week: number;
  weekCount?: number;
  todayTasks?: Array<{ completed?: boolean }>;
  streak?: { current_streak?: number } | null;
}) {
  const weekCount = input.weekCount ?? 5;
  const skillProgress = defaultSkillProgress(input.levelId);
  const missionTotal = 5;
  const missionCompleted =
    input.todayTasks?.filter((t) => t.completed)?.length ?? 0;

  return {
    programType: "english_pathway" as const,
    levelId: input.levelId,
    week: input.week,
    weekCount,
    skillProgress,
    graduationReadiness: averageSkillProgress(skillProgress),
    recommendedFocus: getRecommendedFocus(input.levelId, input.week, skillProgress),
    missionCompleted,
    missionTotal,
    streak: input.streak?.current_streak ?? 0,
    terminology: pathwayEngine.terminology,
  };
}

export function pathwaySkillHref(skill: PathwaySkill): string {
  return `/dashboard/pathway/student/${skill}`;
}
