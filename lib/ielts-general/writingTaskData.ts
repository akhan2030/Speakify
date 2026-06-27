export type LetterType = "formal" | "semi_formal" | "informal";

export type GeneralLetterQuestion = {
  id: string;
  letterType: LetterType;
  label: string;
  situation: string;
  bulletPoints: string[];
  prompt: string;
};

export type GeneralEssayType =
  | "Opinion"
  | "Discussion"
  | "Agree / Disagree"
  | "Problem & Solution"
  | "Advantages & Disadvantages";

export type GeneralTask2Question = {
  id: string;
  label: string;
  essayType: GeneralEssayType;
  prompt: string;
};

export const LETTER_TYPE_LABELS: Record<LetterType, string> = {
  formal: "Formal",
  semi_formal: "Semi-formal",
  informal: "Informal",
};

function buildLetterPrompt(q: Omit<GeneralLetterQuestion, "prompt">): string {
  const bullets = q.bulletPoints.map((b) => `- ${b}`).join("\n");
  return `${q.situation}\n\nIn your letter:\n${bullets}\n\nWrite at least 150 words. You do not need to include addresses. Use a ${LETTER_TYPE_LABELS[q.letterType].toLowerCase()} tone throughout.`;
}

export const GENERAL_LETTER_QUESTIONS: GeneralLetterQuestion[] = [
  {
    id: "formal-hotel-complaint",
    letterType: "formal",
    label: "Hotel complaint",
    situation:
      "You recently stayed at a hotel for a business trip. The room was noisy and the Wi‑Fi did not work, which affected your work.",
    bulletPoints: [
      "explain why you stayed at the hotel",
      "describe the problems you experienced",
      "say what you would like the manager to do",
    ],
    prompt: "",
  },
  {
    id: "formal-job-application",
    letterType: "formal",
    label: "Job application",
    situation:
      "You saw an advertisement for a part-time customer service position at a local company.",
    bulletPoints: [
      "say which job you are applying for",
      "describe your relevant experience",
      "explain why you would be suitable for the role",
    ],
    prompt: "",
  },
  {
    id: "semi-formal-landlord-repair",
    letterType: "semi_formal",
    label: "Request a repair",
    situation:
      "You rent a flat and the heating system has stopped working during winter.",
    bulletPoints: [
      "explain the problem",
      "say how it is affecting you",
      "request that the issue be fixed soon",
    ],
    prompt: "",
  },
  {
    id: "semi-formal-colleague-event",
    letterType: "semi_formal",
    label: "Colleague leaving",
    situation: "A colleague is leaving your workplace to move to another city.",
    bulletPoints: [
      "say how you feel about their departure",
      "mention a positive memory from working together",
      "wish them well for the future",
    ],
    prompt: "",
  },
  {
    id: "informal-friend-visit",
    letterType: "informal",
    label: "Invite a friend",
    situation:
      "You are planning a short trip to your hometown and would like your friend to join you.",
    bulletPoints: [
      "invite your friend to come with you",
      "say when you plan to travel",
      "suggest some activities you could do together",
    ],
    prompt: "",
  },
  {
    id: "informal-friend-advice",
    letterType: "informal",
    label: "Give advice",
    situation:
      "A friend has written to you because they are thinking of changing jobs.",
    bulletPoints: [
      "acknowledge their situation",
      "give your opinion about changing jobs",
      "offer practical suggestions",
    ],
    prompt: "",
  },
].map((q) => ({ ...q, prompt: buildLetterPrompt(q) }));

/** General Training Task 2 — everyday topics (not Academic graph/report Task 1). */
export const GENERAL_TASK2_QUESTIONS: GeneralTask2Question[] = [
  {
    id: "gt-public-transport",
    label: "Opinion",
    essayType: "Opinion",
    prompt:
      "Some people believe that governments should make public transport free for everyone. Others think users should pay. Discuss both views and give your own opinion.",
  },
  {
    id: "gt-working-from-home",
    label: "Agree / Disagree",
    essayType: "Agree / Disagree",
    prompt:
      "Many employees now work from home at least part of the week. Do the advantages of this trend outweigh the disadvantages?",
  },
  {
    id: "gt-children-technology",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    prompt:
      "Children today spend a lot of time using smartphones and tablets. What problems does this cause? What solutions can parents and schools offer?",
  },
  {
    id: "gt-local-shops",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    prompt:
      "In many towns, small local shops are closing because people prefer shopping in large supermarkets. What are the advantages and disadvantages of this development?",
  },
  {
    id: "gt-community-volunteering",
    label: "Discussion",
    essayType: "Discussion",
    prompt:
      "Some people think young people should do voluntary work in their community. Others believe they should focus on their career or studies. Discuss both views and give your opinion.",
  },
];

const LETTER_SESSION_KEY = "ielts-general-writing-letter-question";
const TASK2_SESSION_KEY = "ielts-general-writing-task2-question";

function pickSessionIndex(poolLength: number, storageKey: string): number {
  if (typeof window === "undefined" || poolLength === 0) return 0;

  const stored = sessionStorage.getItem(storageKey);
  if (stored !== null) {
    const parsed = Number(stored);
    if (Number.isFinite(parsed)) return parsed % poolLength;
  }

  const index = Math.floor(Math.random() * poolLength);
  sessionStorage.setItem(storageKey, String(index));
  return index;
}

export function getSessionGeneralLetterQuestion(): GeneralLetterQuestion {
  return GENERAL_LETTER_QUESTIONS[
    pickSessionIndex(GENERAL_LETTER_QUESTIONS.length, LETTER_SESSION_KEY)
  ];
}

export function getSessionGeneralTask2Question(): GeneralTask2Question {
  return GENERAL_TASK2_QUESTIONS[
    pickSessionIndex(GENERAL_TASK2_QUESTIONS.length, TASK2_SESSION_KEY)
  ];
}

export function setGeneralLetterQuestionIndex(index: number): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(
      LETTER_SESSION_KEY,
      String(index % GENERAL_LETTER_QUESTIONS.length)
    );
  }
}

export function setGeneralTask2QuestionIndex(index: number): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(
      TASK2_SESSION_KEY,
      String(index % GENERAL_TASK2_QUESTIONS.length)
    );
  }
}
