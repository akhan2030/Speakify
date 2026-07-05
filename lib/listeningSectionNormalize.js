/**
 * Ensures exactly 10 questions per section, aligned with IELTS block ranges and prep announcements.
 */

import {
  enforceSectionQuestionTypes,
  getSectionQuestionBlocks,
  getTypeForQuestionNumber,
  isGapFillQuestionType,
} from "./listeningSectionTypes.js";
import {
  coalesceQuestionAnswer,
  coalesceQuestionOptionsRaw,
  coalesceQuestionText,
  coalesceQuestionNumber,
  hydrateListeningQuestionsFromPayload,
  normalizeListeningQuestionFields,
} from "./listeningQuestionContent.js";

export const QUESTIONS_PER_SECTION = 10;
export const QUESTIONS_PER_BLOCK = 5;

/**
 * Marks a missing slot — validation must reject; never show as real content.
 * @param {number} questionNumber
 * @param {string} type
 * @param {number} sectionNumber
 */
function createMissingQuestionSlot(questionNumber, type, sectionNumber) {
  const base = (sectionNumber - 1) * 10;
  return {
    id: questionNumber - base,
    questionNumber,
    type,
    text: "",
    options: [],
    answer: "",
    wordLimit: "",
    explanation: "",
    _contentMissing: true,
  };
}

function propagateBlockSharedOptions(questions, sectionNumber) {
  const blocks = getSectionQuestionBlocks(sectionNumber);
  const next = questions.map((q) => ({ ...q }));

  for (const block of blocks) {
    const blockQuestions = next.filter(
      (q) => q.questionNumber >= block.start && q.questionNumber <= block.end
    );
    const donor = blockQuestions.find(
      (q) => Array.isArray(q.options) && q.options.length > 0
    );
    if (!donor) continue;

    for (let i = 0; i < next.length; i += 1) {
      const q = next[i];
      if (q.questionNumber < block.start || q.questionNumber > block.end) continue;
      const needsOptions =
        block.type === "matching" ||
        (block.type === "multiple-choice" &&
          (!Array.isArray(q.options) || q.options.length === 0));
      if (!needsOptions) continue;
      next[i] = normalizeListeningQuestionFields({
        ...q,
        options: donor.options,
      });
    }
  }

  return next;
}

/**
 * @param {Array<object>} rawQuestions
 * @param {number} sectionNumber
 */
export function normalizeSectionQuestions(rawQuestions, sectionNumber) {
  const section = Number(sectionNumber);
  const blocks = getSectionQuestionBlocks(section);
  const globalBase = (section - 1) * 10;

  const pool = Array.isArray(rawQuestions) ? [...rawQuestions] : [];

  const typed = enforceSectionQuestionTypes(
    pool.map((q, index) => {
      const qNum = coalesceQuestionNumber(q);
      const fallback = globalBase + index + 1;
      const questionNumber =
        qNum != null && qNum >= globalBase + 1 && qNum <= globalBase + 10
          ? qNum
          : fallback;
      return {
        id: Number(q.id ?? questionNumber - globalBase),
        questionNumber,
        type: String(q.type ?? ""),
        text: coalesceQuestionText(q),
        options: coalesceQuestionOptionsRaw(q),
        answer: coalesceQuestionAnswer(q),
        wordLimit: String(q.wordLimit ?? ""),
        explanation: String(q.explanation ?? ""),
        tableHeaders: Array.isArray(q.tableHeaders) ? q.tableHeaders : undefined,
      };
    }),
    section
  );

  const used = new Set();
  const result = [];

  for (const block of blocks) {
    for (let n = block.start; n <= block.end; n += 1) {
      const type = getTypeForQuestionNumber(section, n);

      let q = typed.find(
        (item) => item.questionNumber === n && !used.has(item)
      );

      if (!q) {
        q = typed.find((item) => !used.has(item));
        if (q) {
          q = {
            ...q,
            questionNumber: n,
            type,
            id: n - globalBase,
            options: isGapFillQuestionType(type) ? [] : q.options ?? [],
          };
        }
      }

      if (!q) {
        q = createMissingQuestionSlot(n, type, section);
      }

      used.add(q);
      result.push(
        normalizeListeningQuestionFields({
          ...q,
          questionNumber: n,
          type,
          id: n - globalBase,
        })
      );
    }
  }

  return propagateBlockSharedOptions(
    result.slice(0, QUESTIONS_PER_SECTION),
    section
  );
}

/**
 * @param {Array<object>} questions — must be normalized (10 items)
 * @param {number} sectionNumber
 */
export function validateSectionQuestions(questions, sectionNumber) {
  const blocks = getSectionQuestionBlocks(sectionNumber);
  const errors = [];

  if (questions.length !== QUESTIONS_PER_SECTION) {
    errors.push(`Expected ${QUESTIONS_PER_SECTION} questions, got ${questions.length}`);
  }

  for (const block of blocks) {
    const inBlock = questions.filter(
      (q) => q.questionNumber >= block.start && q.questionNumber <= block.end
    );
    if (inBlock.length !== QUESTIONS_PER_BLOCK) {
      errors.push(
        `Block ${block.start}–${block.end}: expected ${QUESTIONS_PER_BLOCK}, got ${inBlock.length}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
