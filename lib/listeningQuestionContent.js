/**
 * Detect auto-filled / placeholder listening question content that must never ship to students.
 */

import { isGapFillQuestionType } from "./listeningSectionTypes.js";

const ITEM_LABEL_RE = /^Item\s+\d+\s*:?\s*$/i;
const QUESTION_LABEL_RE = /^Question\s+\d+\.?\s*$/i;
const GENERIC_MCQ_OPTION_RE = /^Option\s+[A-E]\s*$/i;
const MCQ_LETTERS = ["A", "B", "C", "D", "E"];
const OBJECT_OBJECT = "[object Object]";

/**
 * @param {unknown} value
 * @param {number} [depth]
 * @returns {string}
 */
function extractDisplayText(value, depth = 0) {
  if (value == null || depth > 4) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const record = /** @type {Record<string, unknown>} */ (value);
    for (const key of [
      "text",
      "label",
      "value",
      "content",
      "option",
      "choice",
      "answer",
      "description",
    ]) {
      const nested = extractDisplayText(record[key], depth + 1);
      if (nested) return nested;
    }
  }
  return "";
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isInvalidListeningDisplayText(value) {
  const text = extractDisplayText(value) || String(value ?? "").trim();
  return !text || text === OBJECT_OBJECT;
}

/**
 * @param {Record<string, unknown>} record
 * @returns {string}
 */
function extractOptionLetter(record) {
  for (const key of ["letter", "key", "label"]) {
    const raw = record[key];
    const direct = String(raw ?? "").trim();
    if (direct.length === 1 && /^[A-E]$/i.test(direct)) {
      return direct.toUpperCase();
    }
    const nested = extractDisplayText(raw);
    if (nested.length === 1 && /^[A-E]$/i.test(nested)) {
      return nested.toUpperCase();
    }
  }
  return "";
}

/**
 * @param {unknown} opt
 * @param {number} optIndex
 * @returns {{ label: string, text: string }}
 */
export function normalizeListeningMcqOption(opt, optIndex) {
  const defaultLabel = MCQ_LETTERS[optIndex] ?? String(optIndex + 1);

  if (typeof opt === "string") {
    const trimmed = opt.trim();
    const letterMatch = trimmed.match(/^([A-E])[\.\):\-]\s*(.*)$/i);
    if (letterMatch) {
      return {
        label: letterMatch[1].toUpperCase(),
        text: letterMatch[2].trim() || trimmed,
      };
    }
    return { label: defaultLabel, text: trimmed };
  }

  if (opt && typeof opt === "object") {
    const record = /** @type {Record<string, unknown>} */ (opt);
    const letter = extractOptionLetter(record);
    const textFromText = extractDisplayText(record.text);
    const textFromValue = extractDisplayText(record.value);
    const textFromOption = extractDisplayText(record.option);
    const textFromChoice = extractDisplayText(record.choice);
    const labelRaw = String(record.label ?? "").trim();
    const labelAsLetter =
      labelRaw.length === 1 && /^[A-E]$/i.test(labelRaw)
        ? labelRaw.toUpperCase()
        : "";
    const textFromLabel =
      labelRaw && !labelAsLetter ? extractDisplayText(record.label) || labelRaw : "";

    const text =
      textFromText ||
      textFromValue ||
      textFromOption ||
      textFromChoice ||
      textFromLabel;

    const resolvedLabel = letter || labelAsLetter || defaultLabel;

    if (text) {
      return { label: resolvedLabel, text };
    }
    if (labelAsLetter) {
      return { label: labelAsLetter, text: "" };
    }
  }

  return { label: defaultLabel, text: "" };
}

/**
 * Coerce bank/agent MCQ shapes (strings, { key, label }, { label, text }) into UI format.
 * @param {unknown} options
 * @returns {{ label: string, text: string }[]}
 */
export function normalizeListeningMcqOptions(options) {
  if (options && typeof options === "object" && !Array.isArray(options)) {
    return Object.entries(/** @type {Record<string, unknown>} */ (options)).map(
      ([key, value], index) =>
        normalizeListeningMcqOption({ key, text: value, label: value }, index)
    );
  }
  if (!Array.isArray(options)) return [];
  return options.map((opt, index) => normalizeListeningMcqOption(opt, index));
}

/**
 * @param {unknown} options
 * @returns {{ label: string, text: string }[]}
 */
export function normalizeListeningMatchingOptions(options) {
  if (!Array.isArray(options) || options.length === 0) return [];
  return options.map((opt, index) => {
    const normalized = normalizeListeningMcqOption(opt, index);
    return {
      label: normalized.label || MCQ_LETTERS[index] || String(index + 1),
      text: normalized.text,
    };
  });
}

/**
 * @param {object} q
 */
export function normalizeListeningQuestionFields(q) {
  if (!q || typeof q !== "object") return q;
  const type = String(q.type ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (type === "multiple-choice") {
    let options = normalizeListeningMcqOptions(q.options);
    const needsFallback =
      options.length < 2 ||
      options.every((opt) => isInvalidListeningDisplayText(opt.text));
    if (needsFallback) {
      options = normalizeListeningMcqOptions(coalesceQuestionOptionsRaw(q));
    }
    return {
      ...q,
      options,
    };
  }

  if (type === "matching") {
    let options = normalizeListeningMatchingOptions(q.options);
    if (options.length < 2) {
      options = normalizeListeningMatchingOptions(coalesceQuestionOptionsRaw(q));
    }
    return {
      ...q,
      options,
    };
  }

  return q;
}

/**
 * @param {Array<{ chooseCount?: number }>} questions
 */
export function getMcqChooseCountForQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return 1;
  return Math.max(
    1,
    ...questions.map((q) => Number(q?.chooseCount ?? 1) || 1)
  );
}

/**
 * @param {unknown} answerKey
 * @returns {Record<string, string>}
 */
function flattenAnswerKey(answerKey) {
  const flat = /** @type {Record<string, string>} */ ({});
  if (!answerKey || typeof answerKey !== "object") return flat;

  const walk = (node, prefix = "") => {
    if (node == null) return;
    if (typeof node === "string" || typeof node === "number") {
      if (prefix) flat[prefix] = String(node).trim();
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, prefix ? `${prefix}.${index}` : String(index)));
      return;
    }
    if (typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        const next = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "string" || typeof value === "number") {
          flat[next] = String(value).trim();
          flat[String(key)] = String(value).trim();
        } else {
          walk(value, next);
        }
      }
    }
  };

  walk(answerKey);
  return flat;
}

/**
 * @param {object} q
 */
export function coalesceQuestionAnswer(q) {
  if (!q || typeof q !== "object") return "";
  for (const field of [
    "answer",
    "correct_answer",
    "correctAnswer",
    "correct",
    "solution",
  ]) {
    const value = q[field];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

/**
 * @param {object} q
 * @returns {unknown[]}
 */
export function coalesceQuestionOptionsRaw(q) {
  if (!q || typeof q !== "object") return [];

  const opts = q.options;
  if (opts && typeof opts === "object" && !Array.isArray(opts)) {
    return Object.entries(/** @type {Record<string, unknown>} */ (opts)).map(
      ([key, value]) => ({ key, text: value, label: value })
    );
  }

  if (Array.isArray(q.choices) && q.choices.length) return q.choices;
  if (Array.isArray(q.optionList) && q.optionList.length) return q.optionList;
  if (Array.isArray(opts) && opts.length) return opts;

  const fromFields = [];
  for (const letter of MCQ_LETTERS) {
    const lower = letter.toLowerCase();
    const rootValue = q[letter] ?? q[lower];
    if (rootValue != null && String(rootValue).trim()) {
      fromFields.push({ label: letter, text: String(rootValue).trim() });
      continue;
    }
    for (const key of [
      `option_${lower}`,
      `option${letter}`,
      `choice_${lower}`,
      `choice${letter}`,
    ]) {
      const value = q[key];
      if (value != null && String(value).trim()) {
        fromFields.push({ label: letter, text: String(value).trim() });
        break;
      }
    }
  }

  return fromFields;
}

/**
 * Merge answer_key / alternate field names before normalization.
 * @param {unknown} rawQuestions
 * @param {unknown} [answerKey]
 */
export function hydrateListeningQuestionsFromPayload(rawQuestions, answerKey) {
  const list = Array.isArray(rawQuestions) ? rawQuestions : [];
  const keyEntries = flattenAnswerKey(answerKey);

  return list.map((item, index) => {
    const q = item && typeof item === "object" ? { ...item } : {};
    const num = coalesceQuestionNumber(q, index + 1);
    const answerFromKey =
      keyEntries[String(num)] ??
      keyEntries[`q${num}`] ??
      keyEntries[`question_${num}`] ??
      "";

    return {
      ...q,
      text: coalesceQuestionText(q),
      answer: coalesceQuestionAnswer(q) || answerFromKey,
      options: coalesceQuestionOptionsRaw(q),
    };
  });
}

/**
 * @param {object} q
 * @param {number} [fallback]
 */
export function coalesceQuestionNumber(q, fallback = null) {
  const num = Number(q?.questionNumber ?? q?.number ?? q?.id ?? fallback);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * @param {object} q
 */
export function coalesceQuestionText(q) {
  if (!q || typeof q !== "object") return "";
  const candidates = [q.text, q.question, q.stem, q.label, q.prompt];
  for (const value of candidates) {
    const trimmed = String(value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

/**
 * @param {object} q
 */
export function isListeningPlaceholderQuestion(q) {
  if (!q || typeof q !== "object") return true;
  if (q._contentMissing === true) return true;

  const text = coalesceQuestionText(q);
  const answer = coalesceQuestionAnswer(q).toLowerCase();
  const explanation = String(q.explanation ?? "").trim().toLowerCase();

  if (answer === "unknown") return true;
  if (explanation.includes("auto-filled")) return true;
  if (ITEM_LABEL_RE.test(text)) return true;
  if (QUESTION_LABEL_RE.test(text)) return true;

  const type = String(q.type ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (type === "multiple-choice") {
    const options = normalizeListeningMcqOptions(q.options);
    if (options.length < 2) return true;
    if (options.some((opt) => isInvalidListeningDisplayText(opt.text))) return true;
    if (
      options.length >= 3 &&
      options.every((opt) =>
        GENERIC_MCQ_OPTION_RE.test(String(opt.text ?? "").trim())
      )
    ) {
      return true;
    }
  }

  if (isGapFillQuestionType(type) && !text) return true;

  return false;
}

/**
 * @param {Array<object>} questions
 * @param {number} [sectionNumber]
 */
export function validateListeningQuestionContent(questions, sectionNumber = null) {
  const errors = [];
  const list = Array.isArray(questions) ? questions : [];

  for (const q of list) {
    const num = coalesceQuestionNumber(q) ?? "?";
    if (isListeningPlaceholderQuestion(q)) {
      errors.push(
        `Q${num}: placeholder or missing question content (label "${coalesceQuestionText(q) || "(empty)"}")`
      );
      continue;
    }

    const type = String(q.type ?? "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");
    const text = coalesceQuestionText(q);
    const answer = coalesceQuestionAnswer(q);

    if (!answer) {
      errors.push(`Q${num}: missing answer`);
    }

    if (type === "form-completion") {
      if (text.length < 3 || !/[a-z]/i.test(text)) {
        errors.push(
          `Q${num}: form-completion label must be a real field (e.g. "Customer name:"), got "${text}"`
        );
      }
    }

    if (isGapFillQuestionType(type) && text.length < 3 && !/_{3,}|\[\s*\]/.test(text)) {
      errors.push(`Q${num}: gap-fill question text is too short or empty`);
    }

    if (type === "multiple-choice") {
      const options = normalizeListeningMcqOptions(q.options);
      if (options.length < 2) {
        errors.push(`Q${num}: multiple-choice needs at least 2 options`);
      }
      for (const opt of options) {
        if (isInvalidListeningDisplayText(opt.text)) {
          errors.push(`Q${num}: multiple-choice option ${opt.label || "?"} is empty`);
        }
      }
    }
  }

  if (sectionNumber != null && list.some(isListeningPlaceholderQuestion)) {
    errors.push(
      `Section ${sectionNumber}: content contains incomplete questions — regenerate this section`
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @param {Array<object>} questions
 */
export function sectionHasPlaceholderQuestions(questions) {
  return (Array.isArray(questions) ? questions : []).some(
    isListeningPlaceholderQuestion
  );
}
