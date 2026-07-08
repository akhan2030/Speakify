export type ProgramKind =
  | "ielts"
  | "pathway"
  | "toefl"
  | "business_english"
  | "legal_english"
  | "kids_english";

export type ProgramTerminology = {
  programName: string;
  currentLevelLabel: string;
  progressLabel: string;
  readinessLabel: string;
  assessmentLabel: string;
  progressCheckLabel: string;
  missionLabel: string;
  trackLabel: string;
};

export const PROGRAM_TERMINOLOGY: Record<ProgramKind, ProgramTerminology> = {
  pathway: {
    programName: "English Pathway",
    currentLevelLabel: "Current CEFR Level",
    progressLabel: "Skill Progress",
    readinessLabel: "Level Readiness",
    assessmentLabel: "Graduation Assessment",
    progressCheckLabel: "Progress Check",
    missionLabel: "Today's Mission",
    trackLabel: "My Pathway",
  },
  ielts: {
    programName: "IELTS Academic Accelerator",
    currentLevelLabel: "Current Track",
    progressLabel: "Band Estimate",
    readinessLabel: "IELTS Readiness",
    assessmentLabel: "Mock Exam",
    progressCheckLabel: "Skill Check",
    missionLabel: "Today's Mission",
    trackLabel: "Accelerator Track",
  },
  toefl: {
    programName: "TOEFL Accelerator",
    currentLevelLabel: "Current Stage",
    progressLabel: "Section Scores",
    readinessLabel: "TOEFL Readiness",
    assessmentLabel: "Full Practice Test",
    progressCheckLabel: "Section Check",
    missionLabel: "Today's Mission",
    trackLabel: "Study Track",
  },
  business_english: {
    programName: "Business English",
    currentLevelLabel: "Current Module",
    progressLabel: "Communication Goals",
    readinessLabel: "Workplace Readiness",
    assessmentLabel: "Practical Assessment",
    progressCheckLabel: "Skills Check",
    missionLabel: "Today's Mission",
    trackLabel: "My Programme",
  },
  legal_english: {
    programName: "Legal English",
    currentLevelLabel: "Current Module",
    progressLabel: "Legal Skills",
    readinessLabel: "Professional Readiness",
    assessmentLabel: "Case Assessment",
    progressCheckLabel: "Skills Check",
    missionLabel: "Today's Mission",
    trackLabel: "My Programme",
  },
  kids_english: {
    programName: "Kids English",
    currentLevelLabel: "Current Unit",
    progressLabel: "Learning Fun",
    readinessLabel: "Level Readiness",
    assessmentLabel: "Show What You Know",
    progressCheckLabel: "Fun Check",
    missionLabel: "Today's Adventure",
    trackLabel: "My Learning Path",
  },
};

export function getProgramTerminology(programType: unknown): ProgramTerminology {
  const raw = String(programType ?? "pathway")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (raw === "english_pathway" || raw === "pathway") {
    return PROGRAM_TERMINOLOGY.pathway;
  }
  const key = raw as ProgramKind;
  return PROGRAM_TERMINOLOGY[key] ?? PROGRAM_TERMINOLOGY.pathway;
}

export const PATHWAY_SKILLS = [
  "grammar",
  "vocabulary",
  "reading",
  "listening",
  "speaking",
  "writing",
  "pronunciation",
] as const;

export type PathwaySkill = (typeof PATHWAY_SKILLS)[number];

export const PATHWAY_LEVEL_IDS = [
  "a1_1",
  "a1_2",
  "a2_1",
  "a2_2",
  "b1_1",
  "b1_2",
  "b2_1",
  "b2_2",
  "c1_1",
  "c1_2",
] as const;

export type PathwayLevelId = (typeof PATHWAY_LEVEL_IDS)[number];

export const PATHWAY_LEVEL_NAMES: Record<PathwayLevelId, string> = {
  a1_1: "A1.1 Foundation I",
  a1_2: "A1.2 Foundation II",
  a2_1: "A2.1 Elementary I",
  a2_2: "A2.2 Elementary II",
  b1_1: "B1.1 Intermediate I",
  b1_2: "B1.2 Intermediate II",
  b2_1: "B2.1 Upper-Int I",
  b2_2: "B2.2 Upper-Int II",
  c1_1: "C1.1 Advanced I",
  c1_2: "C1.2 Advanced II",
};

export function normalizePathwayLevelId(value: unknown): PathwayLevelId {
  const raw = String(value ?? "b1_1")
    .trim()
    .toLowerCase()
    .replace(/\./g, "_")
    .replace(/-/g, "_");
  if ((PATHWAY_LEVEL_IDS as readonly string[]).includes(raw)) {
    return raw as PathwayLevelId;
  }
  return "b1_1";
}

export function levelCodeFromId(levelId: PathwayLevelId): string {
  return levelId.replace("_", ".").toUpperCase();
}
