import {
  gradeObjectiveAnswer,
  initTestState,
  processAnswer,
  skipInvalidQuestion,
} from "@/lib/placement/adaptiveEngine";
import { isValidQuestion } from "@/lib/placement/isValidQuestion";
import { QUESTION_BANK } from "@/lib/placement/questionBank";
import { presentQuestion } from "@/lib/placement/shuffleOptions";
import { clampBand, roundToHalfBand } from "@/lib/placement/scoring";
import type { Answer, Question, Section, TestState } from "@/lib/placement/types";

export const GATEWAY_QUESTION_COUNT = 15;

function gatewaySection(questionIndex: number): Section {
  if (questionIndex < 5) return "vocabulary";
  if (questionIndex < 10) return "grammar";
  return "reading";
}

function targetBands(currentBand: number): number[] {
  const low = clampBand(currentBand - 0.5, 3.5, 8.5);
  const high = clampBand(currentBand + 0.5, 3.5, 8.5);
  const mid = clampBand(currentBand, 3.5, 8.5);
  return [mid, low, high];
}

function bandDistance(questionBand: number, target: number): number {
  return Math.abs(questionBand - target);
}

export function initGatewayState(): TestState {
  return initTestState(GATEWAY_QUESTION_COUNT);
}

export function selectGatewayQuestion(state: TestState): Question | null {
  if (state.questionsAsked >= GATEWAY_QUESTION_COUNT) return null;

  let working = state;
  const maxAttempts = Math.max(QUESTION_BANK.length, 1);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = pickGatewayCandidate(working);
    if (!candidate) return null;
    const presented = presentQuestion(candidate);
    if (isValidQuestion(presented)) return presented;
    working = skipInvalidQuestion(working, candidate.id);
  }

  return null;
}

function pickGatewayCandidate(state: TestState): Question | null {
  if (state.questionsAsked >= GATEWAY_QUESTION_COUNT) return null;

  const answered = new Set(state.answeredIds);
  const targets = targetBands(state.currentBand);
  const section = gatewaySection(state.questionsAsked);

  let pool = QUESTION_BANK.filter(
    (q) =>
      q.section === section &&
      !answered.has(q.id) &&
      q.type === "mcq" &&
      targets.some((t) => bandDistance(q.band, t) <= 0.75)
  );

  if (pool.length === 0) {
    pool = QUESTION_BANK.filter(
      (q) => q.section === section && !answered.has(q.id) && q.type === "mcq"
    );
  }

  if (pool.length === 0) {
    pool = QUESTION_BANK.filter(
      (q) => !answered.has(q.id) && q.type === "mcq"
    );
  }

  if (pool.length === 0) return null;

  pool.sort((a, b) => {
    const da = Math.min(...targets.map((t) => bandDistance(a.band, t)));
    const db = Math.min(...targets.map((t) => bandDistance(b.band, t)));
    return da - db;
  });

  return pool[0];
}

export function submitGatewayAnswer(
  state: TestState,
  question: Question,
  studentAnswer: string
): { state: TestState; correct: boolean } {
  const correct = gradeObjectiveAnswer(question, studentAnswer);
  const answer: Answer = {
    questionId: question.id,
    section: question.section,
    band: question.band,
    correct,
    timeTaken: 0,
  };
  return { state: processAnswer(state, answer), correct };
}

export function gatewayEstimatedBand(state: TestState): number {
  return roundToHalfBand(state.currentBand);
}

export { gradeObjectiveAnswer };
