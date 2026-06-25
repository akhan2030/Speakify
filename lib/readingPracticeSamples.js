/** @typedef {"Easy"|"Medium"|"Hard"} Difficulty */

/**
 * @typedef {object} PracticeQuestion
 * @property {string} id
 * @property {string} text
 * @property {"multiple-choice"|"true-false-not-given"|"matching-headings"|"sentence-completion"|"short-answer"} kind
 * @property {string} [correct]
 * @property {{ key: string, label: string }[]} [options]
 * @property {string} [paragraphId]
 * @property {{ key: string, label: string }[]} [headings]
 */

/**
 * @typedef {object} PracticeParagraph
 * @property {string} id
 * @property {string} label
 * @property {string} text
 */

/**
 * @typedef {object} PracticeContent
 * @property {string} passageId
 * @property {string} slug
 * @property {string} name
 * @property {Difficulty} difficulty
 * @property {string} instructions
 * @property {string} title
 * @property {PracticeParagraph[]} paragraphs
 * @property {PracticeQuestion[]} questions
 */

/** @type {Record<string, PracticeContent>} */
export const PRACTICE_SAMPLES = {
  "multiple-choice": {
    passageId: "sample-multiple-choice-1",
    slug: "multiple-choice",
    name: "Multiple Choice",
    difficulty: "Medium",
    instructions:
      "Choose the correct letter, A, B, C or D. Write your answers based on the passage only.",
    title: "Urban Vertical Farming",
    paragraphs: [
      {
        id: "p1",
        label: "Paragraph 1",
        text: "Vertical farming has expanded rapidly in cities where land is limited. Early projects focused on leafy greens because they grow quickly and require less energy than fruiting crops.",
      },
      {
        id: "p2",
        label: "Paragraph 2",
        text: "The main reason cities invest in vertical farms is economic pressure. Imported produce becomes expensive when fuel prices rise, so local production reduces transport costs and stabilises food prices.",
      },
      {
        id: "p3",
        label: "Paragraph 3",
        text: "Critics argue that vertical farms consume large amounts of electricity. However, supporters note that LED efficiency has improved and renewable energy can offset environmental concerns.",
      },
    ],
    questions: [
      {
        id: "q1",
        kind: "multiple-choice",
        text: "What was the main reason cities invested in vertical farms according to the passage?",
        options: [
          { key: "A", label: "Political change" },
          { key: "B", label: "Economic pressure" },
          { key: "C", label: "Environmental factors" },
          { key: "D", label: "Social movements" },
        ],
        correct: "B",
      },
      {
        id: "q2",
        kind: "multiple-choice",
        text: "Which crop did early vertical farms focus on?",
        options: [
          { key: "A", label: "Root vegetables" },
          { key: "B", label: "Fruiting crops" },
          { key: "C", label: "Leafy greens" },
          { key: "D", label: "Grains" },
        ],
        correct: "C",
      },
      {
        id: "q3",
        kind: "multiple-choice",
        text: "What do supporters say about electricity use?",
        options: [
          { key: "A", label: "It cannot be reduced" },
          { key: "B", label: "LED efficiency and renewables help" },
          { key: "C", label: "Farms should close at night" },
          { key: "D", label: "Only fossil fuels are used" },
        ],
        correct: "B",
      },
    ],
  },

  "true-false-not-given": {
    passageId: "sample-tfng-1",
    slug: "true-false-not-given",
    name: "True / False / Not Given",
    difficulty: "Hard",
    instructions:
      "Do the following statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN.",
    title: "Visitor Numbers at the City Museum",
    paragraphs: [
      {
        id: "p1",
        label: "Paragraph 1",
        text: "The City Museum reopened in 2012 after a major renovation. Visitor numbers increased steadily until 2019, when attendance reached a record high.",
      },
      {
        id: "p2",
        label: "Paragraph 2",
        text: "During 2020, visitor numbers fell sharply because the museum closed for several months. When it reopened, attendance recovered but did not match the 2019 peak.",
      },
      {
        id: "p3",
        label: "Paragraph 3",
        text: "The museum director stated that online exhibitions attracted audiences who had never visited in person. No plans exist to replace physical displays with digital-only content.",
      },
    ],
    questions: [
      {
        id: "q1",
        kind: "true-false-not-given",
        text: "The number of visitors increased after 2010.",
        correct: "TRUE",
      },
      {
        id: "q2",
        kind: "true-false-not-given",
        text: "Visitor numbers in 2021 were higher than in 2019.",
        correct: "FALSE",
      },
      {
        id: "q3",
        kind: "true-false-not-given",
        text: "The museum will become digital-only within five years.",
        correct: "NOT GIVEN",
      },
    ],
  },

  "matching-headings": {
    passageId: "sample-matching-headings-1",
    slug: "matching-headings",
    name: "Matching Headings",
    difficulty: "Hard",
    instructions:
      "Choose the correct heading for each paragraph from the list below. There are more headings than paragraphs.",
    title: "Migration and Urban Planning",
    paragraphs: [
      {
        id: "pA",
        label: "Paragraph A",
        text: "Rural workers moved to cities throughout the twentieth century seeking employment in factories. This shift reshaped housing demand and transport networks.",
      },
      {
        id: "pB",
        label: "Paragraph B",
        text: "Modern planners now design mixed-use districts with affordable housing near public transport. The goal is to reduce long commutes and congestion.",
      },
      {
        id: "pC",
        label: "Paragraph C",
        text: "Historical records show that migration patterns often followed economic downturns in agricultural regions rather than sudden policy changes.",
      },
    ],
    questions: [
      {
        id: "hA",
        kind: "matching-headings",
        paragraphId: "pA",
        text: "Paragraph A",
        headings: [
          { key: "i", label: "The decline of traditional farming" },
          { key: "ii", label: "New approaches to urban planning" },
          { key: "iii", label: "Historical background of migration" },
          { key: "iv", label: "The role of factory owners" },
        ],
        correct: "iii",
      },
      {
        id: "hB",
        kind: "matching-headings",
        paragraphId: "pB",
        text: "Paragraph B",
        headings: [
          { key: "i", label: "The decline of traditional farming" },
          { key: "ii", label: "New approaches to urban planning" },
          { key: "iii", label: "Historical background of migration" },
          { key: "iv", label: "The role of factory owners" },
        ],
        correct: "ii",
      },
      {
        id: "hC",
        kind: "matching-headings",
        paragraphId: "pC",
        text: "Paragraph C",
        headings: [
          { key: "i", label: "The decline of traditional farming" },
          { key: "ii", label: "New approaches to urban planning" },
          { key: "iii", label: "Historical background of migration" },
          { key: "iv", label: "The role of factory owners" },
        ],
        correct: "i",
      },
    ],
  },

  "sentence-completion": {
    passageId: "sample-sentence-completion-1",
    slug: "sentence-completion",
    name: "Sentence Completion",
    difficulty: "Medium",
    instructions:
      "Complete each sentence using NO MORE THAN TWO WORDS from the passage.",
    title: "Laboratory Experiment on Sleep",
    paragraphs: [
      {
        id: "p1",
        label: "Paragraph 1",
        text: "Researchers conducted the experiment in a controlled laboratory where light levels remained constant. Participants slept for eight hours on the first night and six hours on the second night.",
      },
      {
        id: "p2",
        label: "Paragraph 2",
        text: "Memory tests were administered each morning. Results showed that reaction times slowed when participants received less sleep.",
      },
    ],
    questions: [
      {
        id: "q1",
        kind: "sentence-completion",
        text: "The experiment was conducted in a controlled ___.",
        correct: "laboratory",
      },
      {
        id: "q2",
        kind: "sentence-completion",
        text: "Participants slept for eight hours on the first ___.",
        correct: "night",
      },
      {
        id: "q3",
        kind: "sentence-completion",
        text: "___ tests were administered each morning.",
        correct: "Memory",
      },
    ],
  },
};

/** @param {string} slug */
export function getPracticeContent(slug) {
  return PRACTICE_SAMPLES[slug] ?? null;
}

/**
 * @param {PracticeContent} content
 * @returns {Record<string, string>}
 */
export function buildCorrectAnswers(content) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const q of content.questions) {
    if (q.correct) map[q.id] = q.correct;
  }
  return map;
}

/** @param {string[]} slugs */
export function hasPracticeContent(slug) {
  return Boolean(PRACTICE_SAMPLES[slug]);
}
