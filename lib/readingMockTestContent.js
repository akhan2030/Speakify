/** @typedef {"multiple-choice"|"true-false-not-given"|"matching-headings"|"sentence-completion"|"short-answer"} QuestionKind */

/**
 * @typedef {object} MockParagraph
 * @property {string} id
 * @property {string} label
 * @property {string} text
 */

/**
 * @typedef {object} MockQuestion
 * @property {string} id
 * @property {number} globalNumber
 * @property {QuestionKind} kind
 * @property {string} typeLabel
 * @property {string} typeSlug
 * @property {string} text
 * @property {string} [correct]
 * @property {{ key: string, label: string }[]} [options]
 * @property {{ key: string, label: string }[]} [headings]
 * @property {string} [paragraphId]
 * @property {string} [groupLabel]
 */

/**
 * @typedef {object} MockPassage
 * @property {string} id
 * @property {number} index
 * @property {string} title
 * @property {MockParagraph[]} paragraphs
 * @property {MockQuestion[]} questions
 * @property {number} questionCount
 * @property {number} startNumber
 * @property {number} endNumber
 */

/**
 * @typedef {object} MockTestConfig
 * @property {string} testId
 * @property {string} title
 * @property {number} durationSeconds
 * @property {number} totalQuestions
 * @property {MockPassage[]} passages
 */

/** @param {MockPassage[]} passages */
function annotatePassageNumbers(passages) {
  let cursor = 1;
  return passages.map((passage, idx) => {
    const questions = passage.questions.map((q) => ({
      ...q,
      globalNumber: cursor++,
    }));
    const questionCount = questions.length;
    const startNumber = questions[0]?.globalNumber ?? 0;
    const endNumber = questions[questions.length - 1]?.globalNumber ?? 0;
    return {
      ...passage,
      index: idx + 1,
      questions,
      questionCount,
      startNumber,
      endNumber,
    };
  });
}

const PASSAGE_1_PARAGRAPHS = [
  {
    id: "p1A",
    label: "A",
    text: "Coffee is one of the most widely consumed beverages in the world, yet its origins remain debated among historians. Most scholars agree that the coffee plant was first discovered in the highlands of Ethiopia, where local communities chewed the berries for energy before learning to roast and brew the seeds. From Ethiopia, coffee cultivation spread through trade routes into Yemen, where Sufi monasteries used the drink to stay awake during long nights of prayer.",
  },
  {
    id: "p1B",
    label: "B",
    text: "By the fifteenth century, coffee houses had become central to social life in the Arabian Peninsula. These establishments were not merely places to drink coffee; they functioned as meeting points for merchants, poets, and politicians. Because alcohol was forbidden in many Islamic societies, coffee provided a socially acceptable stimulant that encouraged conversation and the exchange of news.",
  },
  {
    id: "p1C",
    label: "C",
    text: "European traders first encountered coffee in the seventeenth century through contact with Ottoman markets. Initially, some European doctors warned that coffee might cause illness, and religious leaders questioned whether the beverage should be permitted. Despite this opposition, coffee gained popularity in major cities such as London, Paris, and Vienna, where dedicated coffee houses mirrored the cultural role they had played in the Middle East.",
  },
  {
    id: "p1D",
    label: "D",
    text: "The colonial expansion of European powers transformed coffee from a luxury import into a globally traded commodity. Plantations were established in tropical regions of the Americas, Asia, and Africa, often relying on forced labour. Brazil eventually became the world's largest producer, a position it still holds today. This shift in production altered both the economies of producing countries and the daily habits of consumers worldwide.",
  },
  {
    id: "p1E",
    label: "E",
    text: "Industrial roasting and packaging in the nineteenth century made coffee more affordable and consistent in quality. Instant coffee, developed in the early twentieth century, appealed to consumers who wanted convenience rather than ritual. At the same time, specialty roasters began emphasising origin, flavour notes, and brewing methods, creating a market segment that valued craftsmanship over speed.",
  },
  {
    id: "p1F",
    label: "F",
    text: "Today, the coffee industry faces environmental and economic challenges. Climate change threatens the regions where arabica beans grow best, while volatile prices leave small farmers vulnerable. Certification schemes and direct-trade partnerships aim to improve conditions for producers, though critics argue that such programmes reach only a fraction of the global supply chain.",
  },
  {
    id: "p1G",
    label: "G",
    text: "Research into coffee's health effects has produced mixed results. Moderate consumption has been linked to lower risks of certain diseases, yet excessive intake may disrupt sleep and increase anxiety. Nutritionists generally agree that black coffee contains few calories, but popular additions such as syrup and whipped cream can transform a simple drink into a high-sugar product.",
  },
];

const PASSAGE_1_MC = [
  {
    text: "According to the passage, where was the coffee plant first discovered?",
    options: [
      { key: "A", label: "Yemen" },
      { key: "B", label: "Ethiopia" },
      { key: "C", label: "Brazil" },
      { key: "D", label: "Vienna" },
    ],
    correct: "B",
  },
  {
    text: "Sufi monasteries in Yemen used coffee primarily to",
    options: [
      { key: "A", label: "replace meals during fasting" },
      { key: "B", label: "stay awake during prayer" },
      { key: "C", label: "treat medical conditions" },
      { key: "D", label: "impress visiting merchants" },
    ],
    correct: "B",
  },
  {
    text: "Coffee houses in the Arabian Peninsula served as places for",
    options: [
      { key: "A", label: "religious ceremonies only" },
      { key: "B", label: "silent study" },
      { key: "C", label: "social and political discussion" },
      { key: "D", label: "storing trade goods" },
    ],
    correct: "C",
  },
  {
    text: "Why did coffee become popular in societies where alcohol was forbidden?",
    options: [
      { key: "A", label: "It was cheaper than water" },
      { key: "B", label: "It was an acceptable stimulant" },
      { key: "C", label: "It was required by law" },
      { key: "D", label: "It cured disease" },
    ],
    correct: "B",
  },
  {
    text: "Some European doctors initially believed that coffee",
    options: [
      { key: "A", label: "improved memory permanently" },
      { key: "B", label: "could cause illness" },
      { key: "C", label: "was identical to tea" },
      { key: "D", label: "should replace bread" },
    ],
    correct: "B",
  },
  {
    text: "European colonial expansion led to coffee being",
    options: [
      { key: "A", label: "grown only in Ethiopia" },
      { key: "B", label: "banned in the Americas" },
      { key: "C", label: "produced on plantations abroad" },
      { key: "D", label: "reserved for royalty" },
    ],
    correct: "C",
  },
  {
    text: "Which country became the world's largest coffee producer?",
    options: [
      { key: "A", label: "Brazil" },
      { key: "B", label: "France" },
      { key: "C", label: "India" },
      { key: "D", label: "Turkey" },
    ],
    correct: "A",
  },
  {
    text: "Instant coffee appealed mainly to consumers who wanted",
    options: [
      { key: "A", label: "traditional rituals" },
      { key: "B", label: "convenience" },
      { key: "C", label: "higher caffeine levels" },
      { key: "D", label: "organic certification" },
    ],
    correct: "B",
  },
  {
    text: "Specialty roasters emphasised",
    options: [
      { key: "A", label: "speed of service" },
      { key: "B", label: "origin and flavour" },
      { key: "C", label: "government subsidies" },
      { key: "D", label: "plastic packaging" },
    ],
    correct: "B",
  },
  {
    text: "Climate change is a threat because it affects",
    options: [
      { key: "A", label: "regions suitable for arabica" },
      { key: "B", label: "coffee advertising" },
      { key: "C", label: "European coffee houses" },
      { key: "D", label: "instant coffee factories only" },
    ],
    correct: "A",
  },
  {
    text: "Critics of certification schemes argue that they",
    options: [
      { key: "A", label: "reach only a small part of the supply chain" },
      { key: "B", label: "increase crop disease" },
      { key: "C", label: "ban small farmers" },
      { key: "D", label: "eliminate fair prices" },
    ],
    correct: "A",
  },
  {
    text: "Nutritionists agree that black coffee",
    options: [
      { key: "A", label: "contains many calories" },
      { key: "B", label: "contains few calories" },
      { key: "C", label: "must include milk" },
      { key: "D", label: "causes diabetes directly" },
    ],
    correct: "B",
  },
  {
    text: "Excessive coffee intake may",
    options: [
      { key: "A", label: "improve sleep quality" },
      { key: "B", label: "reduce anxiety" },
      { key: "C", label: "disrupt sleep" },
      { key: "D", label: "lower heart rate permanently" },
    ],
    correct: "C",
  },
];

/** @returns {MockQuestion[]} */
function buildMultipleChoiceQuestions(prefix, items) {
  return items.map((item, i) => ({
    id: `${prefix}-mc-${i + 1}`,
    globalNumber: 0,
    kind: "multiple-choice",
    typeLabel: "Multiple Choice",
    typeSlug: "multiple-choice",
    groupLabel: "Questions 1–13",
    text: item.text,
    options: item.options,
    correct: item.correct,
  }));
}

const PASSAGE_2_PARAGRAPHS = [
  {
    id: "p2A",
    label: "A",
    text: "Modern cities grew rapidly after industrialisation, when factories attracted workers from rural areas. Architects responded by designing taller buildings that could house offices and apartments on limited land. Steel frames and elevators made skyscrapers possible, reshaping skylines from New York to Shanghai.",
  },
  {
    id: "p2B",
    label: "B",
    text: "The modernist movement rejected decorative styles in favour of simplicity and function. Architects such as Le Corbusier argued that buildings should serve human needs efficiently, using open plans and large windows to bring light into living spaces. Glass and concrete became signature materials of twentieth-century urban design.",
  },
  {
    id: "p2C",
    label: "C",
    text: "Post-war reconstruction in Europe created opportunities to rebuild damaged districts according to new planning principles. Wide boulevards, public parks, and zoning laws separated industrial zones from residential neighbourhoods. Planners hoped these measures would reduce pollution and improve quality of life.",
  },
  {
    id: "p2D",
    label: "D",
    text: "Critics of mid-century urban renewal argued that large redevelopment projects destroyed historic communities. Entire neighbourhoods were demolished to make way for highways and tower blocks, displacing low-income residents. Later planners adopted more gradual approaches that preserved street patterns and mixed-use buildings.",
  },
  {
    id: "p2E",
    label: "E",
    text: "Sustainable architecture now influences how cities manage energy and waste. Green roofs, solar panels, and improved insulation reduce the carbon footprint of large buildings. Some cities require new developments to meet strict environmental standards before receiving construction permits.",
  },
  {
    id: "p2F",
    label: "F",
    text: "Public transport networks remain essential to managing urban growth. Cities that invest in metros, trams, and cycling infrastructure often report lower congestion and better air quality. Architects increasingly design stations and hubs that integrate with surrounding neighbourhoods rather than standing isolated.",
  },
];

const HEADINGS_LIST = [
  { key: "i", label: "The environmental cost of early industry" },
  { key: "ii", label: "A philosophy of functional design" },
  { key: "iii", label: "Rebuilding cities after conflict" },
  { key: "iv", label: "Opposition to large-scale demolition" },
  { key: "v", label: "Energy-efficient building practices" },
  { key: "vi", label: "Transport as part of urban planning" },
  { key: "vii", label: "The rise of vertical construction" },
  { key: "viii", label: "Preserving rural architecture" },
];

const PASSAGE_2_TFNG = [
  { text: "Skyscrapers became possible partly because of steel frames and elevators.", correct: "TRUE" },
  { text: "Le Corbusier preferred highly decorative building styles.", correct: "FALSE" },
  { text: "All European cities rebuilt identical districts after the war.", correct: "FALSE" },
  { text: "Urban renewal projects sometimes removed low-income communities.", correct: "TRUE" },
  { text: "Every modern city requires solar panels on all new buildings.", correct: "NOT GIVEN" },
  { text: "Cities with strong public transport often have less congestion.", correct: "TRUE" },
  { text: "Architects now design transport hubs to connect with local areas.", correct: "TRUE" },
];

const PASSAGE_2_HEADINGS = [
  { paragraphId: "p2A", label: "A", correct: "vii" },
  { paragraphId: "p2B", label: "B", correct: "ii" },
  { paragraphId: "p2C", label: "C", correct: "iii" },
  { paragraphId: "p2D", label: "D", correct: "iv" },
  { paragraphId: "p2E", label: "E", correct: "v" },
  { paragraphId: "p2F", label: "F", correct: "vi" },
];

const PASSAGE_3_PARAGRAPHS = [
  {
    id: "p3A",
    label: "A",
    text: "Marine biologists study organisms that live in oceans, estuaries, and coastal waters. Research vessels collect samples of plankton, water temperature readings, and sediment from the seafloor. These measurements help scientists track changes in biodiversity over time.",
  },
  {
    id: "p3B",
    label: "B",
    text: "Coral reefs support an extraordinary variety of species, yet they are highly sensitive to rising sea temperatures. When corals become stressed, they expel the algae living in their tissues, a process known as bleaching. Without these algae, corals lose their colour and may die if conditions do not improve.",
  },
  {
    id: "p3C",
    label: "C",
    text: "Overfishing reduces populations of key species and disrupts food chains. International agreements attempt to set catch limits, but enforcement remains difficult in open waters. Some nations have established marine protected areas where fishing is restricted or banned entirely.",
  },
  {
    id: "p3D",
    label: "D",
    text: "Plastic pollution poses a separate threat because debris accumulates in ocean currents. Sea turtles and seabirds sometimes mistake fragments for food. Microplastics have been found in fish consumed by humans, raising questions about long-term health effects.",
  },
  {
    id: "p3E",
    label: "E",
    text: "Conservation programmes often depend on cooperation between governments, researchers, and local communities. Citizen science projects invite volunteers to record sightings of whales and dolphins, expanding the data available to scientists. Education campaigns encourage reduced use of single-use plastics near coastlines.",
  },
  {
    id: "p3F",
    label: "F",
    text: "Restoration efforts include replanting seagrass meadows and rebuilding oyster reefs that filter water naturally. These habitats absorb carbon and provide nursery grounds for young fish. Although expensive, such projects demonstrate that damaged ecosystems can recover when pressure is reduced.",
  },
];

const PASSAGE_3_SENTENCE = [
  { text: "Marine biologists collect samples of ___ from the ocean.", correct: "plankton" },
  { text: "Corals lose their colour during a process called ___.", correct: "bleaching" },
  { text: "When corals expel algae, they may ___ if conditions stay poor.", correct: "die" },
  { text: "Some countries have created ___ where fishing is limited.", correct: "marine protected areas" },
  { text: "Sea turtles may eat plastic because they mistake it for ___.", correct: "food" },
  { text: "Volunteers help scientists by recording sightings of whales and ___.", correct: "dolphins" },
  { text: "Oyster reefs can ___ water naturally.", correct: "filter" },
];

const PASSAGE_3_SHORT = [
  { text: "What do research vessels measure besides plankton?", correct: "water temperature" },
  { text: "What living things do corals expel when stressed?", correct: "algae" },
  { text: "What is difficult to enforce in open waters?", correct: "catch limits" },
  { text: "What have scientists found in fish eaten by humans?", correct: "microplastics" },
  { text: "Who cooperates in many conservation programmes?", correct: "local communities" },
  { text: "What type of meadows are replanted in restoration projects?", correct: "seagrass" },
  { text: "What do healthy habitats provide for young fish?", correct: "nursery grounds" },
];

/** @returns {MockQuestion[]} */
function buildPassage1Questions() {
  return buildMultipleChoiceQuestions("p1", PASSAGE_1_MC);
}

/** @returns {MockQuestion[]} */
function buildPassage2Questions() {
  /** @type {MockQuestion[]} */
  const tfng = PASSAGE_2_TFNG.map((item, i) => ({
    id: `p2-tfng-${i + 1}`,
    globalNumber: 0,
    kind: "true-false-not-given",
    typeLabel: "True / False / Not Given",
    typeSlug: "true-false-not-given",
    groupLabel: "Questions 14–20",
    text: item.text,
    correct: item.correct,
  }));

  const headings = PASSAGE_2_HEADINGS.map((item, i) => ({
    id: `p2-head-${i + 1}`,
    globalNumber: 0,
    kind: "matching-headings",
    typeLabel: "Matching Headings",
    typeSlug: "matching-headings",
    groupLabel: "Questions 21–26",
    paragraphId: item.paragraphId,
    text: `Paragraph ${item.label}`,
    headings: HEADINGS_LIST,
    correct: item.correct,
  }));

  return [...tfng, ...headings];
}

/** @returns {MockQuestion[]} */
function buildPassage3Questions() {
  const sentence = PASSAGE_3_SENTENCE.map((item, i) => ({
    id: `p3-sent-${i + 1}`,
    globalNumber: 0,
    kind: "sentence-completion",
    typeLabel: "Sentence Completion",
    typeSlug: "sentence-completion",
    groupLabel: "Questions 27–33",
    text: item.text,
    correct: item.correct,
  }));

  const short = PASSAGE_3_SHORT.map((item, i) => ({
    id: `p3-short-${i + 1}`,
    globalNumber: 0,
    kind: "short-answer",
    typeLabel: "Short Answer",
    typeSlug: "short-answer",
    groupLabel: "Questions 34–40",
    text: item.text,
    correct: item.correct,
  }));

  return [...sentence, ...short];
}

const RAW_PASSAGES = [
  {
    id: "mock-passage-1",
    index: 1,
    title: "The History of Coffee",
    paragraphs: PASSAGE_1_PARAGRAPHS,
    questions: buildPassage1Questions(),
    questionCount: 13,
    startNumber: 1,
    endNumber: 13,
  },
  {
    id: "mock-passage-2",
    index: 2,
    title: "Urban Architecture and Modern Cities",
    paragraphs: PASSAGE_2_PARAGRAPHS,
    questions: buildPassage2Questions(),
    questionCount: 13,
    startNumber: 14,
    endNumber: 26,
  },
  {
    id: "mock-passage-3",
    index: 3,
    title: "Marine Biology and Ocean Conservation",
    paragraphs: PASSAGE_3_PARAGRAPHS,
    questions: buildPassage3Questions(),
    questionCount: 14,
    startNumber: 27,
    endNumber: 40,
  },
];

/** @type {MockTestConfig} */
/** PRACTICE ONLY — do not use in full mock exams (see lib/mock-test/mockContentRegistry.ts). */
export const FULL_MOCK_TEST = {
  testId: "full-mock-reading-1",
  title: "IELTS Reading Mock Test",
  durationSeconds: 3600,
  totalQuestions: 40,
  passages: annotatePassageNumbers(RAW_PASSAGES),
};

/** @type {Record<string, MockTestConfig>} */
export const PASSAGE_TESTS = {
  "1": {
    testId: "passage-test-1",
    title: "Timed Passage — The History of Coffee",
    durationSeconds: 1200,
    totalQuestions: 13,
    passages: annotatePassageNumbers([RAW_PASSAGES[0]]),
  },
  "2": {
    testId: "passage-test-2",
    title: "Timed Passage — Urban Architecture and Modern Cities",
    durationSeconds: 1200,
    totalQuestions: 13,
    passages: annotatePassageNumbers([RAW_PASSAGES[1]]),
  },
  "3": {
    testId: "passage-test-3",
    title: "Timed Passage — Marine Biology and Ocean Conservation",
    durationSeconds: 1200,
    totalQuestions: 14,
    passages: annotatePassageNumbers([RAW_PASSAGES[2]]),
  },
};

/** @param {MockTestConfig} config */
export function getAllQuestions(config) {
  return config.passages.flatMap((p) => p.questions);
}

/** @param {MockTestConfig} config */
export function buildMockCorrectAnswers(config) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const q of getAllQuestions(config)) {
    if (q.correct) map[q.id] = q.correct;
  }
  return map;
}

/** @param {string} id */
export function getPassageTest(id) {
  return PASSAGE_TESTS[String(id)] ?? null;
}

export const READING_TEST_RESULTS_KEY = "reading_test_results";
