/** @typedef {"Easy"|"Medium"|"Hard"} Difficulty */

/**
 * @typedef {object} PracticeQuestion
 * @property {string} id
 * @property {string} text
 * @property {"multiple-choice"|"true-false-not-given"|"matching-headings"|"matching-information"|"classification"|"sentence-completion"|"short-answer"} kind
 * @property {string} [correct]
 * @property {{ key: string, label: string }[]} [options]
 * @property {string} [paragraphId]
 * @property {{ key: string, label: string }[]} [headings]
 * @property {string} [evidence]
 * @property {{ key: string, label: string }[]} [categories]
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

  "matching-information": {
    passageId: "sample-matching-information-1",
    slug: "matching-information",
    name: "Matching Information",
    difficulty: "Medium",
    instructions:
      "Which paragraph contains the following information? Write the correct letter, A–E. You may use any letter more than once.",
    title: "The Rise of Smart Irrigation",
    paragraphs: [
      {
        id: "pA",
        label: "A",
        text: "Smart irrigation systems use soil moisture sensors to deliver water only when crops need it. Early adopters reported lower pumping costs within the first growing season.",
      },
      {
        id: "pB",
        label: "B",
        text: "Government grants in several arid regions helped farmers buy wireless controllers. Without subsidies, the upfront hardware cost remained a barrier for smaller holdings.",
      },
      {
        id: "pC",
        label: "C",
        text: "Researchers compared traditional flood irrigation with sensor-based schedules. Yields stayed similar, but average water use fell by nearly thirty percent.",
      },
      {
        id: "pD",
        label: "D",
        text: "Training programmes showed technicians how to calibrate sensors after winter freezes. Incorrect calibration often caused false dry readings and unnecessary watering.",
      },
      {
        id: "pE",
        label: "E",
        text: "Some communities raised concerns about data privacy when cloud platforms stored farm maps. Manufacturers responded by offering offline modes that keep records on local devices.",
      },
    ],
    questions: [
      {
        id: "mi1",
        kind: "matching-information",
        text: "A mention of financial support that reduced purchase prices for farmers",
        correct: "B",
        evidence:
          "Government grants in several arid regions helped farmers buy wireless controllers",
      },
      {
        id: "mi2",
        kind: "matching-information",
        text: "Evidence that water consumption dropped while harvest size did not decline",
        correct: "C",
        evidence:
          "Yields stayed similar, but average water use fell by nearly thirty percent",
      },
      {
        id: "mi3",
        kind: "matching-information",
        text: "A reason smaller farms delayed installing new equipment",
        correct: "B",
        evidence:
          "Without subsidies, the upfront hardware cost remained a barrier for smaller holdings",
      },
      {
        id: "mi4",
        kind: "matching-information",
        text: "A warning about inaccurate sensor settings after cold weather",
        correct: "D",
        evidence:
          "Incorrect calibration often caused false dry readings and unnecessary watering",
      },
      {
        id: "mi5",
        kind: "matching-information",
        text: "A reference to an optional mode that avoids sending farm data online",
        correct: "E",
        evidence:
          "offering offline modes that keep records on local devices",
      },
    ],
  },

  classification: {
    passageId: "sample-classification-1",
    slug: "classification",
    name: "Classification",
    difficulty: "Medium",
    instructions:
      "Classify each statement according to the categories below. Write the correct letter, A–C. You may use any letter more than once.",
    title: "Three Approaches to Urban Transport Planning",
    categories: [
      { key: "A", label: "Transit-oriented development" },
      { key: "B", label: "Road-capacity expansion" },
      { key: "C", label: "Travel-demand management" },
    ],
    paragraphs: [
      {
        id: "p1",
        label: "1",
        text: "Transit-oriented development concentrates housing and workplaces within walking distance of rail and bus corridors. Advocates argue that dense mixed-use districts around stations reduce private car trips and support frequent public services.",
      },
      {
        id: "p2",
        label: "2",
        text: "Road-capacity expansion focuses on adding lanes and building bypasses to keep vehicles moving. Supporters claim that bottleneck relief shortens commute times, although opponents warn that new road space often induces further traffic.",
      },
      {
        id: "p3",
        label: "3",
        text: "Travel-demand management uses pricing, workplace schemes and information tools to change when and how people travel. Congestion charges and flexible start times are common examples intended to spread peak demand across the day.",
      },
      {
        id: "p4",
        label: "4",
        text: "Cities rarely rely on a single approach. Some combine transit-oriented development near stations with travel-demand management incentives that discourage unnecessary midday driving while road-capacity projects remain limited to freight corridors.",
      },
    ],
    questions: [
      {
        id: "cl1",
        kind: "classification",
        text: "Places homes and jobs close to rail and bus corridors",
        correct: "A",
        evidence:
          "concentrates housing and workplaces within walking distance of rail and bus corridors",
      },
      {
        id: "cl2",
        kind: "classification",
        text: "Adds lanes and bypasses to keep vehicles moving",
        correct: "B",
        evidence:
          "adding lanes and building bypasses to keep vehicles moving",
      },
      {
        id: "cl3",
        kind: "classification",
        text: "Uses pricing tools such as congestion charges to reshape travel behaviour",
        correct: "C",
        evidence:
          "Congestion charges and flexible start times are common examples intended to spread peak demand",
      },
      {
        id: "cl4",
        kind: "classification",
        text: "Is criticised for attracting additional traffic after new road space appears",
        correct: "B",
        evidence:
          "new road space often induces further traffic",
      },
      {
        id: "cl5",
        kind: "classification",
        text: "Aims to reduce private car trips through dense mixed-use areas around stations",
        correct: "A",
        evidence:
          "dense mixed-use districts around stations reduce private car trips",
      },
    ],
  },

  "matching-sentence-endings": {
    passageId: "sample-matching-sentence-endings-1",
    slug: "matching-sentence-endings",
    name: "Matching Sentence Endings",
    difficulty: "Medium",
    instructions:
      "Complete each sentence with the correct ending. Choose from the list below. There are more endings than sentences. You may use each letter once only.",
    title: "Coral Reef Decline and Restoration",
    endings: [
      { key: "A", label: "to transplant cultivated coral fragments onto damaged reefs" },
      { key: "B", label: "because rising sea temperatures trigger widespread bleaching" },
      { key: "C", label: "by mapping fish populations with underwater drones" },
      { key: "D", label: "which protect shorelines from storm waves" },
      { key: "E", label: "after prolonged contact with agricultural fertiliser runoff" },
      { key: "F", label: "to attract more international cruise ships" },
      { key: "G", label: "that filter sunlight and reduce photosynthesis in algae" },
      { key: "H", label: "for storing excess crude oil beneath the seabed" },
    ],
    paragraphs: [
      {
        id: "p1",
        label: "1",
        text: "Healthy coral reefs create complex habitats for thousands of marine species, and they also form natural barriers which protect shorelines from storm waves by absorbing coastal energy. Scientists report that several reefs have faded because rising sea temperatures trigger widespread bleaching when symbiotic algae leave the coral tissue.",
      },
      {
        id: "p2",
        label: "2",
        text: "Restoration teams now learn to transplant cultivated coral fragments onto damaged reefs once water quality improves. Sediment plumes that filter sunlight and reduce photosynthesis in algae can slow recovery for months after dredging projects.",
      },
      {
        id: "p3",
        label: "3",
        text: "Nutrient pollution is another threat. Colonies often collapse after prolonged contact with agricultural fertiliser runoff that feeds algae blooms. Marketing ideas about cruise tourism remain unpopular with reef biologists, who warn that soft targets rarely become scientific priorities.",
      },
    ],
    questions: [
      {
        id: "mse1",
        kind: "matching-sentence-endings",
        text: "Coral structures help coastal communities",
        correct: "D",
        evidence: "which protect shorelines from storm waves by absorbing coastal energy",
      },
      {
        id: "mse2",
        kind: "matching-sentence-endings",
        text: "Many reefs lose colour",
        correct: "B",
        evidence: "because rising sea temperatures trigger widespread bleaching when symbiotic algae leave",
      },
      {
        id: "mse3",
        kind: "matching-sentence-endings",
        text: "Specialist crews are trained",
        correct: "A",
        evidence: "to transplant cultivated coral fragments onto damaged reefs once water quality improves",
      },
      {
        id: "mse4",
        kind: "matching-sentence-endings",
        text: "Recovery can stall when sediments",
        correct: "G",
        evidence: "that filter sunlight and reduce photosynthesis in algae can slow recovery",
      },
      {
        id: "mse5",
        kind: "matching-sentence-endings",
        text: "Some coral colonies die",
        correct: "E",
        evidence: "after prolonged contact with agricultural fertiliser runoff that feeds algae blooms",
      },
    ],
  },

  "matching-features": {
    passageId: "sample-matching-features-1",
    slug: "matching-features",
    name: "Matching Features",
    difficulty: "Medium",
    instructions:
      "Look at the following statements. Match each statement with the correct feature. Write the correct letter, A–E. You may use any letter more than once.",
    title: "Five Pioneer Soil Scientists",
    features: [
      { key: "A", label: "Helen Drake" },
      { key: "B", label: "Marco Velletri" },
      { key: "C", label: "Amina Okoro" },
      { key: "D", label: "Jon Fischer" },
      { key: "E", label: "Priya Nair" },
    ],
    paragraphs: [
      {
        id: "p1",
        label: "1",
        text: "Helen Drake measured clay mineral ratios across glacial till plains and argued that texture maps should guide fertiliser rates. Marco Velletri focused on root-zone bacteria and published evidence that certain microbial consortia accelerate nitrogen fixation in sandy soils.",
      },
      {
        id: "p2",
        label: "2",
        text: "Amina Okoro designed low-cost moisture sensors for smallholder plots and trained farmers to irrigate only when readings fell below a threshold. Jon Fischer studied wind erosion and recommended staggered shelterbelts after dust storms stripped topsoil from exposed fields.",
      },
      {
        id: "p3",
        label: "3",
        text: "Priya Nair compared compost blends and found that leaf litter mixed with manure raised organic carbon faster than compost alone. Drake later confirmed that her fertiliser maps reduced runoff near streams, while Okoro's sensors cut water use without lowering yields.",
      },
    ],
    questions: [
      {
        id: "mf1",
        kind: "matching-features",
        text: "Produced texture maps intended to guide fertiliser rates",
        correct: "A",
        evidence:
          "Helen Drake measured clay mineral ratios across glacial till plains and argued that texture maps should guide fertiliser rates",
      },
      {
        id: "mf2",
        kind: "matching-features",
        text: "Linked microbial consortia to faster nitrogen fixation in sandy soils",
        correct: "B",
        evidence:
          "certain microbial consortia accelerate nitrogen fixation in sandy soils",
      },
      {
        id: "mf3",
        kind: "matching-features",
        text: "Trained farmers to irrigate based on moisture sensor thresholds",
        correct: "C",
        evidence:
          "trained farmers to irrigate only when readings fell below a threshold",
      },
      {
        id: "mf4",
        kind: "matching-features",
        text: "Recommended shelterbelts after wind erosion removed topsoil",
        correct: "D",
        evidence:
          "recommended staggered shelterbelts after dust storms stripped topsoil from exposed fields",
      },
      {
        id: "mf5",
        kind: "matching-features",
        text: "Showed that fertiliser maps reduced runoff near streams",
        correct: "A",
        evidence:
          "her fertiliser maps reduced runoff near streams",
      },
      {
        id: "mf6",
        kind: "matching-features",
        text: "Found that leaf litter mixed with manure raised organic carbon quickly",
        correct: "E",
        evidence:
          "leaf litter mixed with manure raised organic carbon faster than compost alone",
      },
    ],
  },

  "diagram-completion": {
    passageId: "sample-diagram-completion-1",
    slug: "diagram-completion",
    name: "Diagram Completion",
    difficulty: "Hard",
    instructions:
      "Label the diagram below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
    title: "How a Simple Sand Filter Works",
    diagram: {
      title: "Domestic sand filter stages",
      orientation: "vertical",
      nodes: [
        { id: "1", kind: "fixed", text: "Raw water inlet" },
        {
          id: "2",
          kind: "blank",
          answer: "coarse screen",
          alternatives: ["screen"],
          evidence:
            "water first passes through a coarse screen that traps leaves and debris",
        },
        {
          id: "3",
          kind: "blank",
          answer: "settling tank",
          alternatives: ["settling chamber"],
          evidence:
            "flows into a settling tank where heavier grit sinks overnight",
        },
        {
          id: "4",
          kind: "blank",
          answer: "sand bed",
          alternatives: ["sand layer"],
          evidence:
            "pumped slowly through a sand bed that removes fine particles",
        },
        {
          id: "5",
          kind: "blank",
          answer: "charcoal layer",
          alternatives: ["charcoal bed"],
          evidence:
            "a charcoal layer absorbs dissolved chemicals and odours",
        },
        {
          id: "6",
          kind: "blank",
          answer: "clean outlet",
          alternatives: ["outlet pipe"],
          evidence:
            "treated water leaves through a clean outlet fitted with a tap",
        },
        { id: "7", kind: "fixed", text: "Storage cistern" },
      ],
    },
    paragraphs: [
      {
        id: "p1",
        label: "1",
        text: "In a domestic sand filter, raw water first passes through a coarse screen that traps leaves and debris. It then flows into a settling tank where heavier grit sinks overnight before pumping resumes.",
      },
      {
        id: "p2",
        label: "2",
        text: "Clarified water is pumped slowly through a sand bed that removes fine particles. Next, a charcoal layer absorbs dissolved chemicals and odours. Finally, treated water leaves through a clean outlet fitted with a tap and enters a storage cistern.",
      },
    ],
    questions: [
      {
        id: "2",
        kind: "diagram-completion",
        text: "Label 1",
        correct: "coarse screen",
        alternatives: ["screen"],
        evidence:
          "water first passes through a coarse screen that traps leaves and debris",
      },
      {
        id: "3",
        kind: "diagram-completion",
        text: "Label 2",
        correct: "settling tank",
        alternatives: ["settling chamber"],
        evidence:
          "flows into a settling tank where heavier grit sinks overnight",
      },
      {
        id: "4",
        kind: "diagram-completion",
        text: "Label 3",
        correct: "sand bed",
        alternatives: ["sand layer"],
        evidence:
          "pumped slowly through a sand bed that removes fine particles",
      },
      {
        id: "5",
        kind: "diagram-completion",
        text: "Label 4",
        correct: "charcoal layer",
        alternatives: ["charcoal bed"],
        evidence:
          "a charcoal layer absorbs dissolved chemicals and odours",
      },
      {
        id: "6",
        kind: "diagram-completion",
        text: "Label 5",
        correct: "clean outlet",
        alternatives: ["outlet pipe"],
        evidence:
          "treated water leaves through a clean outlet fitted with a tap",
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
