/**
 * Ensures exactly 10 questions per section, aligned with IELTS block ranges and prep announcements.
 */

import {
  enforceSectionQuestionTypes,
  getSectionQuestionBlocks,
  getTypeForQuestionNumber,
  isGapFillQuestionType,
} from "./listeningSectionTypes.js";

export const QUESTIONS_PER_SECTION = 10;
export const QUESTIONS_PER_BLOCK = 5;

/**
 * @param {number} questionNumber
 * @param {string} type
 * @param {number} sectionNumber
 */
function createPlaceholderQuestion(questionNumber, type, sectionNumber) {
  const base = (sectionNumber - 1) * 10;
  const gap = isGapFillQuestionType(type);
  return {
    id: questionNumber - base,
    questionNumber,
    type,
    text: gap ? `Item ${questionNumber}:` : `Question ${questionNumber}`,
    options: type === "multiple-choice"
      ? [
          { label: "A", text: "Option A" },
          { label: "B", text: "Option B" },
          { label: "C", text: "Option C" },
        ]
      : [],
    answer: "unknown",
    wordLimit: "NO MORE THAN TWO WORDS AND/OR A NUMBER",
    explanation: "Auto-filled — content should be regenerated",
  };
}

/**
 * Normalize to exactly 10 questions with global numbers matching official block ranges (e.g. 1–5, 6–10).
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
      const qNum = Number(q.questionNumber);
      const fallback = globalBase + index + 1;
      const questionNumber =
        qNum >= globalBase + 1 && qNum <= globalBase + 10 ? qNum : fallback;
      return {
        id: Number(q.id ?? questionNumber - globalBase),
        questionNumber,
        type: String(q.type ?? ""),
        text: String(q.text ?? "").trim(),
        options: Array.isArray(q.options) ? q.options : [],
        answer: String(q.answer ?? "").trim(),
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
        q = createPlaceholderQuestion(n, type, section);
      }

      used.add(q);
      result.push({
        ...q,
        questionNumber: n,
        type,
        id: n - globalBase,
      });
    }
  }

  return result.slice(0, QUESTIONS_PER_SECTION);
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
