import {
  generateSpeakingFeedback,
  type SpeakingFeedback,
} from "@/lib/speaking/generateSpeakingFeedback";

export type { SpeakingFeedback };
export { generateSpeakingFeedback };

export type SpeakingCriteriaScores = {
  overall: number;
  fc: number;
  lr: number;
  gra: number;
  p: number;
  part1?: number | null;
  part2?: number | null;
  part3?: number | null;
};

export type SpeakingMockFeedback = {
  overallSummary: string;
  strengths: string[];
  weaknesses: string[];
  nextImprovements: string[];
  nextTarget: string;
  improvementPlan: string[];
  targetBand: {
    label: string;
    guidance: string;
  };
  practicePlan: Array<{
    title: string;
    detail: string;
    href: string;
  }>;
};

function roundHalf(n: number) {
  return Math.round(n * 2) / 2;
}

function formatBand(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function buildPracticeLinks(
  scores: SpeakingCriteriaScores,
  feedback: SpeakingFeedback
): SpeakingMockFeedback["practicePlan"] {
  const overall = roundHalf(scores.overall);
  const entries: SpeakingMockFeedback["practicePlan"] = [];
  const lowestKey = findLowestKey(scores.fc, scores.lr, scores.gra, scores.p);

  if (lowestKey === "fc" || (scores.part2 ?? 0) < overall) {
    entries.push({
      title: "Part 2 — Extended speaking",
      detail:
        "Practise cue cards with 1-minute prep and 2-minute responses to build fluency and development.",
      href: "/dashboard/student/speaking/part2",
    });
  }
  if (lowestKey === "lr" || lowestKey === "gra") {
    entries.push({
      title: "Part 3 — Discussion",
      detail:
        "Practise abstract questions to push vocabulary range and complex grammar under pressure.",
      href: "/dashboard/student/speaking/part3",
    });
  }
  if (lowestKey === "fc" || (scores.part1 ?? 0) < overall) {
    entries.push({
      title: "Part 1 — Introduction",
      detail:
        "Build confidence with short questions — extend every answer with a reason and example.",
      href: "/dashboard/student/speaking/part1",
    });
  }
  if (lowestKey === "p") {
    entries.push({
      title: "Speaking Mock — Pronunciation focus",
      detail:
        "Repeat full mocks and focus on word stress, rhythm, and intonation in every answer.",
      href: "/dashboard/student/speaking/mock",
    });
  }

  entries.push({
    title: "Full Speaking Mock",
    detail: `Repeat a full mock in 3–5 days to measure progress toward ${feedback.nextTarget}.`,
    href: "/dashboard/student/speaking/mock",
  });
  entries.push({
    title: "Speaking Progress Tracker",
    detail: "Review your band history and criterion trends over time.",
    href: "/dashboard/student/speaking/tracker",
  });

  return entries;
}

function findLowestKey(fc: number, lr: number, gra: number, p: number) {
  const items = [
    { key: "fc" as const, score: roundHalf(fc) },
    { key: "lr" as const, score: roundHalf(lr) },
    { key: "gra" as const, score: roundHalf(gra) },
    { key: "p" as const, score: roundHalf(p) },
  ];
  const min = Math.min(...items.map((i) => i.score));
  return items.find((i) => i.score === min)?.key ?? "fc";
}

/** Wraps generateSpeakingFeedback with part-level context and practice links. */
export function generateSpeakingMockFeedback(
  scores: SpeakingCriteriaScores
): SpeakingMockFeedback {
  const feedback = generateSpeakingFeedback(
    scores.overall,
    scores.fc,
    scores.lr,
    scores.gra,
    scores.p
  );

  const strengths = [...feedback.strengths];
  const weaknesses = [...feedback.weaknesses];
  const overall = roundHalf(scores.overall);

  if (scores.part2 != null && scores.part2 >= (scores.part1 ?? 0)) {
    strengths.push(
      `Your Part 2 performance (${formatBand(scores.part2)}) shows you can speak at length on a cue card.`
    );
  }
  if (scores.part3 != null && scores.part3 < overall) {
    weaknesses.push(
      `Your Part 3 average (${formatBand(scores.part3)}) is below your overall band — give deeper, more analytical answers with examples and clear opinions.`
    );
  }
  if (scores.part2 != null && scores.part2 < overall) {
    weaknesses.push(
      `Your Part 2 score (${formatBand(scores.part2)}) suggests your extended monologue needs fuller development — cover all cue-card points and speak closer to two minutes.`
    );
  }

  return {
    overallSummary: feedback.overallSummary,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 5),
    nextImprovements: feedback.improvementPlan,
    nextTarget: feedback.nextTarget,
    improvementPlan: feedback.improvementPlan,
    targetBand: {
      label: feedback.nextTarget,
      guidance: `Your main priority should be moving from Band ${formatBand(overall)} toward ${feedback.nextTarget} with focused daily practice.`,
    },
    practicePlan: buildPracticeLinks(scores, feedback),
  };
}

export const SPEAKING_MOCK_FEEDBACK_STORAGE_KEY = "speakingMockFeedback";

export function saveSpeakingMockFeedback(feedback: SpeakingMockFeedback) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SPEAKING_MOCK_FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
}

export function loadSpeakingMockFeedback(): SpeakingMockFeedback | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SPEAKING_MOCK_FEEDBACK_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SpeakingMockFeedback;
  } catch {
    return null;
  }
}
