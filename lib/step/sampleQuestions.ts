import type { StepMcqQuestion } from "./types";
import type { StepSectionId } from "./examModel";

type Bank = Record<StepSectionId, StepMcqQuestion[]>;

const bank: Bank = {
  reading: [
    {
      id: "r1",
      section: "reading",
      questionType: "word_meaning_in_context",
      stem: 'The word "meticulous" in paragraph 2 is closest in meaning to:',
      options: {
        A: "careless",
        B: "very careful and detailed",
        C: "quick and efficient",
        D: "confused",
      },
      correct: "B",
      explanation:
        "Meticulous means showing great attention to detail — very careful and detailed.",
    },
    {
      id: "r2",
      section: "reading",
      questionType: "general_understanding",
      stem: "What is the main topic of the passage?",
      options: {
        A: "How telescopes are built",
        B: "The life cycle of stars including black holes",
        C: "Why the Sun will never die",
        D: "Space travel to other galaxies",
      },
      correct: "B",
      explanation: "The passage discusses stars, their death, and black holes as dead stars.",
    },
    {
      id: "r3",
      section: "reading",
      questionType: "developing_an_interpretation",
      stem: "According to the passage, why can we not see black holes?",
      options: {
        A: "They are too far away",
        B: "They do not allow light to escape",
        C: "They are hidden behind planets",
        D: "Telescopes are not powerful enough",
      },
      correct: "B",
      explanation: "Gravity pulls everything including light inward, so no light returns to our eyes.",
    },
    {
      id: "r4",
      section: "reading",
      questionType: "examining_content",
      stem: "The author's purpose in paragraph 1 is mainly to:",
      options: {
        A: "argue against using telescopes",
        B: "introduce what we can observe in the night sky",
        C: "prove that black holes do not exist",
        D: "describe how to build a telescope",
      },
      correct: "B",
      explanation: "Paragraph 1 lists objects visible in the night sky and how telescopes help.",
    },
    {
      id: "r5",
      section: "reading",
      questionType: "reading_to_perform_a_task",
      stem: "Where would you find the Index in the textbook described?",
      options: {
        A: "Chapter 2",
        B: "Before the Study Guide",
        C: "At the end of the book",
        D: "Chapter 7 only",
      },
      correct: "C",
      explanation: "Table of contents shows Index and Glossary at page 139, at the end.",
    },
  ],
  structure: [
    {
      id: "s1",
      section: "structure",
      questionType: "comparatives_superlatives",
      stem: "Ahmad is _______ student in his class.",
      options: { A: "good", B: "better", C: "the best", D: "best" },
      correct: "C",
      explanation: "Superlative with article: the best.",
    },
    {
      id: "s2",
      section: "structure",
      questionType: "tense_selection",
      stem: "By the time we arrived, the lecture _______.",
      options: {
        A: "already started",
        B: "has already started",
        C: "had already started",
        D: "was already starting",
      },
      correct: "C",
      explanation: "Past perfect for an action completed before another past action.",
    },
    {
      id: "s3",
      section: "structure",
      questionType: "subject_verb_agreement",
      stem: "Neither the students nor the teacher _______ present yesterday.",
      options: { A: "was", B: "were", C: "is", D: "are" },
      correct: "A",
      explanation: "With neither...nor, verb agrees with the nearer subject (teacher → was).",
    },
    {
      id: "s4",
      section: "structure",
      questionType: "prepositions",
      stem: "She has been interested _______ medicine since childhood.",
      options: { A: "for", B: "in", C: "on", D: "at" },
      correct: "B",
      explanation: "Interested in is the correct collocation.",
    },
    {
      id: "s5",
      section: "structure",
      questionType: "modals_and_conditionals",
      stem: "If I _______ more time, I would revise all the grammar rules.",
      options: { A: "have", B: "had", C: "will have", D: "would have" },
      correct: "B",
      explanation: "Second conditional: If + past simple, would + base verb.",
    },
  ],
  listening: [
    {
      id: "l1",
      section: "listening",
      questionType: "short_dialogue_detail",
      stem: "What does the speaker mean by 'burning the midnight oil'?",
      options: {
        A: "Sleeping late",
        B: "Studying all night",
        C: "Running out of oil",
        D: "Using too much electricity",
      },
      correct: "B",
      explanation: "Idiom meaning studying or working late into the night.",
    },
    {
      id: "l2",
      section: "listening",
      questionType: "numbers_dates_places",
      stem: "When was the car last serviced?",
      options: {
        A: "13,000 km check-up",
        B: "30,000 km check-up",
        C: "14,000 km check-up",
        D: "40,000 km check-up",
      },
      correct: "B",
      explanation: "Customer says last visit was for the 30,000 kilometer check-up.",
    },
    {
      id: "l3",
      section: "listening",
      questionType: "speaker_intent",
      stem: "Why is the agent surprised about the Accent model?",
      options: {
        A: "The customer is too short",
        B: "The customer is quite tall for a compact car",
        C: "The car is too expensive",
        D: "The car is the wrong colour",
      },
      correct: "B",
      explanation: "Agent says the customer is kind of tall for an Accent.",
    },
    {
      id: "l4",
      section: "listening",
      questionType: "inference_from_conversation",
      stem: "Why did the customer not fix the seat belt?",
      options: {
        A: "It was not broken",
        B: "To keep the repair bill low",
        C: "The part was unavailable",
        D: "The agent refused",
      },
      correct: "B",
      explanation: "Customer wants to keep the bill low.",
    },
    {
      id: "l5",
      section: "listening",
      questionType: "numbers_dates_places",
      stem: "The service centre will call if repairs exceed:",
      options: {
        A: "SR 1,000",
        B: "SR 1,500",
        C: "SR 2,000",
        D: "SR 2,500",
      },
      correct: "C",
      explanation: "Agent asks to call if charge will be more than SR 2,000.",
    },
  ],
  compositional_analysis: [
    {
      id: "c1",
      section: "compositional_analysis",
      questionType: "correct_word_order",
      stem: "Which sentence has the correct word order?",
      options: {
        A: "Never I have seen such a result.",
        B: "I have never seen such a result.",
        C: "Have never I seen such a result.",
        D: "Seen such a result I have never.",
      },
      correct: "B",
      explanation: "Standard subject–auxiliary–adverb order in English.",
    },
    {
      id: "c2",
      section: "compositional_analysis",
      questionType: "punctuation_accuracy",
      stem: "Which sentence has correct punctuation?",
      options: {
        A: "After the exam he checked his answers.",
        B: "After the exam, he checked his answers.",
        C: "After, the exam he checked his answers.",
        D: "After the exam he, checked his answers.",
      },
      correct: "B",
      explanation: "Introductory adverbial clause needs a comma before the main clause.",
    },
    {
      id: "c3",
      section: "compositional_analysis",
      questionType: "identify_incorrect_underlined",
      stem: "Identify the INCORRECT underlined word: Several students were confused until they meet with the teacher.",
      options: { A: "Several", B: "were", C: "meet", D: "with" },
      correct: "C",
      explanation: "Past context requires met, not meet.",
    },
    {
      id: "c4",
      section: "compositional_analysis",
      questionType: "sentence_combining",
      stem: "He switched to medicine. His focus changed. Combine using the best connector:",
      options: { A: "so that", B: "because", C: "then", D: "although" },
      correct: "B",
      explanation: "Focus change is the cause; switching is the effect — because fits.",
    },
    {
      id: "c5",
      section: "compositional_analysis",
      questionType: "synonym_precision",
      stem: "Choose the word that does NOT belong:",
      options: { A: "happy", B: "joyful", C: "delighted", D: "furniture" },
      correct: "D",
      explanation: "Furniture is a noun; the others are adjectives describing emotion.",
    },
  ],
};

export function getSampleQuestions(
  section: StepSectionId,
  count = 5
): StepMcqQuestion[] {
  const items = bank[section] ?? [];
  return items.slice(0, count);
}

/** 5 questions per section = 20-question diagnostic */
export function getDiagnosticQuestions(): StepMcqQuestion[] {
  const sections: StepSectionId[] = [
    "reading",
    "structure",
    "listening",
    "compositional_analysis",
  ];
  return sections.flatMap((s) => getSampleQuestions(s, 5));
}

export function getPhaseExitQuestions(phase: number): StepMcqQuestion[] {
  const phaseFocus: Record<number, StepSectionId[]> = {
    1: ["structure", "reading"],
    2: ["reading", "structure"],
    3: ["listening", "compositional_analysis"],
    4: ["reading", "structure", "listening", "compositional_analysis"],
  };
  const sections = phaseFocus[phase] ?? phaseFocus[1];
  return sections.flatMap((s) => getSampleQuestions(s, 5));
}

export function getFullMockQuestions(): StepMcqQuestion[] {
  const sections: StepSectionId[] = [
    "reading",
    "structure",
    "listening",
    "compositional_analysis",
  ];
  return sections.flatMap((s) => getSampleQuestions(s, 5));
}

export function normalizeStepQuestions(raw: unknown): StepMcqQuestion[] {
  if (!raw || typeof raw !== "object") return [];

  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.items)) {
    return obj.items as StepMcqQuestion[];
  }

  if (Array.isArray(obj.passages)) {
    return (obj.passages as { questions?: StepMcqQuestion[] }[]).flatMap(
      (p) => p.questions ?? []
    );
  }

  if (Array.isArray(obj.recordings)) {
    return (obj.recordings as { questions?: StepMcqQuestion[] }[]).flatMap(
      (r) => r.questions ?? []
    );
  }

  return [];
}
