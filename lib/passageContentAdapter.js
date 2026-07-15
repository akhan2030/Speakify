import {
  getQuestionTypeInstructions,
  getQuestionTypeName,
  normalizeQuestionType,
  slugToQuestionKind,
} from "./readingPassageTypes.js";
import {
  finalizeMatchingHeadingsContent,
  finalizeMatchingInformationContent,
  finalizeClassificationContent,
  finalizeMatchingSentenceEndingsContent,
  finalizeMatchingFeaturesContent,
  finalizeDiagramCompletionContent,
  normalizeHeadingOptions,
  normalizeCategoryOptions,
  normalizeEndingOptions,
  normalizeFeatureOptions,
  normalizeDiagramSpec,
  normalizeParagraphLetter,
  extractSharedCategories,
  extractSharedEndings,
  extractSharedFeatures,
} from "./readingQuestionContent.js";
import { normalizeListeningMcqOption } from "./listeningQuestionContent.js";

/**
 * @param {string} difficulty
 */
function formatDifficulty(difficulty) {
  const d = String(difficulty ?? "medium").toLowerCase();
  if (d === "easy") return "Easy";
  if (d === "hard") return "Hard";
  return "Medium";
}

/**
 * @param {string} content
 * @returns {{ id: string, label: string, text: string }[]}
 */
export function parseParagraphsFromContent(content) {
  const text = String(content ?? "").trim();
  if (!text) {
    return [{ id: "pA", label: "A", text: "No passage content available." }];
  }

  const labeledBlocks = text.split(/\n(?=[A-G][\.\):\-]\s)/i);
  if (labeledBlocks.length > 1) {
    return labeledBlocks
      .map((block, index) => {
        const match = block.match(/^([A-G])[\.\):\-]\s*([\s\S]*)/i);
        const label = match?.[1]?.toUpperCase() ?? String.fromCharCode(65 + index);
        const body = (match?.[2] ?? block).trim();
        return {
          id: `p${label}`,
          label,
          text: body,
        };
      })
      .filter((p) => p.text.length > 0);
  }

  const paragraphSplits = text.split(/\n\n+/).filter(Boolean);
  return paragraphSplits.map((para, index) => {
    const label = String.fromCharCode(65 + index);
    return {
      id: `p${label}`,
      label,
      text: para.trim(),
    };
  });
}

const MCQ_KEYS = ["A", "B", "C", "D"];

/**
 * @param {unknown} opt
 * @param {number} optIndex
 * @returns {{ key: string, label: string }}
 */
function normalizeMcqOption(opt, optIndex) {
  const normalized = normalizeListeningMcqOption(opt, optIndex);
  return {
    key: normalized.label,
    label: normalized.text,
  };
}

/**
 * @param {unknown} options
 * @returns {{ key: string, label: string }[]}
 */
function normalizeMcqOptionsList(options) {
  if (!options) return [];

  if (!Array.isArray(options) && typeof options === "object") {
    const record = /** @type {Record<string, unknown>} */ (options);
    return MCQ_KEYS.map((key) => ({
      key,
      label: String(record[key] ?? "").trim(),
    })).filter((option) => option.label.length > 0);
  }

  if (!Array.isArray(options)) return [];

  return options
    .map((opt, index) => normalizeMcqOption(opt, index))
    .filter((option) => option.label.length > 0);
}

/**
 * @param {object} q
 * @param {string} slug
 * @param {number} index
 */
function adaptQuestion(q, slug, index) {
  const kind = slugToQuestionKind(slug);
  const id = String(q.id ?? `q${index + 1}`);
  const text = String(q.text ?? q.statement ?? q.prompt ?? "");

  /** @type {object} */
  const base = {
    id,
    kind,
    text,
    correct: String(q.answer ?? q.correct ?? "").trim(),
  };

  if (kind === "multiple-choice") {
    const options = normalizeMcqOptionsList(q.options);
    if (options.length > 0) {
      base.options = options;
    }
  }

  if (kind === "matching-headings") {
    if (Array.isArray(q.headings)) {
      base.headings = normalizeHeadingOptions(q.headings);
    }
    if (q.paragraphId) base.paragraphId = q.paragraphId;
    if (q.paragraphLabel) base.paragraphId = `p${q.paragraphLabel}`;
    const paraMatch = text.match(/^paragraph\s+([A-G])\b/i);
    if (paraMatch) base.paragraphId = `p${paraMatch[1].toUpperCase()}`;
  }

  if (kind === "matching-information") {
    base.correct = normalizeParagraphLetter(base.correct);
    if (q.evidence) base.evidence = String(q.evidence).trim();
    if (q.explanation && !base.evidence) {
      base.evidence = String(q.explanation).trim();
    }
  }

  if (kind === "classification") {
    base.correct = normalizeParagraphLetter(base.correct);
    if (q.evidence) base.evidence = String(q.evidence).trim();
    if (q.explanation && !base.evidence) {
      base.evidence = String(q.explanation).trim();
    }
    if (Array.isArray(q.categories)) {
      base.categories = normalizeCategoryOptions(q.categories);
    }
  }

  if (kind === "matching-sentence-endings") {
    base.correct = normalizeParagraphLetter(base.correct);
    if (q.evidence) base.evidence = String(q.evidence).trim();
    if (q.explanation && !base.evidence) {
      base.evidence = String(q.explanation).trim();
    }
    if (Array.isArray(q.endings)) {
      base.endings = normalizeEndingOptions(q.endings);
    }
  }

  if (kind === "matching-features") {
    base.correct = normalizeParagraphLetter(base.correct);
    if (q.evidence) base.evidence = String(q.evidence).trim();
    if (q.explanation && !base.evidence) {
      base.evidence = String(q.explanation).trim();
    }
    if (Array.isArray(q.features)) {
      base.features = normalizeFeatureOptions(q.features);
    }
  }

  if (kind === "diagram-completion") {
    base.correct = String(q.answer ?? q.correct ?? "").trim();
    if (q.evidence) base.evidence = String(q.evidence).trim();
    if (q.explanation && !base.evidence) {
      base.evidence = String(q.explanation).trim();
    }
    if (Array.isArray(q.alternatives)) {
      base.alternatives = q.alternatives
        .map((a) => String(a).trim())
        .filter(Boolean);
    }
  }

  return base;
}

/**
 * @param {object} bankRow
 * @param {string} questionType
 */
export function bankPassageToPracticeContent(bankRow, questionType) {
  const slug = normalizeQuestionType(questionType);
  const questionsRaw = Array.isArray(bankRow.questions)
    ? bankRow.questions
    : [];

  const questions = questionsRaw.map((q, index) => adaptQuestion(q, slug, index));

  const diagramFromQuestions = questionsRaw.find(
    (q) => q && typeof q === "object" && q.diagram
  )?.diagram;

  const base = {
    passageId: String(bankRow.id),
    slug,
    name: getQuestionTypeName(slug),
    difficulty: formatDifficulty(bankRow.difficulty),
    instructions: getQuestionTypeInstructions(slug),
    title: bankRow.title,
    topic: bankRow.topic,
    paragraphs: parseParagraphsFromContent(bankRow.content),
    questions,
    headings: normalizeHeadingOptions(bankRow.headings),
    categories: extractSharedCategories(questionsRaw, bankRow),
    endings: extractSharedEndings(questionsRaw, bankRow),
    features: extractSharedFeatures(questionsRaw, bankRow),
    diagram: normalizeDiagramSpec(bankRow.diagram ?? diagramFromQuestions),
  };

  if (slug === "matching-headings") {
    return finalizeMatchingHeadingsContent(base);
  }
  if (slug === "matching-information") {
    return finalizeMatchingInformationContent(base);
  }
  if (slug === "classification") {
    return finalizeClassificationContent(base);
  }
  if (slug === "matching-sentence-endings") {
    return finalizeMatchingSentenceEndingsContent(base);
  }
  if (slug === "matching-features") {
    return finalizeMatchingFeaturesContent(base);
  }
  if (slug === "diagram-completion") {
    return finalizeDiagramCompletionContent(base);
  }
  return base;
}

/**
 * @param {object} content
 */
export function buildCorrectAnswersFromContent(content) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const q of content.questions) {
    if (q.correct) map[q.id] = q.correct;
  }
  return map;
}

/**
 * @param {object[]} passageContents — practice content per passage
 */
export function buildMockTestConfigFromPassages(passageContents) {
  let cursor = 1;
  /** @type {object[]} */
  const passages = passageContents.map((content, index) => {
    const startNumber = cursor;
    const questions = content.questions.map((q, qi) => {
      const globalNumber = startNumber + qi;
      return {
        ...q,
        globalNumber,
        typeLabel: content.name,
        typeSlug: content.slug,
      };
    });
    const endNumber = startNumber + questions.length - 1;
    cursor = endNumber + 1;

    const questionsWithGroup = questions.map((q) => ({
      ...q,
      groupLabel: `Questions ${startNumber}–${endNumber}`,
    }));

    return {
      id: content.passageId,
      index: index + 1,
      title: content.title,
      paragraphs: content.paragraphs,
      questions: questionsWithGroup,
      questionCount: questionsWithGroup.length,
      startNumber,
      endNumber,
    };
  });

  const totalQuestions = passages.reduce((sum, p) => sum + p.questionCount, 0);

  return {
    testId: `dynamic-mock-${Date.now()}`,
    title: "IELTS Reading Mock Test",
    durationSeconds: 3600,
    totalQuestions,
    passages,
  };
}
