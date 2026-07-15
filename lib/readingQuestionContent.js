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
export const READING_INCOMPLETE_UI_TYPES = new Set([]);

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "from",
  "by",
  "with",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
  "their",
  "there",
  "which",
  "who",
  "whom",
  "what",
  "when",
  "where",
  "why",
  "how",
  "into",
  "about",
  "over",
  "under",
  "between",
  "among",
  "than",
  "then",
  "also",
  "only",
  "more",
  "most",
  "some",
  "such",
  "no",
  "not",
  "nor",
  "can",
  "could",
  "may",
  "might",
  "must",
  "shall",
  "should",
  "will",
  "would",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "reference",
  "mention",
  "description",
  "example",
  "following",
  "information",
  "paragraph",
]);

/**
 * Normalize a letter answer to A–I (paragraphs A–G; sentence endings A–I).
 * @param {unknown} value
 */
export function normalizeParagraphLetter(value) {
  const raw = String(value ?? "").trim().toUpperCase();
  const m = raw.match(/\b([A-I])\b/);
  return m ? m[1] : raw.replace(/[^A-I]/g, "").slice(0, 1);
}

/**
 * @param {string} text
 */
export function isGenericMatchingInformationPrompt(text) {
  return /which\s+paragraph\s+contains|match\s+(the\s+)?(information|statements?)/i.test(
    String(text ?? "")
  ) && String(text ?? "").trim().length < 60;
}

/**
 * Significant content tokens for lightweight evidence checks.
 * @param {string} text
 */
export function extractContentTokens(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

/**
 * True when evidence quote (or key statement tokens) appear in the answer paragraph.
 * @param {string} statement
 * @param {string} paragraphText
 * @param {string} [evidence]
 */
export function statementSupportedByParagraph(statement, paragraphText, evidence) {
  const para = String(paragraphText ?? "").toLowerCase();
  if (!para.trim()) return false;

  const quote = String(evidence ?? "").trim();
  if (quote.length >= 12) {
    if (quoteAppearsInText(quote, para)) return true;
    // Evidence was supplied but does not appear in the target text — fail closed
    return false;
  }

  const statementTokens = extractContentTokens(statement);
  if (statementTokens.length === 0) return false;
  const hits = statementTokens.filter((t) => para.includes(t)).length;
  // Paraphrase-friendly: require at least 2 shared content tokens, or ≥40% if short
  if (statementTokens.length <= 4) return hits >= 2;
  return hits / statementTokens.length >= 0.4 || hits >= 3;
}

/**
 * Loose evidence matching: exact span, punct-stripped span, or strong token/window overlap.
 * @param {string} quote
 * @param {string} text already lowercased preferred
 */
export function quoteAppearsInText(quote, text) {
  const normalize = (s) =>
    String(s ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const q = normalize(quote);
  const t = normalize(text);
  if (!q || !t) return false;
  if (t.includes(q)) return true;

  const qWords = q.split(" ").filter((w) => w.length > 2);
  if (qWords.length === 0) return false;

  // Contiguous window of 5+ content words from the quote
  const windowSize = Math.min(5, qWords.length);
  for (let i = 0; i <= qWords.length - windowSize; i += 1) {
    const window = qWords.slice(i, i + windowSize).join(" ");
    if (t.includes(window)) return true;
  }

  const hits = qWords.filter((w) => t.includes(w)).length;
  if (qWords.length <= 4) return hits >= Math.max(2, qWords.length - 1);
  return hits / qWords.length >= 0.6;
}

/**
 * @param {Array<{ id: string, label: string, text: string }>} paragraphs
 */
export function paragraphLettersFromContent(paragraphs = []) {
  return paragraphs
    .map((p) => {
      const fromLabel = String(p.label ?? "").match(/\b([A-G])\b/i)?.[1];
      if (fromLabel) return fromLabel.toUpperCase();
      const fromId = String(p.id ?? "").match(/p([A-G])$/i)?.[1];
      return fromId ? fromId.toUpperCase() : null;
    })
    .filter(Boolean);
}

/**
 * @param {object} content
 */
export function finalizeMatchingInformationContent(content) {
  const slug = normalizeQuestionType(content.slug ?? content.questionType ?? "");
  if (slug !== "matching-information") return content;

  const paragraphs = Array.isArray(content.paragraphs) ? content.paragraphs : [];
  const letterSet = new Set(paragraphLettersFromContent(paragraphs));

  const questions = (Array.isArray(content.questions) ? content.questions : [])
    .map((q, index) => {
      const correct = normalizeParagraphLetter(q.correct ?? q.answer);
      const evidence = String(q.evidence ?? q.explanation ?? "").trim();
      return {
        ...q,
        id: String(q.id ?? `mi-${index + 1}`),
        kind: "matching-information",
        text: String(q.text ?? q.statement ?? q.prompt ?? "").trim(),
        correct,
        answer: correct,
        evidence: evidence || undefined,
        options: letterSet.size
          ? [...letterSet].sort().map((letter) => ({
              key: letter,
              label: `Paragraph ${letter}`,
            }))
          : q.options,
      };
    })
    .filter((q) => q.text.length > 0);

  return {
    ...content,
    slug,
    questions,
  };
}

/**
 * @param {object} content
 */
export function validateMatchingInformationContent(content) {
  const errors = [];
  const paragraphs = content.paragraphs ?? [];
  const questions = content.questions ?? [];
  const letters = paragraphLettersFromContent(paragraphs);
  const letterSet = new Set(letters);

  if (paragraphs.length < 3) {
    errors.push(
      `Matching information needs at least 3 labeled paragraphs (found ${paragraphs.length})`
    );
  }

  if (letterSet.size < 3) {
    errors.push("Matching information paragraphs must be labeled A, B, C…");
  }

  if (questions.length < 3) {
    errors.push(
      `Matching information needs at least 3 information statements (found ${questions.length})`
    );
  }

  if (
    questions.length === 1 &&
    isGenericMatchingInformationPrompt(questions[0].text)
  ) {
    errors.push(
      "Matching information shows a generic instruction only — no specific information statements"
    );
  }

  /** @type {string[]} */
  const answerLetters = [];

  for (const q of questions) {
    const answer = normalizeParagraphLetter(q.correct ?? q.answer);
    if (!answer || !/^[A-G]$/.test(answer)) {
      errors.push(`Question ${q.id}: answer must be a paragraph letter A–G`);
      continue;
    }
    if (!letterSet.has(answer)) {
      errors.push(
        `Question ${q.id}: answer "${answer}" is not a paragraph in this passage (${[...letterSet].join(", ")})`
      );
      continue;
    }
    answerLetters.push(answer);

    if (isGenericMatchingInformationPrompt(q.text) && q.text.length < 40) {
      errors.push(`Question ${q.id}: statement is too generic`);
    }

    const para = paragraphs.find((p) => {
      const label = String(p.label ?? "").match(/\b([A-G])\b/i)?.[1]?.toUpperCase();
      const idLetter = String(p.id ?? "").match(/p([A-G])$/i)?.[1]?.toUpperCase();
      return label === answer || idLetter === answer;
    });

    if (
      para &&
      !statementSupportedByParagraph(q.text, para.text, q.evidence ?? q.explanation)
    ) {
      errors.push(
        `Question ${q.id}: answer key "${answer}" is not supported by paragraph ${answer} content`
      );
    }
  }

  // Exam-faithful: allow reuse and unused paragraphs — reject forced 1-to-1 only.
  if (answerLetters.length >= 3 && letterSet.size >= 3) {
    const uniqueAnswers = new Set(answerLetters);
    const hasReuse = uniqueAnswers.size < answerLetters.length;
    const hasUnused = [...letterSet].some((l) => !uniqueAnswers.has(l));
    const looksOneToOne =
      !hasReuse &&
      !hasUnused &&
      uniqueAnswers.size === letterSet.size &&
      answerLetters.length === letterSet.size;

    if (looksOneToOne) {
      errors.push(
        "Matching information must not be a forced 1-to-1 mapping — some paragraphs may contain more than one answer and some may contain none"
      );
    }
  }

  return { valid: errors.length === 0, errors, letters: [...letterSet] };
}

/**
 * Normalize classification category options (A–D usually).
 * @param {unknown} raw
 * @returns {{ key: string, label: string }[]}
 */
export function normalizeCategoryOptions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        const m = trimmed.match(/^([A-D])[\.\)\:\-]?\s+(.*)$/i);
        if (m) {
          return { key: m[1].toUpperCase(), label: m[2].trim() };
        }
        return {
          key: String.fromCharCode(65 + index),
          label: trimmed,
        };
      }
      if (item && typeof item === "object") {
        const record = /** @type {Record<string, unknown>} */ (item);
        const label = String(
          record.label ?? record.name ?? record.text ?? record.category ?? ""
        ).trim();
        const key = normalizeParagraphLetter(
          record.key ?? record.id ?? String.fromCharCode(65 + index)
        );
        return { key: key || String.fromCharCode(65 + index), label };
      }
      return { key: "", label: "" };
    })
    .filter((c) => c.label.length > 0 && /^[A-D]$/.test(c.key));
}

/**
 * @param {Array<object>} questionsRaw
 * @param {object} [bankRow]
 */
export function extractSharedCategories(questionsRaw, bankRow = {}) {
  if (Array.isArray(bankRow.categories)) {
    const fromRow = normalizeCategoryOptions(bankRow.categories);
    if (fromRow.length > 0) return fromRow;
  }
  const questions = Array.isArray(questionsRaw) ? questionsRaw : [];
  for (const q of questions) {
    if (Array.isArray(q.categories) && q.categories.length > 0) {
      return normalizeCategoryOptions(q.categories);
    }
    if (Array.isArray(q.options) && q.options.length >= 2) {
      const asCats = normalizeCategoryOptions(q.options);
      if (asCats.length >= 2) return asCats;
    }
  }
  return [];
}

/**
 * @param {string} text
 */
export function isGenericClassificationPrompt(text) {
  return (
    /classify\s+(each|the)|match\s+(each\s+)?(statement|item)/i.test(
      String(text ?? "")
    ) && String(text ?? "").trim().length < 60
  );
}

/**
 * Evidence for classification must appear somewhere in the passage.
 * Prefer quote match; fall back to statement token overlap with full passage.
 * @param {string} statement
 * @param {string} passageText
 * @param {string} [evidence]
 */
export function statementSupportedByPassage(statement, passageText, evidence) {
  return statementSupportedByParagraph(statement, passageText, evidence);
}

/**
 * @param {object} content
 */
export function finalizeClassificationContent(content) {
  const slug = normalizeQuestionType(content.slug ?? content.questionType ?? "");
  if (slug !== "classification") return content;

  const categories = extractSharedCategories(content.questions, content);
  const questions = (Array.isArray(content.questions) ? content.questions : [])
    .map((q, index) => {
      const correct = normalizeParagraphLetter(q.correct ?? q.answer);
      const evidence = String(q.evidence ?? q.explanation ?? "").trim();
      return {
        ...q,
        id: String(q.id ?? `cl-${index + 1}`),
        kind: "classification",
        text: String(q.text ?? q.statement ?? q.prompt ?? "").trim(),
        correct,
        answer: correct,
        evidence: evidence || undefined,
        categories,
        options: categories.map((c) => ({
          key: c.key,
          label: `${c.key}. ${c.label}`,
        })),
      };
    })
    .filter((q) => q.text.length > 0);

  const instructions =
    categories.length > 0
      ? `Classify each statement according to the categories below. Write the correct letter, ${categories[0].key}–${categories[categories.length - 1].key}. You may use any letter more than once.`
      : content.instructions;

  return {
    ...content,
    slug,
    categories,
    instructions: instructions || content.instructions,
    questions,
  };
}

/**
 * @param {object} content
 */
export function validateClassificationContent(content) {
  const errors = [];
  const paragraphs = content.paragraphs ?? [];
  const questions = content.questions ?? [];
  const categories =
    content.categories?.length > 0
      ? content.categories
      : extractSharedCategories(questions, content);
  const categoryKeys = new Set(categories.map((c) => c.key));
  const passageText = paragraphs.map((p) => p.text).join(" ");

  if (categories.length < 2 || categories.length > 4) {
    errors.push(
      `Classification needs 2–4 named categories (found ${categories.length})`
    );
  }

  if (paragraphs.length < 2) {
    errors.push("Classification passage needs at least 2 paragraphs of content");
  }

  if (questions.length < 3) {
    errors.push(
      `Classification needs at least 3 statements to classify (found ${questions.length})`
    );
  }

  if (
    questions.length === 1 &&
    isGenericClassificationPrompt(questions[0].text)
  ) {
    errors.push(
      "Classification shows a generic instruction only — no specific statements"
    );
  }

  const passageLower = passageText.toLowerCase();
  for (const cat of categories) {
    const labelTokens = extractContentTokens(cat.label);
    const labelHit =
      passageLower.includes(cat.label.toLowerCase()) ||
      (labelTokens.length > 0 &&
        labelTokens.some((t) => passageLower.includes(t)));
    if (!labelHit) {
      errors.push(
        `Category ${cat.key} ("${cat.label}") is not clearly mentioned in the passage`
      );
    }
  }

  /** @type {string[]} */
  const answerLetters = [];

  for (const q of questions) {
    const answer = normalizeParagraphLetter(q.correct ?? q.answer);
    if (!answer || !/^[A-D]$/.test(answer)) {
      errors.push(`Question ${q.id}: answer must be a category letter A–D`);
      continue;
    }
    if (!categoryKeys.has(answer)) {
      errors.push(
        `Question ${q.id}: answer "${answer}" is not in the category list (${[...categoryKeys].join(", ")})`
      );
      continue;
    }
    answerLetters.push(answer);

    if (isGenericClassificationPrompt(q.text) && q.text.length < 40) {
      errors.push(`Question ${q.id}: statement is too generic`);
    }

    if (
      !statementSupportedByPassage(
        q.text,
        passageText,
        q.evidence ?? q.explanation
      )
    ) {
      errors.push(
        `Question ${q.id}: answer key "${answer}" is not supported by passage evidence`
      );
    }
  }

  if (answerLetters.length >= 3 && categoryKeys.size >= 2) {
    const uniqueAnswers = new Set(answerLetters);
    const hasReuse = uniqueAnswers.size < answerLetters.length;
    const hasUnused = [...categoryKeys].some((k) => !uniqueAnswers.has(k));
    const looksOneToOne =
      !hasReuse &&
      !hasUnused &&
      uniqueAnswers.size === categoryKeys.size &&
      answerLetters.length === categoryKeys.size;

    if (looksOneToOne) {
      errors.push(
        "Classification must not be a forced 1-to-1 mapping — categories may be reused and some may be unused"
      );
    }
  }

  return { valid: errors.length === 0, errors, categories };
}

/**
 * Normalize matching-features list (typically people/places A–E).
 * @param {unknown} raw
 * @returns {{ key: string, label: string }[]}
 */
export function normalizeFeatureOptions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        const m = trimmed.match(/^([A-F])[\.\)\:\-]?\s+(.*)$/i);
        if (m) {
          return { key: m[1].toUpperCase(), label: m[2].trim() };
        }
        return {
          key: String.fromCharCode(65 + index),
          label: trimmed,
        };
      }
      if (item && typeof item === "object") {
        const record = /** @type {Record<string, unknown>} */ (item);
        const label = String(
          record.label ??
            record.name ??
            record.text ??
            record.feature ??
            record.person ??
            ""
        ).trim();
        const key = normalizeParagraphLetter(
          record.key ?? record.id ?? String.fromCharCode(65 + index)
        );
        return { key: key || String.fromCharCode(65 + index), label };
      }
      return { key: "", label: "" };
    })
    .filter((f) => f.label.length > 0 && /^[A-F]$/.test(f.key));
}

/**
 * @param {Array<object>} questionsRaw
 * @param {object} [bankRow]
 */
export function extractSharedFeatures(questionsRaw, bankRow = {}) {
  if (Array.isArray(bankRow.features)) {
    const fromRow = normalizeFeatureOptions(bankRow.features);
    if (fromRow.length > 0) return fromRow;
  }
  const questions = Array.isArray(questionsRaw) ? questionsRaw : [];
  for (const q of questions) {
    if (Array.isArray(q.features) && q.features.length > 0) {
      return normalizeFeatureOptions(q.features);
    }
    if (Array.isArray(q.options) && q.options.length >= 2) {
      const asFeatures = normalizeFeatureOptions(q.options);
      if (asFeatures.length >= 2) return asFeatures;
    }
  }
  return [];
}

/**
 * @param {string} text
 */
export function isGenericMatchingFeaturesPrompt(text) {
  return (
    /match\s+(each\s+)?(statement|feature|opinion)|which\s+(person|feature|researcher)/i.test(
      String(text ?? "")
    ) && String(text ?? "").trim().length < 60
  );
}

/**
 * @param {object} content
 */
export function finalizeMatchingFeaturesContent(content) {
  const slug = normalizeQuestionType(content.slug ?? content.questionType ?? "");
  if (slug !== "matching-features") return content;

  const features = extractSharedFeatures(content.questions, content);
  const questions = (Array.isArray(content.questions) ? content.questions : [])
    .map((q, index) => {
      const correct = normalizeParagraphLetter(q.correct ?? q.answer);
      const evidence = String(q.evidence ?? q.explanation ?? "").trim();
      return {
        ...q,
        id: String(q.id ?? `mf-${index + 1}`),
        kind: "matching-features",
        text: String(q.text ?? q.statement ?? q.prompt ?? "").trim(),
        correct,
        answer: correct,
        evidence: evidence || undefined,
        features,
        options: features.map((f) => ({
          key: f.key,
          label: `${f.key}. ${f.label}`,
        })),
      };
    })
    .filter((q) => q.text.length > 0);

  const instructions =
    features.length > 0
      ? `Look at the following statements. Match each statement with the correct feature. Write the correct letter, ${features[0].key}–${features[features.length - 1].key}. You may use any letter more than once.`
      : content.instructions;

  return {
    ...content,
    slug,
    features,
    instructions: instructions || content.instructions,
    questions,
  };
}

/**
 * @param {object} content
 */
export function validateMatchingFeaturesContent(content) {
  const errors = [];
  const paragraphs = content.paragraphs ?? [];
  const questions = content.questions ?? [];
  const features =
    content.features?.length > 0
      ? content.features
      : extractSharedFeatures(questions, content);
  const featureKeys = new Set(features.map((f) => f.key));
  const passageText = paragraphs.map((p) => p.text).join(" ");

  if (features.length < 3 || features.length > 6) {
    errors.push(
      `Matching features needs 3–6 named features (found ${features.length})`
    );
  }

  if (paragraphs.length < 2) {
    errors.push("Matching features passage needs at least 2 paragraphs of content");
  }

  if (questions.length < 3) {
    errors.push(
      `Matching features needs at least 3 statements (found ${questions.length})`
    );
  }

  if (
    questions.length === 1 &&
    isGenericMatchingFeaturesPrompt(questions[0].text)
  ) {
    errors.push(
      "Matching features shows a generic instruction only — no specific statements"
    );
  }

  const passageLower = passageText.toLowerCase();
  for (const feature of features) {
    const labelTokens = extractContentTokens(feature.label);
    const labelHit =
      passageLower.includes(feature.label.toLowerCase()) ||
      (labelTokens.length > 0 &&
        labelTokens.some((t) => passageLower.includes(t)));
    if (!labelHit) {
      errors.push(
        `Feature ${feature.key} ("${feature.label}") is not clearly mentioned in the passage`
      );
    }
  }

  /** @type {string[]} */
  const answerLetters = [];

  for (const q of questions) {
    const answer = normalizeParagraphLetter(q.correct ?? q.answer);
    if (!answer || !/^[A-F]$/.test(answer)) {
      errors.push(`Question ${q.id}: answer must be a feature letter A–F`);
      continue;
    }
    if (!featureKeys.has(answer)) {
      errors.push(
        `Question ${q.id}: answer "${answer}" is not in the feature list (${[...featureKeys].join(", ")})`
      );
      continue;
    }
    answerLetters.push(answer);

    if (isGenericMatchingFeaturesPrompt(q.text) && q.text.length < 40) {
      errors.push(`Question ${q.id}: statement is too generic`);
    }

    if (
      !statementSupportedByPassage(
        q.text,
        passageText,
        q.evidence ?? q.explanation
      )
    ) {
      errors.push(
        `Question ${q.id}: answer key "${answer}" is not supported by passage evidence`
      );
    }
  }

  // Allow reuse and unused features — reject forced 1-to-1 only.
  if (answerLetters.length >= 3 && featureKeys.size >= 3) {
    const uniqueAnswers = new Set(answerLetters);
    const hasReuse = uniqueAnswers.size < answerLetters.length;
    const hasUnused = [...featureKeys].some((k) => !uniqueAnswers.has(k));
    const looksOneToOne =
      !hasReuse &&
      !hasUnused &&
      uniqueAnswers.size === featureKeys.size &&
      answerLetters.length === featureKeys.size;

    if (looksOneToOne) {
      errors.push(
        "Matching features must not be a forced 1-to-1 mapping — features may be reused and some may be unused"
      );
    }
  }

  return { valid: errors.length === 0, errors, features };
}

const ENDING_LETTER_KEYS = "ABCDEFGHI".split("");

/**
 * Normalize sentence-ending options (A–I).
 * @param {unknown} raw
 * @returns {{ key: string, label: string }[]}
 */
export function normalizeEndingOptions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        const m = trimmed.match(/^([A-I])[\.\)\:\-]?\s+(.*)$/i);
        if (m) {
          return { key: m[1].toUpperCase(), label: m[2].trim() };
        }
        return {
          key: ENDING_LETTER_KEYS[index] ?? String.fromCharCode(65 + index),
          label: trimmed,
        };
      }
      if (item && typeof item === "object") {
        const record = /** @type {Record<string, unknown>} */ (item);
        const label = String(
          record.label ?? record.text ?? record.ending ?? record.option ?? ""
        ).trim();
        const rawKey = String(record.key ?? record.id ?? ENDING_LETTER_KEYS[index] ?? "")
          .trim()
          .toUpperCase();
        const key = /^[A-I]$/.test(rawKey)
          ? rawKey
          : ENDING_LETTER_KEYS[index] ?? String.fromCharCode(65 + index);
        return { key, label };
      }
      return { key: "", label: "" };
    })
    .filter((e) => e.label.length > 0 && /^[A-I]$/.test(e.key));
}

/**
 * @param {Array<object>} questionsRaw
 * @param {object} [bankRow]
 */
export function extractSharedEndings(questionsRaw, bankRow = {}) {
  if (Array.isArray(bankRow.endings)) {
    const fromRow = normalizeEndingOptions(bankRow.endings);
    if (fromRow.length > 0) return fromRow;
  }
  if (Array.isArray(bankRow.sentenceEndings)) {
    const fromRow = normalizeEndingOptions(bankRow.sentenceEndings);
    if (fromRow.length > 0) return fromRow;
  }
  const questions = Array.isArray(questionsRaw) ? questionsRaw : [];
  for (const q of questions) {
    if (Array.isArray(q.endings) && q.endings.length > 0) {
      return normalizeEndingOptions(q.endings);
    }
    if (Array.isArray(q.options) && q.options.length >= 3) {
      const asEndings = normalizeEndingOptions(q.options);
      if (asEndings.length >= 3) return asEndings;
    }
  }
  return [];
}

/**
 * @param {string} text
 */
export function isGenericSentenceEndingsPrompt(text) {
  return (
    /complete\s+(each|the)\s+sentence|match\s+(the\s+)?(sentence\s+)?endings?/i.test(
      String(text ?? "")
    ) && String(text ?? "").trim().length < 70
  );
}

/**
 * True when a distractor ending could plausibly complete a beginning from passage evidence.
 * Flags cases where the same passage region strongly supports both the beginning and the ending.
 * @param {string} beginning
 * @param {string} endingLabel
 * @param {string} passageText
 */
export function isAmbiguousSentenceEndingPair(beginning, endingLabel, passageText) {
  const begTokens = extractContentTokens(beginning);
  const endTokens = extractContentTokens(endingLabel);
  if (begTokens.length < 2 || endTokens.length < 3) return false;

  const chunks = String(passageText ?? "")
    .toLowerCase()
    .split(/[\.\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 50);

  for (const chunk of chunks) {
    const begHits = begTokens.filter((t) => chunk.includes(t)).length;
    const endHits = endTokens.filter((t) => chunk.includes(t)).length;
    // Require strong co-support in the same sentence — weak shared academic vocab alone is not enough
    if (
      begHits >= 3 &&
      endHits >= 3 &&
      begHits / begTokens.length >= 0.5 &&
      endHits / endTokens.length >= 0.55
    ) {
      return true;
    }
  }
  return false;
}

/**
 * @param {object} content
 */
export function finalizeMatchingSentenceEndingsContent(content) {
  const slug = normalizeQuestionType(content.slug ?? content.questionType ?? "");
  if (slug !== "matching-sentence-endings") return content;

  const endings = extractSharedEndings(content.questions, content);
  const questions = (Array.isArray(content.questions) ? content.questions : [])
    .map((q, index) => {
      const correct = normalizeParagraphLetter(q.correct ?? q.answer);
      const evidence = String(q.evidence ?? q.explanation ?? "").trim();
      return {
        ...q,
        id: String(q.id ?? `mse-${index + 1}`),
        kind: "matching-sentence-endings",
        text: String(q.text ?? q.beginning ?? q.statement ?? q.prompt ?? "").trim(),
        correct,
        answer: correct,
        evidence: evidence || undefined,
        endings,
        options: endings.map((e) => ({
          key: e.key,
          label: e.label,
        })),
      };
    })
    .filter((q) => q.text.length > 0);

  const first = endings[0]?.key ?? "A";
  const last = endings[endings.length - 1]?.key ?? "H";
  const instructions =
    endings.length > 0
      ? `Complete each sentence with the correct ending. Choose from the box below and write the correct letter, ${first}–${last}. There are more endings than sentences. NB You may use each letter once only.`
      : content.instructions;

  return {
    ...content,
    slug,
    endings,
    instructions: instructions || content.instructions,
    questions,
  };
}

/**
 * @param {object} content
 */
export function validateMatchingSentenceEndingsContent(content) {
  const errors = [];
  const paragraphs = content.paragraphs ?? [];
  const questions = content.questions ?? [];
  const endings =
    content.endings?.length > 0
      ? content.endings
      : extractSharedEndings(questions, content);
  const endingKeys = new Set(endings.map((e) => e.key));
  const passageText = paragraphs.map((p) => p.text).join(" ");

  if (questions.length < 3) {
    errors.push(
      `Matching sentence endings needs at least 3 beginnings (found ${questions.length})`
    );
  }

  if (endings.length < questions.length + 2) {
    errors.push(
      `Matching sentence endings needs at least 2 extra distractor endings (${questions.length} beginnings require ≥${questions.length + 2} endings; found ${endings.length})`
    );
  }

  if (paragraphs.length < 2) {
    errors.push("Matching sentence endings passage needs at least 2 paragraphs");
  }

  if (
    questions.length === 1 &&
    isGenericSentenceEndingsPrompt(questions[0].text)
  ) {
    errors.push(
      "Matching sentence endings shows a generic instruction only — no sentence beginnings"
    );
  }

  /** @type {string[]} */
  const answerLetters = [];
  /** @type {Map<string, string>} */
  const endingLabelByKey = new Map(endings.map((e) => [e.key, e.label]));

  for (const q of questions) {
    const answer = normalizeParagraphLetter(q.correct ?? q.answer);
    if (!answer || !/^[A-I]$/.test(answer)) {
      errors.push(`Question ${q.id}: answer must be an ending letter A–I`);
      continue;
    }
    if (!endingKeys.has(answer)) {
      errors.push(
        `Question ${q.id}: answer "${answer}" is not in the endings list (${[...endingKeys].join(", ")})`
      );
      continue;
    }
    answerLetters.push(answer);

    if (isGenericSentenceEndingsPrompt(q.text) && q.text.length < 40) {
      errors.push(`Question ${q.id}: beginning is too generic`);
    }

    const endingLabel = endingLabelByKey.get(answer) ?? "";
    const combined = `${q.text} ${endingLabel}`.trim();
    if (
      !statementSupportedByPassage(
        combined,
        passageText,
        q.evidence ?? q.explanation
      )
    ) {
      errors.push(
        `Question ${q.id}: correct ending "${answer}" is not supported by passage evidence`
      );
    }
  }

  // Hard constraint: each ending used at most once
  const uniqueAnswers = new Set(answerLetters);
  if (uniqueAnswers.size !== answerLetters.length) {
    errors.push(
      "Matching sentence endings must not reuse the same ending letter — each ending may be used once only"
    );
  }

  const distractors = endings.filter((e) => !uniqueAnswers.has(e.key));
  if (distractors.length < 2) {
    errors.push(
      `Matching sentence endings needs at least 2 unused distractor endings (found ${distractors.length})`
    );
  }

  // Ambiguous distractors: unused ending that still plausibly completes a beginning
  for (const q of questions) {
    for (const d of distractors) {
      if (isAmbiguousSentenceEndingPair(q.text, d.label, passageText)) {
        errors.push(
          `Distractor ending ${d.key} ("${d.label.slice(0, 40)}…") could also plausibly complete question ${q.id}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors, endings };
}

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
 * IELTS diagram blank word limit: NO MORE THAN TWO WORDS AND/OR A NUMBER.
 * Tokens are whitespace-separated; a pure number counts as one token.
 * @param {string} value
 */
export function countIeltsAnswerTokens(value) {
  return String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * @param {string} value
 * @param {number} [maxWords=2]
 */
export function isWithinIeltsWordLimit(value, maxWords = 2) {
  const n = countIeltsAnswerTokens(value);
  return n > 0 && n <= maxWords;
}

/**
 * @param {string} text
 */
export function isGenericDiagramCompletionPrompt(text) {
  return (
    /label\s+the\s+diagram|complete\s+the\s+diagram|fill\s+in\s+the\s+blanks?/i.test(
      String(text ?? "")
    ) && String(text ?? "").trim().length < 60
  );
}

/**
 * @param {unknown} raw
 * @returns {{ title?: string, orientation: "vertical"|"horizontal", nodes: Array<object> }}
 */
export function normalizeDiagramSpec(raw) {
  if (!raw || typeof raw !== "object") {
    return { orientation: "vertical", nodes: [] };
  }
  const record = /** @type {Record<string, unknown>} */ (raw);
  const orientation =
    String(record.orientation ?? record.layout ?? "vertical").toLowerCase() ===
    "horizontal"
      ? "horizontal"
      : "vertical";

  const nodesRaw = Array.isArray(record.nodes)
    ? record.nodes
    : Array.isArray(record.steps)
      ? record.steps
      : [];

  const nodes = nodesRaw
    .map((node, index) => {
      if (!node || typeof node !== "object") return null;
      const n = /** @type {Record<string, unknown>} */ (node);
      const kindRaw = String(n.kind ?? n.type ?? "").toLowerCase();
      const hasAnswer = Boolean(String(n.answer ?? n.correct ?? "").trim());
      const kind =
        kindRaw === "blank" || kindRaw === "gap" || hasAnswer
          ? "blank"
          : "fixed";
      const id = String(n.id ?? index + 1);
      return {
        id,
        kind,
        text: String(n.text ?? n.label ?? n.title ?? "").trim(),
        answer:
          kind === "blank"
            ? String(n.answer ?? n.correct ?? "").trim()
            : undefined,
        alternatives: Array.isArray(n.alternatives)
          ? n.alternatives.map((a) => String(a).trim()).filter(Boolean)
          : undefined,
        evidence:
          kind === "blank"
            ? String(n.evidence ?? n.explanation ?? "").trim() || undefined
            : undefined,
      };
    })
    .filter(Boolean);

  return {
    title: String(record.title ?? "").trim() || undefined,
    orientation,
    nodes,
  };
}

/**
 * @param {object} content
 */
export function finalizeDiagramCompletionContent(content) {
  const slug = normalizeQuestionType(content.slug ?? content.questionType ?? "");
  if (slug !== "diagram-completion") return content;

  let diagram = normalizeDiagramSpec(content.diagram);
  let questions = Array.isArray(content.questions) ? [...content.questions] : [];

  // Prefer blanks from diagram.nodes; sync questions from blanks when needed
  const blankNodes = diagram.nodes.filter((n) => n.kind === "blank");
  if (blankNodes.length > 0) {
    const byId = new Map(questions.map((q) => [String(q.id), q]));
    questions = blankNodes.map((node, index) => {
      const existing = byId.get(String(node.id));
      const correct = String(
        node.answer ?? existing?.correct ?? existing?.answer ?? ""
      ).trim();
      const evidence = String(
        node.evidence ?? existing?.evidence ?? existing?.explanation ?? ""
      ).trim();
      const alternatives = [
        ...(Array.isArray(node.alternatives) ? node.alternatives : []),
        ...(Array.isArray(existing?.alternatives) ? existing.alternatives : []),
      ]
        .map((a) => String(a).trim())
        .filter(Boolean);
      return {
        ...existing,
        id: String(node.id ?? index + 1),
        kind: "diagram-completion",
        text:
          String(existing?.text ?? "").trim() ||
          `Label ${index + 1}`,
        correct,
        answer: correct,
        alternatives: alternatives.length ? [...new Set(alternatives)] : undefined,
        evidence: evidence || undefined,
      };
    });

    diagram = {
      ...diagram,
      nodes: diagram.nodes.map((n) => {
        if (n.kind !== "blank") return n;
        const q = questions.find((row) => String(row.id) === String(n.id));
        return {
          ...n,
          answer: q?.correct ?? n.answer,
          evidence: q?.evidence ?? n.evidence,
          alternatives: q?.alternatives ?? n.alternatives,
        };
      }),
    };
  } else if (questions.length > 0) {
    // Build a simple vertical flow from questions alone
    diagram = {
      title: diagram.title,
      orientation: "vertical",
      nodes: questions.map((q, index) => ({
        id: String(q.id ?? index + 1),
        kind: "blank",
        text: "",
        answer: String(q.correct ?? q.answer ?? "").trim(),
        alternatives: q.alternatives,
        evidence: String(q.evidence ?? q.explanation ?? "").trim() || undefined,
      })),
    };
    questions = questions.map((q, index) => ({
      ...q,
      id: String(q.id ?? index + 1),
      kind: "diagram-completion",
      text: String(q.text ?? `Label ${index + 1}`).trim(),
      correct: String(q.correct ?? q.answer ?? "").trim(),
    }));
  }

  const instructions =
    content.instructions?.includes("TWO WORDS")
      ? content.instructions
      : "Label the diagram below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer. Choose your answers from the passage only.";

  return {
    ...content,
    slug,
    diagram,
    instructions,
    questions,
  };
}

/**
 * @param {object} content
 */
export function validateDiagramCompletionContent(content) {
  const errors = [];
  const paragraphs = content.paragraphs ?? [];
  const passageText = paragraphs.map((p) => p.text).join(" ");
  const diagram = normalizeDiagramSpec(content.diagram);
  const questions = content.questions ?? [];
  const blankNodes = diagram.nodes.filter((n) => n.kind === "blank");

  if (paragraphs.length < 2) {
    errors.push("Diagram completion passage needs at least 2 paragraphs");
  }

  if (blankNodes.length < 3) {
    errors.push(
      `Diagram completion needs at least 3 blank labels (found ${blankNodes.length})`
    );
  }

  if (questions.length < 3) {
    errors.push(
      `Diagram completion needs at least 3 answerable blanks (found ${questions.length})`
    );
  }

  if (
    questions.length === 1 &&
    isGenericDiagramCompletionPrompt(questions[0].text)
  ) {
    errors.push(
      "Diagram completion shows a generic instruction only — no blank labels"
    );
  }

  const fixedCount = diagram.nodes.filter((n) => n.kind === "fixed").length;
  if (diagram.nodes.length > 0 && fixedCount === 0 && blankNodes.length < 4) {
    // Prefer some fixed anchors for a readable diagram, but don't hard-fail short blank-only flows
  }

  for (const q of questions) {
    const answer = String(q.correct ?? q.answer ?? "").trim();
    if (!answer) {
      errors.push(`Question ${q.id}: missing correct label answer`);
      continue;
    }
    if (!isWithinIeltsWordLimit(answer, 2)) {
      errors.push(
        `Question ${q.id}: answer "${answer}" exceeds NO MORE THAN TWO WORDS AND/OR A NUMBER`
      );
    }
    for (const alt of q.alternatives ?? []) {
      if (!isWithinIeltsWordLimit(alt, 2)) {
        errors.push(
          `Question ${q.id}: alternative "${alt}" exceeds the two-word limit`
        );
      }
    }

    if (
      !statementSupportedByPassage(
        answer,
        passageText,
        q.evidence ?? q.explanation
      )
    ) {
      // Also accept evidence keyed to the blank topic text
      const combined = `${q.text} ${answer}`.trim();
      if (
        !statementSupportedByPassage(
          combined,
          passageText,
          q.evidence ?? q.explanation
        )
      ) {
        errors.push(
          `Question ${q.id}: answer "${answer}" is not clearly stated/supported in the passage`
        );
      }
    }
  }

  // Every blank node should map to a question with the same id
  for (const node of blankNodes) {
    if (!questions.some((q) => String(q.id) === String(node.id))) {
      errors.push(`Diagram blank ${node.id} has no matching question answer key`);
    }
  }

  return { valid: errors.length === 0, errors, diagram };
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

  if (slug === "matching-information") {
    const finalized = finalizeMatchingInformationContent(content);
    const check = validateMatchingInformationContent(finalized);
    return { valid: check.valid, errors: check.errors, content: finalized };
  }

  if (slug === "classification") {
    const finalized = finalizeClassificationContent(content);
    const check = validateClassificationContent(finalized);
    return { valid: check.valid, errors: check.errors, content: finalized };
  }

  if (slug === "matching-sentence-endings") {
    const finalized = finalizeMatchingSentenceEndingsContent(content);
    const check = validateMatchingSentenceEndingsContent(finalized);
    return { valid: check.valid, errors: check.errors, content: finalized };
  }

  if (slug === "matching-features") {
    const finalized = finalizeMatchingFeaturesContent(content);
    const check = validateMatchingFeaturesContent(finalized);
    return { valid: check.valid, errors: check.errors, content: finalized };
  }

  if (slug === "diagram-completion") {
    const finalized = finalizeDiagramCompletionContent(content);
    const check = validateDiagramCompletionContent(finalized);
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
