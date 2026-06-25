/**
 * Legacy re-export — Pathway skill % logic lives in @/lib/programs/pathway/skillProgress.
 * IELTS band conversion lives in @/lib/programs/ielts/engine only.
 */
export {
  computePathwaySkillPercents,
  averageSkillProgress,
} from "@/lib/programs/pathway/skillProgress";

export type { SkillProgressMap as PathwaySkillPercents } from "@/lib/programs/types";
