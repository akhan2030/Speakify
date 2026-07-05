/**
 * Reading practice content validation — reject shells without interactive content.
 */

import { normalizeQuestionType } from "./readingPassageTypes.js";

const ROMAN_KEYS = [
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "vi",
  "vii",
  "viii",
  "ix",
  "x",
];

/** Question types that only have instruction text + generic text input (not exam-faithful). */
export const READING_INCOMPLETE_UI_TYPES = new Set([
  "matching-information",
  "matching-features",
  "matching-sentence-endings",
  "diagram-completion",
  "classification",
]);

/**
 * @param {unknown} raw
 * @returns {{ key: string, label: string }[]}
 */
export function normalizeHeadingOptions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h, index) => {
      if (typeof h === "string") {
        const trimmed = h.trim();
        const m = trimmed.match(/^([ivxlcdm]+)\.?\s+(.*)$/i);
        if (m) {
          return { key: m[1].toLowerCase(), label: m[2].trim() };
        }
        return {
          key: ROMAN_KEYS[index] ?? String(index + 1),
          label: trimmed,
        };
      }
      if (h && typeof h === "object") {
        const record = /** @type {Record<string, unknown>} */ (h);
        const label = String(
          record.label ?? record.text ?? record.heading ?? ""
        ).trim();
        const key = String(record.key ?? record.id ?? ROMAN_KEYS[index] ?? "")
          .trim()
          .toLowerCase();
        return { key: key || ROMAN_KEYS[index] || String(index + 1), label };
      }
      return { key: "", label: "" };
    })
    .filter((h) => h.label.length > 0);
}

/**
 * @param {string} text
 */
export function isGenericMatchingHeadingsPrompt(text) {
  return /match\s+(the\s+)?headings?\s+to/i.test(String(text ?? ""));
}

/**
 * @param {string} text
 */
export function isParagraphAssignmentLabel(text) {
  const t = String(text ?? "").trim();
  return (
    /^paragraph\s+[A-G]\b/i.test(t) ||
    /^[A-G]\.?$/i.test(t) ||
    /^section\s+[A-G]\b/i.test(t)
  );
}

/**
 * @param {object} q
 * @param {Array<{ id: string, label: string }>} paragraphs
 */
export function paragraphSortIndex(q, paragraphs = []) {
  if (q.paragraphId) {
    const p = paragraphs.find((row) => row.id === q.paragraphId);
    if (p) {
      const letter = String(p.label).match(/([A-G])\b/i)?.[1];
      if (letter) return letter.toUpperCase().charCodeAt(0) - 65;
    }
  }
  const fromText = String(q.text ?? "").match(/paragraph\s+([A-G])\b/i);
  if (fromText) return fromText[1].toUpperCase().charCodeAt(0) - 65;
  return 999;
}

/**
 * Count how many paragraphs have answer key equal to the i-th roman (A→i, B→ii, …).
 * @param {Array<object>} questions
 * @param {Array<{ id: string, label: string }>} paragraphs
 */
export function countPositionalMatchingHeadings(questions, paragraphs = []) {
  const sorted = [...questions].sort(
    (a, b) => paragraphSortIndex(a, paragraphs) - paragraphSortIndex(b, paragraphs)
  );
  let matches = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    const answer = String(sorted[i].correct ?? sorted[i].answer ?? "")
      .trim()
      .toLowerCase();
    if (answer === ROMAN_KEYS[i]) matches += 1;
  }
  return { matches, total: sorted.length };
}

/**
 * True when answers are trivially guessable from paragraph order alone.
 * @param {object} content
 */
export function hasTrivialSequentialMatchingHeadingsPattern(content) {
  const questions = content.questions ?? [];
  const { matches, total } = countPositionalMatchingHeadings(
    questions,
    content.paragraphs ?? []
  );
  if (total <= 1) return false;
  if (matches === total) return true;
  if (matches > 2) return true;
  return false;
}

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str ?? "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed(items, seedStr) {
  const rng = mulberry32(hashSeed(seedStr));
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Reorder the displayed heading list (keys stay i…x) so correct answers are not
 * positional, while preserving which heading text matches each paragraph.
 * @param {object} content
 * @param {string} [seed]
 */
export function shuffleMatchingHeadingsMapping(content, seed = content.passageId ?? content.title ?? "mh") {
  const paragraphs = content.paragraphs ?? [];
  const questions = Array.isArray(content.questions) ? content.questions : [];
  const headings = normalizeHeadingOptions(
    content.headings?.length
      ? content.headings
      : extractSharedHeadings(questions, content)
  );

  if (headings.length === 0 || questions.length === 0) return content;

  const headingByKey = new Map(headings.map((h) => [h.key.toLowerCase(), h]));
  const labelByQuestionId = new Map();
  const usedLabels = new Set();

  for (const q of questions) {
    const key = String(q.correct ?? q.answer ?? "").trim().toLowerCase();
    const heading = headingByKey.get(key);
    if (heading) {
      labelByQuestionId.set(q.id, heading.label);
      usedLabels.add(heading.label);
    }
  }

  const usedHeadings = headings.filter((h) => usedLabels.has(h.label));
  const distractors = headings.filter((h) => !usedLabels.has(h.label));
  const pool = [...usedHeadings, ...distractors];

  let shuffledHeadings = headings;
  let remappedQuestions = questions;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const shuffled = shuffleWithSeed(pool, `${seed}-mh-${attempt}`);
    shuffledHeadings = shuffled.map((h, index) => ({
      key: ROMAN_KEYS[index] ?? String(index + 1),
      label: h.label,
    }));
    const labelToKey = new Map(shuffledHeadings.map((h) => [h.label, h.key]));

    remappedQuestions = questions.map((q) => ({
      ...q,
      kind: "matching-headings",
      headings: shuffledHeadings,
      correct:
        labelToKey.get(labelByQuestionId.get(q.id) ?? "") ??
        String(q.correct ?? q.answer ?? "").trim(),
    }));

    const candidate = {
      ...content,
      headings: shuffledHeadings,
      questions: remappedQuestions,
      paragraphs,
    };

    if (!hasTrivialSequentialMatchingHeadingsPattern(candidate)) {
      return candidate;
    }
  }

  return {
    ...content,
    headings: shuffledHeadings,
    questions: remappedQuestions,
  };
}

/**
 * @param {Array<object>} questionsRaw
 * @param {object} [bankRow]
 */
export function extractSharedHeadings(questionsRaw, bankRow = {}) {
  if (Array.isArray(bankRow.headings)) {
    const fromRow = normalizeHeadingOptions(bankRow.headings);
    if (fromRow.length > 0) return fromRow;
  }

  const questions = Array.isArray(questionsRaw) ? questionsRaw : [];
  for (const q of questions) {
    if (Array.isArray(q.headings) && q.headings.length > 0) {
      return normalizeHeadingOptions(q.headings);
    }
  }
  return [];
}

/**
 * @param {object} content — PracticeContent shape
 */
export function finalizeMatchingHeadingsContent(content) {
  const slug = normalizeQuestionType(content.slug ?? content.questionType ?? "");
  if (slug !== "matching-headings") return content;

  const paragraphs = Array.isArray(content.paragraphs) ? content.paragraphs : [];
  const sharedHeadings = extractSharedHeadings(
    content.questions,
    content
  );

  let questions = (Array.isArray(content.questions) ? content.questions : []).map(
    (q, index) => {
      const headings =
        Array.isArray(q.headings) && q.headings.length > 0
          ? normalizeHeadingOptions(q.headings)
          : sharedHeadings;

      let paragraphId = q.paragraphId;
      if (!paragraphId && isParagraphAssignmentLabel(q.text)) {
        const m = String(q.text).match(/paragraph\s+([A-G])/i) || String(q.text).match(/^([A-G])/i);
        const label = m?.[1]?.toUpperCase();
        if (label) {
          paragraphId =
            paragraphs.find((p) => p.label === label)?.id ?? `p${label}`;
        }
      }

      return {
        ...q,
        kind: "matching-headings",
        headings,
        paragraphId,
        text: paragraphId
          ? `Paragraph ${
              paragraphs.find((p) => p.id === paragraphId)?.label ??
              String(q.text).replace(/^paragraph\s+/i, "")
            }`
          : q.text,
      };
    }
  );

  const hasPerParagraph = questions.some(
    (q) => q.paragraphId || isParagraphAssignmentLabel(q.text)
  );

  if (
    !hasPerParagraph &&
    paragraphs.length >= 2 &&
    sharedHeadings.length > paragraphs.length &&
    questions.length >= paragraphs.length
  ) {
    questions = questions.slice(0, paragraphs.length).map((q, index) => {
      const p = paragraphs[index];
      return {
        ...q,
        id: String(q.id ?? `h-${p.label}`),
        kind: "matching-headings",
        paragraphId: p.id,
        text: `Paragraph ${p.label}`,
        headings: sharedHeadings,
      };
    });
  }

  if (
    questions.length === 1 &&
    isGenericMatchingHeadingsPrompt(questions[0].text) &&
    paragraphs.length >= 2 &&
    sharedHeadings.length > paragraphs.length
  ) {
    questions = paragraphs.map((p, index) => ({
      id: `h-${p.label}-${index}`,
      kind: "matching-headings",
      paragraphId: p.id,
      text: `Paragraph ${p.label}`,
      headings: sharedHeadings,
      correct: questions[0].correct,
    }));
  }

  questions = questions.map((q) => ({
    ...q,
    headings:
      Array.isArray(q.headings) && q.headings.length > 0
        ? q.headings
        : sharedHeadings,
  }));

  const assignable = questions.filter(
    (q) =>
      (q.headings?.length ?? 0) > 0 &&
      (q.paragraphId || isParagraphAssignmentLabel(q.text))
  );

  let result = {
    ...content,
    slug,
    headings: sharedHeadings,
    questions: assignable.length > 0 ? assignable : questions,
  };

  if (hasTrivialSequentialMatchingHeadingsPattern(result)) {
    result = shuffleMatchingHeadingsMapping(
      result,
      content.passageId ?? content.title ?? slug
    );
  }

  return result;
}

/**
 * @param {object} content
 */
export function validateMatchingHeadingsContent(content) {
  const errors = [];
  const paragraphs = content.paragraphs ?? [];
  const questions = content.questions ?? [];
  const headings =
    content.headings?.length > 0
      ? content.headings
      : extractSharedHeadings(questions, content);

  if (headings.length === 0) {
    errors.push("Matching headings task is missing the list of heading options");
  } else if (paragraphs.length > 0 && headings.length <= paragraphs.length) {
    errors.push(
      `Matching headings needs more heading options than paragraphs (${paragraphs.length} paragraphs, ${headings.length} headings)`
    );
  }

  if (questions.length === 0) {
    errors.push("Matching headings task has no questions");
  }

  if (
    questions.length === 1 &&
    isGenericMatchingHeadingsPrompt(questions[0].text)
  ) {
    errors.push(
      "Matching headings shows a generic instruction only — no per-paragraph assignment items"
    );
  }

  for (const q of questions) {
    const qHeadings = q.headings?.length ? q.headings : headings;
    if (!qHeadings || qHeadings.length === 0) {
      errors.push(`Question ${q.id}: no heading options available for selection`);
    }
    if (!isParagraphAssignmentLabel(q.text) && !q.paragraphId) {
      if (isGenericMatchingHeadingsPrompt(q.text)) {
        errors.push(`Question ${q.id}: not a per-paragraph assignment`);
      }
    }
  }

  const selectable = questions.filter(
    (q) => (q.headings?.length ?? headings.length) > 0
  );
  if (selectable.length === 0) {
    errors.push("No paragraph heading selectors can be rendered");
  }

  if (hasTrivialSequentialMatchingHeadingsPattern(content)) {
    errors.push(
      "Matching headings answers follow trivial paragraph-order pattern (e.g. A→i, B→ii, C→iii)"
    );
  }

  const answerKeys = questions.map((q) =>
    String(q.correct ?? q.answer ?? "").trim().toLowerCase()
  );
  const uniqueAnswers = new Set(answerKeys.filter(Boolean));
  if (uniqueAnswers.size !== answerKeys.filter(Boolean).length) {
    errors.push("Matching headings must not reuse the same heading key for two paragraphs");
  }

  const usedKeys = new Set(answerKeys);
  const distractorCount = headings.filter((h) => !usedKeys.has(h.key.toLowerCase())).length;
  if (paragraphs.length > 0 && distractorCount === 0 && headings.length > paragraphs.length) {
    errors.push("Matching headings set is missing unused distractor headings");
  }

  return { valid: errors.length === 0, errors, headings };
}

/**
 * Normalize TFNG answer text to TRUE | FALSE | NOT GIVEN.
 * @param {unknown} value
 */
export function normalizeTfngAnswer(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "true" || raw === "t") return "TRUE";
  if (raw === "false" || raw === "f") return "FALSE";
  if (raw === "not given" || raw === "ng" || raw === "not_given") return "NOT GIVEN";
  return String(value ?? "").trim().toUpperCase();
}

/**
 * IELTS TFNG passages should use all three answer types — not skew to 1–2.
 * @param {Array<object>} questions
 */
export function validateTfngAnswerBalance(questions) {
  const errors = [];
  const list = Array.isArray(questions) ? questions : [];
  const answers = list
    .map((q) => normalizeTfngAnswer(q.correct ?? q.answer))
    .filter(Boolean);
  const used = new Set(answers);

  if (answers.length < 3) {
    errors.push("TFNG passage needs at least 3 questions to validate balance");
    return { valid: false, errors };
  }

  for (const required of ["TRUE", "FALSE", "NOT GIVEN"]) {
    if (!used.has(required)) {
      errors.push(
        `TFNG passage must include ${required} in the answer key (found: ${[...used].join(", ")})`
      );
    }
  }

  return { valid: errors.length === 0, errors, usedTypes: [...used] };
}

/**
 * @param {object} content
 */
export function validateReadingPracticeContent(content) {
  const slug = normalizeQuestionType(content.slug ?? "");
  const errors = [];

  if (READING_INCOMPLETE_UI_TYPES.has(slug)) {
    errors.push(
      `${slug} practice is not fully built yet — matching lists and selectors are still in development`
    );
    return { valid: false, errors };
  }

  if (slug === "matching-headings") {
    const finalized = finalizeMatchingHeadingsContent(content);
    const check = validateMatchingHeadingsContent(finalized);
    return { valid: check.valid, errors: check.errors, content: finalized };
  }

  if (slug === "multiple-choice") {
    for (const q of content.questions ?? []) {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`Question ${q.id}: multiple-choice options missing`);
      }
    }
  }

  if (slug === "true-false-not-given") {
    const balanceCheck = validateTfngAnswerBalance(content.questions ?? []);
    if (!balanceCheck.valid) {
      errors.push(...balanceCheck.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    content,
  };
}
