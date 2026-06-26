import type { ProgramTerminology } from "@/lib/programs/terminology";
import type { PathwayLevelId, PathwaySkill } from "@/lib/programs/terminology";

export type ProgramKind =
  | "pathway"
  | "ielts"
  | "toefl"
  | "business_english"
  | "legal_english"
  | "kids_english";

export type SkillUnit = {
  id: string;
  title: string;
  level: string;
  week: number;
  minutes: number;
  objective: string;
  instructions: string;
};

export type RecommendedFocus = {
  skill: PathwaySkill;
  label: string;
  reason: string;
};

export type SkillProgressMap = Record<PathwaySkill, number>;

/** Each program owns its own content engine — never mix IELTS logic into Pathway. */
export type ProgramContentEngine = {
  programType: ProgramKind;
  terminology: ProgramTerminology;
  getSkillUnits: (
    levelId: PathwayLevelId,
    skill: PathwaySkill,
    week?: number
  ) => SkillUnit[];
  getDefaultSkillProgress: (levelId: PathwayLevelId) => SkillProgressMap;
  getRecommendedFocus: (
    levelId: PathwayLevelId,
    week: number,
    skillProgress: Partial<SkillProgressMap>
  ) => RecommendedFocus;
  getGraduationReadiness: (skillProgress: SkillProgressMap) => number;
  /** CEFR skill % for Pathway; band-derived metrics only for IELTS engine. */
  computeSkillPercents: (input: Record<string, unknown>) => SkillProgressMap;
};
