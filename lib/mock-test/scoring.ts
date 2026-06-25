import { LISTENING_EXAM_PARTS, getAllListeningExamQuestions } from "./listeningExam";
import type { MockExamContent } from "./types";
import { buildReadingAnswerKey } from "./generateReadingContent";
import { answersMatch } from "./utils";

/** Official IELTS Listening raw-score → band (out of 40). */
export function listeningCorrectToBand(correct: number): number {
  if (correct >= 39) return 9.0;
  if (correct >= 37) return 8.5;
  if (correct >= 35) return 8.0;
  if (correct >= 33) return 7.5;
  if (correct >= 30) return 7.0;
  if (correct >= 27) return 6.5;
  if (correct >= 23) return 6.0;
  if (correct >= 20) return 5.5;
  if (correct >= 16) return 5.0;
  if (correct >= 13) return 4.5;
  if (correct >= 10) return 4.0;
  return 3.5;
}

/** Map a 0–9 raw score to the nearest IELTS half-band */
export function rawScoreToBand(raw: number): number {
  const clamped = Math.max(0, Math.min(9, raw));
  if (clamped >= 8.75) return 9;
  if (clamped >= 8.25) return 8.5;
  if (clamped >= 7.75) return 8;
  if (clamped >= 7.25) return 7.5;
  if (clamped >= 6.75) return 7;
  if (clamped >= 6.25) return 6.5;
  if (clamped >= 5.75) return 6;
  if (clamped >= 5.25) return 5.5;
  if (clamped >= 4.75) return 5;
  if (clamped >= 4.25) return 4.5;
  if (clamped >= 3.75) return 4;
  if (clamped >= 3.25) return 3.5;
  if (clamped >= 2.75) return 3;
  if (clamped >= 2.25) return 2.5;
  if (clamped >= 1.75) return 2;
  if (clamped >= 1.25) return 1.5;
  if (clamped >= 0.75) return 1;
  return 0;
}

export function correctOutOf40ToBand(correct: number, total = 40): number {
  if (total === 40) return listeningCorrectToBand(correct);
  const scaled = Math.round((correct / total) * 40);
  return listeningCorrectToBand(scaled);
}

function scoreItems(
  answers: Record<string, string>,
  items: { id: string; correct: string }[],
  useListeningTable = false
) {
  let correct = 0;
  for (const item of items) {
    if (answersMatch(answers[item.id] ?? "", item.correct)) correct += 1;
  }
  const total = items.length;
  const accuracy = total ? correct / total : 0;
  const band = useListeningTable
    ? correctOutOf40ToBand(correct, total)
    : correctOutOf40ToBand(correct, total);
  return { correct, total, accuracy, band };
}

export function scoreListening(answers: Record<string, string>) {
  const items = getAllListeningExamQuestions();
  const base = scoreItems(answers, items, true);
  const band = listeningCorrectToBand(base.correct);

  const sectionBreakdown = LISTENING_EXAM_PARTS.map((part) => {
    const partItems = part.questions.map((q) => ({
      id: q.id,
      correct: q.correct,
    }));
    const scored = scoreItems(answers, partItems, true);
    return {
      label: `Section ${part.partNumber}`,
      correct: scored.correct,
      total: scored.total,
      accuracy: scored.accuracy,
      band: listeningCorrectToBand(
        Math.round((scored.correct / Math.max(scored.total, 1)) * 40)
      ),
    };
  });

  const byType: Record<string, { id: string; correct: string }[]> = {};
  for (const q of items) {
    const type = q.type ?? "other";
    if (!byType[type]) byType[type] = [];
    byType[type].push({ id: q.id, correct: q.correct });
  }

  const typeScores = Object.entries(byType).map(([type, typeItems]) => ({
    type,
    ...scoreItems(answers, typeItems, true),
  }));
  typeScores.sort((a, b) => b.accuracy - a.accuracy);
  const strongestQuestionType = typeScores[0]?.type ?? "form completion";
  const weakestQuestionType =
    typeScores[typeScores.length - 1]?.type ?? "matching";

  return {
    ...base,
    band,
    sectionBreakdown,
    strongestQuestionType,
    weakestQuestionType,
  };
}

export function scoreReading(
  answers: Record<string, string>,
  examContent?: MockExamContent | null
) {
  const correctMap = examContent
    ? buildReadingAnswerKey(examContent)
    : undefined;
  const items = correctMap
    ? Object.entries(correctMap).map(([id, correct]) => ({ id, correct }))
    : [];
  if (!items.length) {
    return {
      correct: 0,
      total: 40,
      accuracy: 0,
      band: 0,
      passageBreakdown: [] as {
        label: string;
        correct: number;
        total: number;
        accuracy: number;
        band: number;
      }[],
    };
  }
  const base = scoreItems(answers, items, true);
  const band = listeningCorrectToBand(base.correct);

  const passageBreakdown =
    examContent?.reading.passages.map((p) => {
      const passageItems = p.questions.map((q) => ({
        id: q.id,
        correct: q.correct ?? "",
      }));
      const scored = scoreItems(answers, passageItems, true);
      return {
        label: `Passage ${p.index}`,
        correct: scored.correct,
        total: scored.total,
        accuracy: scored.accuracy,
        band: listeningCorrectToBand(
          Math.round((scored.correct / Math.max(scored.total, 1)) * 40)
        ),
      };
    }) ?? [];

  return { ...base, band, passageBreakdown };
}

export function computeOverallBand(scores: {
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
}) {
  const values = [
    scores.listening,
    scores.reading,
    scores.writing,
    scores.speaking,
  ].filter((v): v is number => typeof v === "number" && !Number.isNaN(v));

  if (!values.length) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 2) / 2;
}

/** Confidence = 100 − (largest skill gap × 8), clamped 55–94. */
export function computeConfidenceFromSkills(bands: number[]): number {
  if (bands.length < 2) return 87;
  const max = Math.max(...bands);
  const min = Math.min(...bands);
  const gap = max - min;
  return Math.min(94, Math.max(55, Math.round(100 - gap * 8)));
}

export function computeConfidencePercent(skillBands: number[]): number {
  return computeConfidenceFromSkills(skillBands);
}

export function computePredictedRange(overallBand: number) {
  const low = Math.max(4, Math.round((overallBand - 0.5) * 2) / 2);
  const high = Math.min(9, Math.round((overallBand + 0.5) * 2) / 2);
  return { low, high };
}

export function computeTargetBand(current: number): number {
  const next = Math.ceil(current * 2) / 2 + 0.5;
  return Math.min(9, Math.max(current + 0.5, next >= 7 ? next : 7));
}

export function computeTargetProbability(gap: number): number {
  if (gap <= 0.5) return 85;
  if (gap <= 1.0) return 70;
  if (gap <= 1.5) return 55;
  return 40;
}

export function computeWeeksToCloseGap(gap: number): number {
  if (gap <= 0.5) return 2;
  if (gap <= 1.0) return 4;
  if (gap <= 1.5) return 6;
  return 8;
}

export function computeBandPrediction(currentBand: number) {
  const target = computeTargetBand(currentBand);
  const gap = Math.round((target - currentBand) * 2) / 2;
  const progressPercent = Math.min(
    100,
    Math.round((currentBand / target) * 100)
  );
  const probabilityPercent = computeTargetProbability(gap);
  const weeksEstimate = computeWeeksToCloseGap(gap);
  const message =
    gap <= 1.5
      ? `This gap is achievable. Our students close this gap in as little as ${weeksEstimate} weeks.`
      : `A structured programme is recommended. Most students need ${weeksEstimate}+ weeks with daily practice.`;

  return {
    current: currentBand,
    target,
    gap,
    progressPercent,
    probabilityPercent,
    weeksEstimate,
    message,
  };
}
