import { ieltsEngine } from "@/lib/programs/ielts/engine";
import { pathwayEngine } from "@/lib/programs/pathway/engine";
import { getProgramTerminology } from "@/lib/programs/terminology";
import type { ProgramKind, ProgramContentEngine } from "@/lib/programs/types";

export type { ProgramKind, ProgramContentEngine, SkillUnit, SkillProgressMap } from "@/lib/programs/types";
export { pathwayEngine, getPathwayDashboardPayload, pathwaySkillHref } from "@/lib/programs/pathway/engine";
export { ieltsEngine } from "@/lib/programs/ielts/engine";
export { computePathwaySkillPercents } from "@/lib/programs/pathway/skillProgress";

const ENGINES: Record<ProgramKind, ProgramContentEngine> = {
  pathway: pathwayEngine,
  ielts: ieltsEngine,
  toefl: {
    ...pathwayEngine,
    programType: "toefl",
    terminology: getProgramTerminology("toefl"),
  },
  business_english: {
    ...pathwayEngine,
    programType: "business_english",
    terminology: getProgramTerminology("business_english"),
  },
};

export function normalizeProgramKind(value: unknown): ProgramKind {
  const raw = String(value ?? "pathway")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (raw === "english_pathway" || raw === "pathway") return "pathway";
  if (raw === "ielts" || raw === "ielts_accelerator") return "ielts";
  if (raw === "toefl" || raw === "toefl_accelerator") return "toefl";
  if (raw === "business_english" || raw === "business") return "business_english";
  return "pathway";
}

/** Route content requests to the correct program engine. */
export function getContentEngine(programType: unknown): ProgramContentEngine {
  return ENGINES[normalizeProgramKind(programType)] ?? pathwayEngine;
}
