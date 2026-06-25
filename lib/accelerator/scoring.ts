import type { AcceleratorTrackId } from "./tracks";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { checkListeningAnswer } = require("../checkListeningAnswer.js") as {
  checkListeningAnswer: (student: string, correct: string) => boolean;
};

const TRACK_MID_BAND: Record<AcceleratorTrackId, number> = {
  foundation: 5.25,
  plus: 6.25,
  elite: 7.25,
};

/** Rough IELTS listening/reading raw → band (academic). */
export function rawToBand(correct: number, total: number): number {
  if (total <= 0) return 5;
  const pct = correct / total;
  if (pct >= 0.95) return 8.5;
  if (pct >= 0.9) return 8;
  if (pct >= 0.85) return 7.5;
  if (pct >= 0.78) return 7;
  if (pct >= 0.7) return 6.5;
  if (pct >= 0.62) return 6;
  if (pct >= 0.55) return 5.5;
  if (pct >= 0.45) return 5;
  if (pct >= 0.35) return 4.5;
  return 4;
}

export function overallBandFromSkills(skills: number[]): number {
  const valid = skills.filter((n) => Number.isFinite(n));
  if (valid.length === 0) return 5;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.round(avg * 2) / 2;
}

function normalizeAnswer(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function collectAnswerKeyEntries(answerKey: unknown): Record<string, string> {
  const flat: Record<string, string> = {};
  if (!answerKey || typeof answerKey !== "object") return flat;

  function walk(obj: unknown, prefix = "") {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => walk(item, `${prefix}${i + 1}.`));
      return;
    }
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}${key}` : key;
      if (val != null && typeof val === "object" && !Array.isArray(val)) {
        walk(val, `${path}.`);
      } else {
        flat[path] = normalizeAnswer(val);
        flat[key] = normalizeAnswer(val);
      }
    }
  }

  walk(answerKey);
  return flat;
}

export function scoreObjectiveSection(
  studentAnswers: Record<string, string>,
  answerKey: unknown
): {
  correct: number;
  total: number;
  accuracy: number;
  band: number;
  weakAreas: string[];
} {
  const keys = collectAnswerKeyEntries(answerKey);
  const keyEntries = Object.entries(keys).filter(
    ([k]) => !k.includes(".") || k.match(/^\d+$|q\d+|question/i)
  );

  let entries = keyEntries.length > 0 ? keyEntries : Object.entries(keys);
  if (entries.length === 0) {
    const answerCount = Object.keys(studentAnswers).length;
    const filled = Object.values(studentAnswers).filter((v) => v.trim()).length;
    const accuracy = answerCount > 0 ? filled / answerCount : 0;
    const correct = Math.round(accuracy * 40);
    return {
      correct,
      total: 40,
      accuracy,
      band: rawToBand(correct, 40),
      weakAreas: ["Review model answers and retry similar question types"],
    };
  }

  let correct = 0;
  const missed: string[] = [];

  for (const [qKey, expected] of entries) {
    const student =
      studentAnswers[qKey] ??
      studentAnswers[qKey.replace(/^q/i, "")] ??
      studentAnswers[`question_${qKey}`] ??
      "";
    if (checkListeningAnswer(String(student), expected)) {
      correct += 1;
    } else if (expected) {
      missed.push(qKey);
    }
  }

  const total = entries.length;
  const accuracy = total > 0 ? correct / total : 0;

  return {
    correct,
    total,
    accuracy,
    band: rawToBand(correct, total),
    weakAreas:
      missed.length > 0
        ? [`Missed questions: ${missed.slice(0, 5).join(", ")}${missed.length > 5 ? "…" : ""}`]
        : ["Strong performance — try a harder track section next"],
  };
}

export function scoreWritingSection(
  answers: { task1?: string; task2?: string },
  track: AcceleratorTrackId
): { band: number; weakAreas: string[] } {
  const w1 = (answers.task1 ?? "").trim().split(/\s+/).filter(Boolean).length;
  const w2 = (answers.task2 ?? "").trim().split(/\s+/).filter(Boolean).length;
  const mid = TRACK_MID_BAND[track];
  let band = mid - 0.5;
  if (w1 >= 140) band += 0.25;
  if (w2 >= 230) band += 0.25;
  if (w1 < 100 || w2 < 180) band -= 0.5;
  band = Math.max(4, Math.min(9, Math.round(band * 2) / 2));

  const weakAreas: string[] = [];
  if (w1 < 150) weakAreas.push("Task 1 — aim for at least 150 words with clear overview");
  if (w2 < 250) weakAreas.push("Task 2 — develop both body paragraphs to 250+ words");
  if (weakAreas.length === 0) weakAreas.push("Compare your response with the model answers below");

  return { band, weakAreas };
}

export function scoreSpeakingSection(
  answers: Record<string, string>,
  track: AcceleratorTrackId
): { band: number; weakAreas: string[] } {
  const filled = Object.values(answers).filter((v) => v.trim().length > 20).length;
  const mid = TRACK_MID_BAND[track];
  let band = mid - 0.5 + filled * 0.15;
  band = Math.max(4, Math.min(9, Math.round(band * 2) / 2));
  return {
    band,
    weakAreas:
      filled < 3
        ? ["Extend answers with examples and linking phrases"]
        : ["Review model answers and record again for fluency"],
  };
}

export function buildImprovementPlan(
  track: AcceleratorTrackId,
  skills: { section: string; band: number }[]
) {
  const weakest = [...skills].sort((a, b) => a.band - b.band)[0];
  const target = TRACK_MID_BAND[track];
  return [
    {
      week: 1,
      focus: weakest ? `Strengthen ${weakest.section}` : "Balanced skills review",
      tasks: [
        "Complete 2 section practice sets on your weakest skill",
        "Review model answers after each attempt",
        "Build a personal error log from weak areas",
      ],
    },
    {
      week: 2,
      focus: `Push toward Band ${target.toFixed(1)}`,
      tasks: [
        "Take one full mock under timed conditions",
        "Revise vocabulary from missed reading/listening items",
        "Practice one writing + speaking task with AI feedback",
      ],
    },
  ];
}
