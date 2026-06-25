import type { Answer, PlacementResult, TestState } from "./types";

export type CefrMapping = {
  cefr: string;
  label: string;
};

export function bandToCefr(band: number): CefrMapping {
  if (band < 4.0) return { cefr: "A1", label: "Beginner" };
  if (band < 4.5) return { cefr: "A2", label: "Elementary" };
  if (band < 5.0) return { cefr: "B1", label: "Pre-Intermediate" };
  if (band < 6.0) return { cefr: "B1+", label: "Intermediate" };
  if (band < 7.0) return { cefr: "B2", label: "Upper-Intermediate" };
  if (band < 8.0) return { cefr: "C1", label: "Advanced" };
  return { cefr: "C2", label: "Mastery" };
}

export function roundToHalfBand(band: number): number {
  return Math.round(band * 2) / 2;
}

export function clampBand(band: number, min = 3.5, max = 8.5): number {
  return Math.min(max, Math.max(min, band));
}

export type RecommendedCourse = {
  name: string;
  description: string;
};

export function getRecommendedCourse(band: number): RecommendedCourse {
  const b = roundToHalfBand(band);
  if (b < 5.5) {
    return {
      name: "Speakify Foundation Track",
      description:
        "6-week core build: vocabulary, grammar foundations, and basic IELTS skills for bands below 5.5.",
    };
  }
  if (b < 7.0) {
    return {
      name: "Speakify Plus Track",
      description:
        "6-week intermediate IELTS prep: essay structure, listening strategies, and speaking fluency for bands 5.5–7.0.",
    };
  }
  return {
    name: "Speakify Elite Track",
    description:
      "4-week intensive accelerator: timed tasks, advanced writing, and mock sections for bands 7.0+.",
  };
}

export type StudyWeek = {
  week: number;
  focus: string;
  activities: string[];
};

export function generateStudyPlan(result: PlacementResult): StudyWeek[] {
  const weak = new Set(result.weakAreas.map((w) => w.toLowerCase()));
  const weeks: StudyWeek[] = [];
  const focusCycle = [
    weak.has("vocabulary") || weak.has("lexical resource")
      ? "Academic vocabulary & collocations"
      : "Vocabulary maintenance",
    weak.has("grammar") || weak.has("grammatical range")
      ? "Grammar accuracy & complex structures"
      : "Grammar consolidation",
    weak.has("reading") ? "Reading speed & inference" : "Reading practice",
    weak.has("listening") ? "Listening prediction & note-taking" : "Listening drills",
    weak.has("writing") || weak.has("writing_prompt")
      ? "Writing Task 1 & 2 structure"
      : "Writing refinement",
    "Full mock + error log review",
    "Speaking fluency & pronunciation",
    "Mixed skills integration",
  ];

  for (let w = 1; w <= 13; w++) {
    const focus = focusCycle[(w - 1) % focusCycle.length];
    weeks.push({
      week: w,
      focus: `Week ${w}: ${focus}`,
      activities: [
        `3× ${focus.toLowerCase()} sessions (45 min)`,
        "1× timed mini-mock section",
        w % 4 === 0 ? "Review Saudi-specific error log" : "Flashcard / phrase bank review",
      ],
    });
  }

  return weeks;
}

export function computeSkillBands(answers: Answer[]): Record<string, number> {
  const bySection: Record<string, { correct: number; total: number; bandSum: number }> =
    {};

  for (const a of answers) {
    if (!bySection[a.section]) {
      bySection[a.section] = { correct: 0, total: 0, bandSum: 0 };
    }
    bySection[a.section].total += 1;
    bySection[a.section].bandSum += a.band;
    if (a.correct) bySection[a.section].correct += 1;
  }

  const skillBands: Record<string, number> = {};
  for (const [section, stats] of Object.entries(bySection)) {
    const accuracy = stats.total ? stats.correct / stats.total : 0;
    const avgBand = stats.total ? stats.bandSum / stats.total : 5.0;
    skillBands[section] = roundToHalfBand(
      clampBand(avgBand + (accuracy - 0.5) * 1.5)
    );
  }
  return skillBands;
}

export function identifyStrengthsWeaknesses(
  skillBands: Record<string, number>,
  overallBand: number
): { weakAreas: string[]; strongAreas: string[] } {
  const weakAreas: string[] = [];
  const strongAreas: string[] = [];

  for (const [section, band] of Object.entries(skillBands)) {
    const label =
      section === "writing_prompt" ? "writing" : section.replace("_", " ");
    if (band < overallBand - 0.5) weakAreas.push(label);
    if (band >= overallBand + 0.5) strongAreas.push(label);
  }

  if (weakAreas.length === 0 && overallBand < 7) {
    weakAreas.push("balanced practice across all skills");
  }
  if (strongAreas.length === 0) {
    strongAreas.push("consistent effort — keep building momentum");
  }

  return { weakAreas, strongAreas };
}

export function buildPlacementResult(state: TestState): PlacementResult {
  const skillBands = computeSkillBands(state.answers);
  const bands = Object.values(skillBands);
  const overallRaw =
    bands.length > 0
      ? bands.reduce((s, b) => s + b, 0) / bands.length
      : state.currentBand;
  const overallBand = roundToHalfBand(clampBand(overallRaw));
  const { cefr } = bandToCefr(overallBand);
  const { weakAreas, strongAreas } = identifyStrengthsWeaknesses(
    skillBands,
    overallBand
  );
  const course = getRecommendedCourse(overallBand);
  const timeSpent = state.answers.reduce((s, a) => s + a.timeTaken, 0);

  return {
    overallBand,
    cefr,
    skillBands,
    weakAreas,
    strongAreas,
    recommendedCourse: `${course.name} — ${course.description}`,
    confidenceScore: Math.min(100, Math.round(state.confidence)),
    totalQuestions: state.questionsAsked,
    timeSpent,
  };
}
