/** @typedef {"Easy" | "Medium" | "Hard"} Difficulty */

/**
 * @typedef {object} StrategyStep
 * @property {string} title
 * @property {string} description
 */

/**
 * @typedef {object} StrategyMistake
 * @property {string} title
 * @property {string} explanation
 */

/**
 * @typedef {object} ReadingStrategy
 * @property {string} slug
 * @property {string} name
 * @property {Difficulty} difficulty
 * @property {string} description
 * @property {string[]} howItWorksBullets
 * @property {string} example
 * @property {StrategyStep[]} expertSteps
 * @property {StrategyMistake[]} commonMistakes
 * @property {string[]} quickTips
 */

/** @type {Record<string, ReadingStrategy>} */
export const READING_STRATEGIES = {
  "matching-headings": {
    slug: "matching-headings",
    name: "Matching Headings",
    difficulty: "Hard",
    description:
      "You match headings from a list to paragraphs in the passage. There are always more headings than paragraphs.",
    howItWorksBullets: [
      "Given a list of 6-9 headings",
      "Must match each paragraph to the correct heading",
      "Each heading used only once",
      "Some headings may not be used",
    ],
    example:
      "i. The decline of traditional farming\nii. New approaches to urban planning\niii. Historical background of migration",
    expertSteps: [
      {
        title: "Read headings first",
        description: "Underline key words in each heading.",
      },
      {
        title: "Read only first and last sentence of each paragraph",
        description: "",
      },
      {
        title: "Find the main idea",
        description: "Ignore details and examples.",
      },
      {
        title: "Match the main idea to the closest heading",
        description: "",
      },
      {
        title: "Use process of elimination for difficult paragraphs",
        description: "",
      },
      {
        title: "Never choose a heading based on one matching word alone",
        description: "",
      },
    ],
    commonMistakes: [
      {
        title: "Reading the whole paragraph instead of first/last sentences",
        explanation:
          "Matching Headings tests main ideas, not every detail in the paragraph.",
      },
      {
        title: "Choosing a heading because one word matches (trap)",
        explanation:
          "Distractor headings often reuse vocabulary without matching the paragraph's main idea.",
      },
      {
        title: "Spending too long on one paragraph",
        explanation:
          "Move on and return later — aim for about one minute per heading.",
      },
    ],
    quickTips: [
      "Headings describe main idea not details",
      "Watch out for distractor headings with similar words",
      "Do easy paragraphs first then return to hard ones",
      "Time: max 1 minute per heading",
    ],
  },

  "true-false-not-given": {
    slug: "true-false-not-given",
    name: "True / False / Not Given",
    difficulty: "Hard",
    description:
      "Decide if statements agree with, contradict, or are not mentioned in the passage.",
    howItWorksBullets: [
      "Given 5-8 statements",
      "Answer TRUE if statement agrees with passage",
      "Answer FALSE if statement contradicts passage",
      "Answer NOT GIVEN if information not in passage",
    ],
    example: "The number of visitors increased after 2010",
    expertSteps: [
      {
        title: "Read each statement carefully",
        description: "Underline key words.",
      },
      {
        title: "Find the relevant section in the passage by scanning",
        description: "",
      },
      {
        title: "Compare statement to passage word by word",
        description: "",
      },
      {
        title: "TRUE — passage says same thing (may be paraphrased)",
        description: "",
      },
      {
        title: "FALSE — passage says opposite or contradicts",
        description: "",
      },
      {
        title: "NOT GIVEN — information simply not mentioned anywhere",
        description: "",
      },
    ],
    commonMistakes: [
      {
        title: "Using outside knowledge — only use the passage",
        explanation:
          "If the text does not say it, you cannot infer it from general knowledge.",
      },
      {
        title: "Confusing NOT GIVEN with FALSE — very different",
        explanation:
          "FALSE requires a contradiction; NOT GIVEN means the topic is absent.",
      },
      {
        title: "Reading too fast and missing contradictions",
        explanation:
          "Small words like not, never, or fewer often change TRUE to FALSE.",
      },
    ],
    quickTips: [
      "Never use what you know — only use the text",
      "NOT GIVEN means absent — not wrong",
      'Quantifiers matter: "some" vs "all" vs "most"',
      "Follow passage order — statements appear in order",
    ],
  },

  "multiple-choice": {
    slug: "multiple-choice",
    name: "Multiple Choice",
    difficulty: "Medium",
    description:
      "Choose the correct answer from A, B, C, or D based on information in the passage.",
    howItWorksBullets: [
      "5-10 questions each with 4 options",
      "Only one option is correct",
      "Questions follow passage order",
    ],
    example:
      "What was the main reason for...\nA. Economic pressure\nB. Political change\nC. Environmental factors\nD. Social movements",
    expertSteps: [
      {
        title: "Read the question stem",
        description: "Underline key words.",
      },
      {
        title: "Predict what the answer might be before reading options",
        description: "",
      },
      {
        title: "Find the relevant paragraph by scanning for keywords",
        description: "",
      },
      {
        title: "Read that section carefully",
        description: "",
      },
      {
        title: "Eliminate obviously wrong options first",
        description: "",
      },
      {
        title: "Choose the option that matches passage meaning exactly",
        description: "",
      },
    ],
    commonMistakes: [
      {
        title: "Choosing answer that sounds true but is not in passage",
        explanation: "Plausible options may be true in real life but unsupported in the text.",
      },
      {
        title: "Being tricked by options using same words as passage",
        explanation: "Correct answers are usually paraphrases, not word-for-word copies.",
      },
      {
        title: "Not reading all four options before choosing",
        explanation: "The first option that looks right is often a distractor.",
      },
    ],
    quickTips: [
      "Wrong options often use exact words from passage",
      "Correct answer is usually a paraphrase not exact copy",
      "If two options seem right — one will have a detail wrong",
      "Time: 1.5 minutes per question maximum",
    ],
  },

  "sentence-completion": {
    slug: "sentence-completion",
    name: "Sentence Completion",
    difficulty: "Medium",
    description:
      "Complete sentences using words from the passage. Must use exact words and respect word limit.",
    howItWorksBullets: [
      "5-8 incomplete sentences to complete",
      "Must use words from passage — not your own words",
      "Word limit specified: usually NO MORE THAN TWO WORDS",
    ],
    example: "The experiment was conducted in a ___",
    expertSteps: [
      {
        title: "Read the word limit carefully before starting",
        description: "",
      },
      {
        title: "Read the incomplete sentence and predict word type",
        description: "Noun, verb, adjective, or number.",
      },
      {
        title: "Scan passage for the relevant section",
        description: "",
      },
      {
        title: "Find the exact word(s) that complete the sentence",
        description: "",
      },
      {
        title: "Check grammar — answer must fit grammatically",
        description: "",
      },
      {
        title: "Count words — never exceed the limit",
        description: "",
      },
    ],
    commonMistakes: [
      {
        title: "Using more words than allowed — automatic wrong answer",
        explanation: "Articles and hyphenated words count toward the limit.",
      },
      {
        title: "Paraphrasing instead of using exact passage words",
        explanation: "You must copy the word form exactly as it appears in the text.",
      },
      {
        title: "Ignoring grammar — answer must complete sentence naturally",
        explanation: "If the gap needs a plural noun, a singular form will be wrong.",
      },
    ],
    quickTips: [
      "Predict whether answer is noun/verb/adjective first",
      "Answers follow passage order",
      "Articles (a, an, the) count as words",
      "Never change the form of the word from the passage",
    ],
  },

  "summary-completion": {
    slug: "summary-completion",
    name: "Summary Completion",
    difficulty: "Medium",
    description:
      "Complete a summary of part of the passage using words from a box or from the passage itself.",
    howItWorksBullets: [
      "A short paragraph summarising part of the passage",
      "Gaps to fill with words from a box OR from passage",
      "Word limit applies if from passage",
    ],
    example: "Summary paragraph with 4-6 gaps",
    expertSteps: [
      {
        title: "Read the summary title",
        description: "It tells you which part of passage to focus on.",
      },
      {
        title: "Read the full summary to understand context",
        description: "",
      },
      {
        title: "For each gap predict the word type needed",
        description: "",
      },
      {
        title: "Find the relevant passage section",
        description: "",
      },
      {
        title: "Look for synonyms — summary uses different words",
        description: "",
      },
      {
        title: "Check all answers fit grammatically",
        description: "",
      },
    ],
    commonMistakes: [
      {
        title: "Not finding the right passage section first",
        explanation: "Use the summary title and surrounding context to locate the source text.",
      },
      {
        title: "Missing synonyms — summary rarely uses exact words",
        explanation: "Answers are paraphrased; scan for meaning, not identical wording.",
      },
      {
        title: "Exceeding word limit when using passage words",
        explanation: "Count every word including small function words.",
      },
    ],
    quickTips: [
      "Summary follows passage order",
      "Focus on the section indicated by the summary title",
      "Words in the box may include distractors",
      "Read summary as a whole before filling gaps",
    ],
  },

  "matching-information": {
    slug: "matching-information",
    name: "Matching Information",
    difficulty: "Medium",
    description:
      "Match specific information to the paragraph in which it is found.",
    howItWorksBullets: [
      "List of 5-8 pieces of information",
      "Must identify which paragraph A, B, C etc contains it",
      "Paragraphs may be used more than once",
    ],
    example: "Which paragraph mentions a specific date?",
    expertSteps: [
      {
        title: "Read all information items first",
        description: "Underline key words.",
      },
      {
        title: "Look for specific details: names, dates, numbers, places",
        description: "",
      },
      {
        title: "Scan passage paragraph by paragraph",
        description: "",
      },
      {
        title: "Match specific details rather than main ideas",
        description: "",
      },
      {
        title: "Remember paragraphs can be used multiple times",
        description: "",
      },
      {
        title: "Do easy matches first — process of elimination",
        description: "",
      },
    ],
    commonMistakes: [
      {
        title: "Confusing with Matching Headings — this is about details",
        explanation: "You are locating facts, not identifying paragraph themes.",
      },
      {
        title: "Not knowing paragraphs can repeat",
        explanation: "The same paragraph letter may be correct for more than one item.",
      },
      {
        title: "Reading whole passage instead of scanning",
        explanation: "Efficient scanning for names and numbers saves time.",
      },
    ],
    quickTips: [
      "Look for proper nouns, numbers, statistics first",
      "These questions are not in passage order",
      "Scan efficiently — do not read every word",
      "Takes practice to scan quickly and accurately",
    ],
  },

  "matching-features": {
    slug: "matching-features",
    name: "Matching Features",
    difficulty: "Medium",
    description:
      "Match features or characteristics to the correct category from a list.",
    howItWorksBullets: [
      "List of categories (usually people, places, theories)",
      "Statements to match to correct category",
      "Categories may be used more than once",
    ],
    example: "Match findings to researchers A, B, or C",
    expertSteps: [
      {
        title: "Read all categories first",
        description: "Underline names and labels.",
      },
      {
        title: "Read each statement carefully",
        description: "",
      },
      {
        title: "Scan passage for the category names",
        description: "",
      },
      {
        title: "Find what the passage says about each category",
        description: "",
      },
      {
        title: "Match statement to category based on passage only",
        description: "",
      },
      {
        title: "Use elimination for difficult items",
        description: "",
      },
    ],
    commonMistakes: [
      {
        title: "Using general knowledge about the topic",
        explanation: "Only evidence from the passage counts.",
      },
      {
        title: "Not realising categories repeat",
        explanation: "One researcher or category can match several statements.",
      },
      {
        title: "Confusing similar sounding category names",
        explanation: "Build a quick table to keep categories distinct.",
      },
    ],
    quickTips: [
      "Create a quick table of categories before answering",
      "Highlight category names in passage as you find them",
      "Statements are not in passage order",
      "Be careful with negatives in statements",
    ],
  },

  "matching-sentence-endings": {
    slug: "matching-sentence-endings",
    name: "Matching Sentence Endings",
    difficulty: "Medium",
    description:
      "Match the beginning of sentences to their correct endings from a list.",
    howItWorksBullets: [
      "5-8 sentence beginnings given",
      "List of 7-10 possible endings",
      "More endings than beginnings — some not used",
    ],
    example:
      "The researchers concluded that...\nA. temperatures would continue rising\nB. the experiment had failed",
    expertSteps: [
      {
        title: "Read all sentence beginnings first",
        description: "",
      },
      {
        title: "Predict what type of ending is needed",
        description: "Result, reason, or contrast.",
      },
      {
        title: "Look for grammatical clues — tense and word type",
        description: "",
      },
      {
        title: "Find relevant section in passage",
        description: "",
      },
      {
        title: "Choose ending that is both grammatically and logically correct",
        description: "",
      },
      {
        title: "Check complete sentence makes sense",
        description: "",
      },
    ],
    commonMistakes: [
      {
        title: "Choosing ending that is grammatically correct but wrong meaning",
        explanation: "Meaning must match the passage, not just grammar.",
      },
      {
        title: "Not checking logical flow of complete sentence",
        explanation: "Read the full sentence aloud in your head before deciding.",
      },
      {
        title: "Rushing without reading full sentence",
        explanation: "Both halves must combine into one coherent statement.",
      },
    ],
    quickTips: [
      "Both grammar AND meaning must be correct",
      "Follow passage order — beginnings appear in order",
      "Eliminate endings that are grammatically impossible",
      "Watch for contrast words: however, although, despite",
    ],
  },

  "short-answer": {
    slug: "short-answer",
    name: "Short Answer Questions",
    difficulty: "Easy",
    description:
      "Answer questions using words directly from the passage. Strict word limit applies.",
    howItWorksBullets: [
      "4-8 questions requiring brief answers",
      "Must use exact words from passage",
      "Usually NO MORE THAN THREE WORDS limit",
    ],
    example: "What did scientists discover in 2015?",
    expertSteps: [
      {
        title: "Read word limit before starting",
        description: "",
      },
      {
        title: "Read question and identify what type of answer needed",
        description: "Who, what, where, when, why, or how many.",
      },
      {
        title: "Scan passage for relevant section",
        description: "",
      },
      {
        title: "Find exact words from passage that answer question",
        description: "",
      },
      {
        title: "Check word count",
        description: "",
      },
      {
        title: "Never paraphrase — use passage words only",
        description: "",
      },
    ],
    commonMistakes: [
      {
        title: "Writing full sentences instead of short answers",
        explanation: "Only the required words from the passage are needed.",
      },
      {
        title: "Exceeding word limit",
        explanation: "Extra words make an otherwise correct answer wrong.",
      },
      {
        title: "Paraphrasing instead of copying from passage",
        explanation: "Copy spelling and word form exactly.",
      },
    ],
    quickTips: [
      "Questions follow passage order",
      "Answer is always a specific fact not an opinion",
      "Numbers and dates count as one word each",
      "Read question word carefully: who/what/where/when",
    ],
  },

  "diagram-completion": {
    slug: "diagram-completion",
    name: "Diagram / Flowchart Completion",
    difficulty: "Hard",
    description:
      "Complete labels on a diagram, map, or flowchart using words from the passage.",
    howItWorksBullets: [
      "Visual diagram with numbered gaps to label",
      "Words come from passage with word limit",
      "Flowcharts show a process sequence",
    ],
    example: "Label parts of a building or stages of a process",
    expertSteps: [
      {
        title: "Study the diagram before reading passage",
        description: "",
      },
      {
        title: "Understand what the diagram shows — process or object",
        description: "",
      },
      {
        title: "For flowcharts — look for sequence words in passage",
        description: "First, then, next, after, finally, subsequently.",
      },
      {
        title: "Match diagram labels to corresponding passage section",
        description: "",
      },
      {
        title: "Use exact passage words within word limit",
        description: "",
      },
      {
        title: "Check labels make logical sense in diagram",
        description: "",
      },
    ],
    commonMistakes: [
      {
        title: "Not studying diagram carefully before reading",
        explanation: "The visual structure tells you what type of answer each gap needs.",
      },
      {
        title: "Missing sequence markers in flowcharts",
        explanation: "Process questions depend on order words in the text.",
      },
      {
        title: "Using own words instead of passage words",
        explanation: "Labels must come directly from the passage.",
      },
    ],
    quickTips: [
      "Flowchart answers follow sequence in passage",
      "Diagram questions may not follow passage order",
      "Look for arrows and connectors as clues",
      "Technical terms often appear word-for-word",
    ],
  },

  classification: {
    slug: "classification",
    name: "Classification",
    difficulty: "Medium",
    description:
      "Classify information according to categories given. Each category represents a group or type.",
    howItWorksBullets: [
      "2-5 categories given (letters A, B, C etc)",
      "List of statements to classify into categories",
      "Each category used for multiple statements",
    ],
    example:
      "Classify findings as applying to\nA: adults only  B: children only  C: both groups",
    expertSteps: [
      {
        title: "Read all categories carefully",
        description: "Understand differences between each category.",
      },
      {
        title: "Create a mental or written table of categories",
        description: "",
      },
      {
        title: "Read each statement and find it in passage",
        description: "",
      },
      {
        title: "Compare statement to each category definition",
        description: "",
      },
      {
        title: "Assign to correct category based on passage only",
        description: "",
      },
      {
        title: "Categories often repeat — do not worry about this",
        description: "",
      },
    ],
    commonMistakes: [
      {
        title: "Not understanding category differences clearly",
        explanation: "Spend time on the category definitions before answering.",
      },
      {
        title: "Using logic instead of passage information",
        explanation: "Classify only what the text supports.",
      },
      {
        title: "Thinking each category is used only once",
        explanation: "The same letter can apply to many statements.",
      },
    ],
    quickTips: [
      "Understand categories before answering anything",
      "Statements are not in passage order",
      "Look for contrast between categories in passage",
      "Take notes on what each category covers",
    ],
  },
};

/** @param {string} slug */
export function getReadingStrategy(slug) {
  return READING_STRATEGIES[slug] ?? null;
}

/** @returns {string[]} */
export function getReadingStrategySlugs() {
  return Object.keys(READING_STRATEGIES);
}
