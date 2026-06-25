import {
  getQuestionTypeInstructions,
  getQuestionTypeName,
  normalizeQuestionType,
  slugToQuestionKind,
} from "./readingPassageTypes.js";

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

  if (kind === "multiple-choice" && Array.isArray(q.options)) {
    base.options = q.options.map((opt, optIndex) => {
      if (typeof opt === "string") {
        const key = ["A", "B", "C", "D"][optIndex] ?? String(optIndex + 1);
        return { key, label: opt };
      }
      return {
        key: String(opt.key ?? opt.label?.[0] ?? ["A", "B", "C", "D"][optIndex]),
        label: String(opt.label ?? opt.text ?? opt),
      };
    });
  }

  if (kind === "matching-headings" && Array.isArray(q.headings)) {
    base.headings = q.headings.map((h, hi) => {
      if (typeof h === "string") {
        const roman = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
        return { key: roman[hi] ?? String(hi + 1), label: h };
      }
      return {
        key: String(h.key ?? h.id ?? `h${hi}`),
        label: String(h.label ?? h.text ?? h),
      };
    });
    if (q.paragraphId) base.paragraphId = q.paragraphId;
    if (q.paragraphLabel) base.paragraphId = `p${q.paragraphLabel}`;
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

  return {
    passageId: String(bankRow.id),
    slug,
    name: getQuestionTypeName(slug),
    difficulty: formatDifficulty(bankRow.difficulty),
    instructions: getQuestionTypeInstructions(slug),
    title: bankRow.title,
    topic: bankRow.topic,
    paragraphs: parseParagraphsFromContent(bankRow.content),
    questions,
  };
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
