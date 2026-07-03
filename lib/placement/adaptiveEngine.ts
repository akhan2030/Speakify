import { WRITING_QUESTION_ORDER } from "./bank/writing";
import { QUESTION_BANK, getQuestionById } from "./questionBank";
import { isValidQuestion } from "./isValidQuestion";
import { presentQuestion } from "./shuffleOptions";
import { buildPlacementResult, clampBand } from "./scoring";
import type { Answer, PlacementResult, Question, Section, TestState } from "./types";
import { PLACEMENT_SECTIONS } from "./types";

const SECTION_LIMIT = 10;
/** Vocab 6 + grammar 6 + reading 6 + listening 4 + writing 2 */
export const BANK_QUESTIONS_BEFORE_SPEAKING = 24;

export function initTestState(maxQuestions = 35): TestState {
  return {
    currentBand: 5.0,
    confidence: 0,
    answeredIds: [],
    answers: [],
    sectionScores: {},
    questionsAsked: 0,
    maxQuestions,
    speakingCompleted: false,
  };
}

export function sectionCount(state: TestState, section: string): number {
  return state.answers.filter((a) => a.section === section).length;
}

export function meetsMinimumRequirements(state: TestState): boolean {
  return (
    sectionCount(state, "vocabulary") >= 6 &&
    sectionCount(state, "grammar") >= 6 &&
    sectionCount(state, "reading") >= 4 &&
    sectionCount(state, "writing_prompt") >= 2 &&
    state.speakingCompleted &&
    state.questionsAsked >= 20
  );
}

/** Show speaking after the fixed writing block (24 bank questions). */
export function shouldShowSpeaking(state: TestState): boolean {
  if (state.speakingCompleted) return false;
  if (sectionCount(state, "writing_prompt") < 2) return false;
  return state.questionsAsked >= BANK_QUESTIONS_BEFORE_SPEAKING;
}

export function completeSpeaking(
  state: TestState,
  overallBand: number,
  timeTaken: number
): TestState {
  const answer: Answer = {
    questionId: "speaking-placement",
    section: "speaking",
    band: overallBand,
    correct: overallBand >= state.currentBand - 0.5,
    timeTaken,
  };
  const next = processAnswer(
    { ...state, speakingCompleted: true },
    answer
  );
  return { ...next, speakingCompleted: true };
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

/** Fixed section order for questions 1–24; question index = questions already answered. */
function requiredSectionForIndex(questionsAsked: number): Section | null {
  if (questionsAsked < 6) return "vocabulary";
  if (questionsAsked < 12) return "grammar";
  if (questionsAsked < 18) return "reading";
  if (questionsAsked < 22) return "listening";
  if (questionsAsked < BANK_QUESTIONS_BEFORE_SPEAKING) return "writing_prompt";
  return null;
}

function pickBalancedSection(state: TestState, preferred?: Section): Section | undefined {
  const forced = requiredSectionForIndex(state.questionsAsked);
  if (forced) return forced;

  if (preferred && sectionCount(state, preferred) < SECTION_LIMIT) {
    return preferred;
  }

  const underCap = PLACEMENT_SECTIONS.filter(
    (s) => sectionCount(state, s) < SECTION_LIMIT
  );
  if (underCap.length === 0) return undefined;

  const untouched = underCap.filter((s) => sectionCount(state, s) === 0);
  const pool = untouched.length > 0 ? untouched : underCap;

  pool.sort(
    (a, b) => sectionCount(state, a) - sectionCount(state, b)
  );
  return pool[0];
}

export function selectNextQuestion(
  state: TestState,
  section?: Section
): Question | null {
  if (shouldEndTest(state)) return null;

  const answered = new Set(state.answeredIds);
  const targets = targetBands(state.currentBand);
  const chosenSection = pickBalancedSection(state, section);

  if (!chosenSection) return null;

  if (chosenSection === "writing_prompt") {
    const writingIdx = sectionCount(state, "writing_prompt");
    const fixedId = WRITING_QUESTION_ORDER[writingIdx];
    if (fixedId) {
      const fixed = getQuestionById(fixedId);
      if (fixed && !answered.has(fixedId)) return presentQuestion(fixed);
    }
  }

  const candidates = QUESTION_BANK.filter(
    (q) =>
      q.section === chosenSection &&
      !answered.has(q.id) &&
      targets.some((t) => bandDistance(q.band, t) <= 0.5)
  );

  let pool = candidates;
  if (pool.length === 0) {
    pool = QUESTION_BANK.filter(
      (q) =>
        q.section === chosenSection &&
        !answered.has(q.id) &&
        sectionCount(state, chosenSection) < SECTION_LIMIT
    );
  }

  if (pool.length === 0) {
    pool = QUESTION_BANK.filter(
      (q) => !answered.has(q.id) && sectionCount(state, q.section) < SECTION_LIMIT
    );
  }

  if (pool.length === 0) return null;

  pool.sort((a, b) => {
    const da = Math.min(...targets.map((t) => bandDistance(a.band, t)));
    const db = Math.min(...targets.map((t) => bandDistance(b.band, t)));
    if (da !== db) return da - db;
    return sectionCount(state, a.section) - sectionCount(state, b.section);
  });

  return presentQuestion(pool[0]);
}

export function processAnswer(state: TestState, answer: Answer): TestState {
  const question = getQuestionById(answer.questionId);
  const targetBand = state.currentBand;
  const next: TestState = {
    ...state,
    answeredIds: [...state.answeredIds, answer.questionId],
    answers: [...state.answers, answer],
    questionsAsked: state.questionsAsked + 1,
  };

  const qBand = question?.band ?? answer.band;
  const correct = answer.correct;

  let bandDelta = 0;
  let confidenceDelta = 0;

  if (correct && Math.abs(qBand - targetBand) <= 0.25) {
    bandDelta = 0.5;
    confidenceDelta = 12;
  } else if (!correct && Math.abs(qBand - targetBand) <= 0.25) {
    bandDelta = -0.25;
    confidenceDelta = 10;
  } else if (correct && qBand > targetBand) {
    bandDelta = 0.75;
    confidenceDelta = 15;
  } else if (!correct && qBand < targetBand) {
    bandDelta = -0.5;
    confidenceDelta = 8;
  } else if (correct) {
    bandDelta = 0.35;
    confidenceDelta = 11;
  } else {
    bandDelta = -0.35;
    confidenceDelta = 9;
  }

  next.currentBand = clampBand(next.currentBand + bandDelta);

  if (next.questionsAsked % 3 === 0) {
    const recent = next.answers.slice(-3);
    const acc =
      recent.filter((a) => a.correct).length / recent.length;
    const avgBand =
      recent.reduce((s, a) => s + a.band, 0) / recent.length;
    next.currentBand = clampBand(
      next.currentBand * 0.4 + avgBand * 0.35 + (acc * 8) * 0.25
    );
  }

  next.confidence = Math.min(100, next.confidence + confidenceDelta);

  const section = answer.section;
  const prev = next.sectionScores[section] ?? 0;
  next.sectionScores[section] = prev + (correct ? 1 : 0);

  return next;
}

export function shouldEndTest(state: TestState): boolean {
  if (state.questionsAsked >= state.maxQuestions) return true;
  if (
    state.questionsAsked >= 20 &&
    state.confidence >= 95 &&
    meetsMinimumRequirements(state)
  ) {
    return true;
  }
  return false;
}

export function calculateFinalResult(state: TestState): PlacementResult {
  return buildPlacementResult(state);
}

function normalizeAnswerText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]/g, "");
}

function gradeFillBlankAnswer(
  question: Question,
  student: string,
  expected: string
): boolean {
  if (student === expected) return true;

  // Passive past: accept was/were alternates (data as singular vs plural).
  if (expected.startsWith("were ")) {
    const alt = `was ${expected.slice(5)}`;
    if (student === alt) return true;
  } else if (expected.startsWith("was ")) {
    const alt = `were ${expected.slice(4)}`;
    if (student === alt) return true;
  }

  const expectedParts = expected.split(" ");
  if (expectedParts.length >= 2) {
    const participle = expectedParts[expectedParts.length - 1];
    const auxiliary = expectedParts.slice(0, -1).join(" ");

    // Accept past participle alone, e.g. "collected" for "were collected".
    if (student === participle) return true;

    // Accept auxiliary + participle without extra words.
    if (student === `${auxiliary} ${participle}`) return true;

    // Accept subject + auxiliary + participle, e.g. "data were collected".
    const withoutSubject = student.replace(/^(?:the\s+)?data\s+/, "");
    if (withoutSubject === expected || withoutSubject === `${auxiliary} ${participle}`) {
      return true;
    }

    // Accept if student included the subject, e.g. "data were collected".
    const filledSentence = normalizeAnswerText(
      String(question.question ?? "").replace(
        /___+\s*(\([^)]+\))?\s*/,
        `${expected} `
      )
    );
    if (student === filledSentence) return true;
    if (filledSentence.endsWith(` ${student}`) && student.includes(participle)) {
      return true;
    }
  }

  // Single-word blanks (e.g. "will account", "urban").
  if (expectedParts.length === 1 && student === expectedParts[0]) return true;

  return false;
}

export function gradeObjectiveAnswer(
  question: Question,
  studentAnswer: string
): boolean {
  if (question.type === "open_writing") return true;

  const student = normalizeAnswerText(studentAnswer);
  const expected = normalizeAnswerText(question.correct);

  if (question.type === "mcq") {
    const letter = student.match(/^[a-d]\b/)?.[0];
    const optionText =
      letter && question.options
        ? normalizeAnswerText(question.options[letter.charCodeAt(0) - 97] ?? "")
        : student;
    return (
      optionText === expected ||
      student === expected ||
      student.startsWith(expected)
    );
  }

  if (question.type === "fill_blank") {
    return gradeFillBlankAnswer(question, student, expected);
  }

  return student === expected || expected.includes(student) || student.includes(expected);
}

/** Mark a broken question as used so the engine never picks it again. */
export function skipInvalidQuestion(state: TestState, questionId: string): TestState {
  if (state.answeredIds.includes(questionId)) return state;
  return {
    ...state,
    answeredIds: [...state.answeredIds, questionId],
  };
}

/** Pick the next question, skipping any MCQ with missing or empty options. */
export function selectNextValidQuestion(state: TestState): Question | null {
  let working = state;
  const maxAttempts = Math.max(QUESTION_BANK.length, 1);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = selectNextQuestion(working);
    if (!candidate) return null;
    if (isValidQuestion(candidate)) return candidate;
    working = skipInvalidQuestion(working, candidate.id);
  }

  return null;
}
