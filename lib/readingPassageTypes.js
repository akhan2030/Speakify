export const QUESTION_TYPE_SLUGS = [
  "multiple-choice",
  "true-false-not-given",
  "matching-headings",
  "matching-information",
  "matching-features",
  "matching-sentence-endings",
  "sentence-completion",
  "summary-completion",
  "note-completion",
  "short-answer",
  "diagram-completion",
  "classification",
];

const INSTRUCTIONS = {
  "multiple-choice":
    "Choose the correct letter, A, B, C or D. Write your answers based on the passage only.",
  "true-false-not-given":
    "Do the following statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN.",
  "matching-headings":
    "Choose the correct heading for each paragraph from the list below. There are more headings than paragraphs.",
  "matching-information":
    "Which paragraph contains the following information? Write the correct letter, A–G.",
  "matching-features":
    "Match each statement with the correct feature. Choose from the list given.",
  "matching-sentence-endings":
    "Complete each sentence with the correct ending, A–F.",
  "sentence-completion":
    "Complete each sentence using NO MORE THAN THREE WORDS from the passage.",
  "summary-completion":
    "Complete the summary below using words from the passage.",
  "note-completion":
    "Complete the notes below using words from the passage.",
  "short-answer":
    "Answer each question using NO MORE THAN THREE WORDS from the passage.",
  "diagram-completion":
    "Label the diagram using words from the passage.",
  classification:
    "Classify each item according to the categories in the passage.",
};

const DISPLAY_NAMES = {
  "multiple-choice": "Multiple Choice",
  "true-false-not-given": "True / False / Not Given",
  "matching-headings": "Matching Headings",
  "matching-information": "Matching Information",
  "matching-features": "Matching Features",
  "matching-sentence-endings": "Matching Sentence Endings",
  "sentence-completion": "Sentence Completion",
  "summary-completion": "Summary Completion",
  "note-completion": "Note Completion",
  "short-answer": "Short Answer",
  "diagram-completion": "Diagram Completion",
  classification: "Classification",
};

/** @param {string} slug */
export function normalizeQuestionType(slug) {
  return String(slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

/** @param {string} slug */
export function getQuestionTypeInstructions(slug) {
  const key = normalizeQuestionType(slug);
  return INSTRUCTIONS[key] ?? "Answer the questions based on the passage only.";
}

/** @param {string} slug */
export function getQuestionTypeName(slug) {
  const key = normalizeQuestionType(slug);
  return DISPLAY_NAMES[key] ?? key;
}

/** @param {string} slug */
export function isValidQuestionType(slug) {
  return QUESTION_TYPE_SLUGS.includes(normalizeQuestionType(slug));
}

/** @param {string} slug */
export function slugToQuestionKind(slug) {
  const key = normalizeQuestionType(slug);
  if (key === "multiple-choice") return "multiple-choice";
  if (key === "true-false-not-given" || key === "yes-no-not-given")
    return "true-false-not-given";
  if (key === "matching-headings") return "matching-headings";
  if (
    key === "sentence-completion" ||
    key === "summary-completion" ||
    key === "note-completion"
  ) {
    return "sentence-completion";
  }
  if (key === "short-answer") return "short-answer";
  return "sentence-completion";
}
