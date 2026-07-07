export type WritingLessonSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { label: string; formal: string; informal: string }[];
};

export type WritingLesson = {
  slug: string;
  number: number;
  title: string;
  minutes: number;
  desc: string;
  /** Which writing task this lesson primarily supports */
  taskFocus: "task1" | "task2" | "shared";
  sections: WritingLessonSection[];
  practice: {
    title: string;
    prompt: string;
    placeholder: string;
  };
};

export const GT_WRITING_LESSONS: WritingLesson[] = [
  {
    slug: "formal-letter-structure",
    number: 1,
    title: "Formal Letter Structure",
    minutes: 12,
    taskFocus: "task1",
    desc: "Opening, purpose, bullet points, and appropriate closing for formal letters.",
    sections: [
      {
        title: "What is a formal letter?",
        paragraphs: [
          "A formal letter is used when you write to a company, authority, or someone you do not know personally. In IELTS General Training Task 1, formal letters often involve complaints, requests, applications, or enquiries.",
        ],
      },
      {
        title: "The 4-part structure",
        bullets: [
          "Opening — greet the reader correctly",
          "Purpose — state why you are writing in the first paragraph",
          "Body — explain details, requests, or complaints (bullet points are acceptable)",
          "Closing — end politely with the correct sign-off",
        ],
      },
      {
        title: "Correct openings",
        bullets: [
          '"Dear Sir/Madam," — when you do not know the reader\'s name',
          '"Dear Mr Smith," / "Dear Ms Jones," — when you know the surname',
          "Never use a first name only in a formal letter",
        ],
      },
      {
        title: "Purpose statement (first paragraph)",
        bullets: [
          '"I am writing to request..."',
          '"I am writing to complain about..."',
          '"I am writing to enquire about..."',
          "State your reason clearly in one or two sentences before giving details",
        ],
      },
      {
        title: "Body & bullet points",
        paragraphs: [
          "In GT Task 1, you may use bullet points in the body when listing requests or complaints. This is acceptable and helps the examiner see that you covered all bullet points in the question.",
        ],
      },
      {
        title: "Correct closings",
        bullets: [
          '"Yours faithfully," — when you started with "Dear Sir/Madam," (you do not know the name)',
          '"Yours sincerely," — when you used "Dear Mr/Ms + surname"',
        ],
      },
      {
        title: "Common mistakes to avoid",
        bullets: [
          "Copying the question word-for-word without paraphrasing",
          "Using informal language (e.g. \"Hi\", \"Thanks a lot\", contractions in very formal letters)",
          "Missing a clear purpose statement in paragraph 1",
          "Wrong closing for the opening you used",
        ],
      },
    ],
    practice: {
      title: "Practice exercise",
      prompt:
        "Write the opening paragraph of a formal letter to a landlord complaining about a broken heating system. Include a greeting, purpose statement, and one sentence of detail.",
      placeholder:
        "Dear Sir/Madam,\n\nI am writing to complain about...",
    },
  },
  {
    slug: "semi-formal-informal-tone",
    number: 2,
    title: "Semi-formal & Informal Tone",
    minutes: 10,
    taskFocus: "task1",
    desc: "When to use Dear + first name, contractions, and friendly closings.",
    sections: [
      {
        title: "Semi-formal letters",
        paragraphs: [
          "Use semi-formal tone when you write to someone you know in a professional context — for example a manager, a teacher, or a colleague you have met before.",
        ],
        bullets: [
          'Opening: "Dear [First name]," — e.g. "Dear Sarah,"',
          "Contractions are acceptable (I'm, can't, I'd)",
          'Closing: "Best regards," / "Kind regards,"',
        ],
      },
      {
        title: "Informal letters",
        paragraphs: [
          "Informal letters are written to friends or family members. The tone is warm and conversational.",
        ],
        bullets: [
          'Opening: "Hi [name]," / "Dear [name],"',
          "Use contractions freely",
          'Closing: "Take care," / "See you soon," / "Love," (close friends/family)',
        ],
      },
      {
        title: "Tone differences",
        bullets: [
          "Formal: avoids contractions, uses full forms and polite distance",
          "Semi-formal: polite but personal; contractions OK",
          "Informal: friendly, direct, conversational vocabulary",
        ],
      },
      {
        title: "Vocabulary comparison",
        table: [
          { label: "Request", formal: "I would like to", informal: "I want to" },
          { label: "Unable", formal: "I am unable to", informal: "I can't" },
          { label: "Attach", formal: "Please find enclosed", informal: "Here is" },
          { label: "Ask", formal: "I would be grateful if you could", informal: "Can you" },
        ],
      },
    ],
    practice: {
      title: "Practice exercise",
      prompt:
        'Rewrite this formal paragraph in an informal style for a letter to a friend:\n\n"I am writing to inform you that I am unable to attend the event on Saturday. I would be grateful if you could convey my apologies to the group."\n\nWrite your informal version below.',
      placeholder: "Hi [friend's name],\n\nJust wanted to let you know...",
    },
  },
  {
    slug: "gt-task2-structure",
    number: 1,
    title: "General Task 2 Essay Structure",
    minutes: 15,
    taskFocus: "task2",
    desc: "Clear position, balanced paragraphs, and practical examples.",
    sections: [
      {
        title: "GT Task 2 vs Academic",
        paragraphs: [
          "General Training Task 2 uses the same essay format as Academic Task 2, but topics are more everyday — family, work, technology, environment, health, and community issues rather than abstract academic themes.",
        ],
      },
      {
        title: "The 4-paragraph structure",
        bullets: [
          "Introduction — paraphrase the question + thesis (your position)",
          "Body 1 — first main reason or viewpoint with explanation and example",
          "Body 2 — second main reason, counter-argument, or further development",
          "Conclusion — restate your position; do not add new ideas",
        ],
      },
      {
        title: "Introduction",
        bullets: [
          "Paraphrase the question in your own words",
          "Give a clear thesis: agree, disagree, or balanced opinion",
          "Keep it to 2–3 sentences",
        ],
      },
      {
        title: "Body paragraphs",
        bullets: [
          "Start with a topic sentence",
          "Explain your idea clearly",
          "Add a specific example (from life, work, or society)",
        ],
      },
      {
        title: "Conclusion",
        paragraphs: [
          "Summarise your main points and restate your position. Do not introduce new arguments or examples in the conclusion.",
        ],
      },
      {
        title: "Common GT Task 2 topics",
        bullets: [
          "Crime and punishment",
          "Family values and parenting",
          "Education and schools",
          "Health and lifestyle",
          "Technology and social media",
          "Environment and pollution",
          "Work and careers",
        ],
      },
    ],
    practice: {
      title: "Practice exercise",
      prompt:
        'Write an introduction (2–3 sentences) for this question:\n\n"Some people think children should learn to cook at school. Do you agree or disagree?"\n\nInclude a paraphrase and a clear thesis.',
      placeholder:
        "It is argued that cooking should be taught in schools. I completely agree because...",
    },
  },
  {
    slug: "gt-vocabulary",
    number: 1,
    title: "Everyday Vocabulary for GT Writing",
    minutes: 10,
    taskFocus: "shared",
    desc: "Useful phrases for letters about work, housing, travel, and friends.",
    sections: [
      {
        title: "Work / employment",
        bullets: [
          '"I am writing to apply for..."',
          '"I would like to enquire about..."',
          '"I am available to start from..."',
          '"I have extensive experience in..."',
        ],
      },
      {
        title: "Housing",
        bullets: [
          '"I wish to bring to your attention..."',
          '"The property requires urgent attention regarding..."',
          '"I would appreciate a prompt response"',
          '"I have been a tenant since..."',
        ],
      },
      {
        title: "Travel / transport",
        bullets: [
          '"I am writing to request a refund for..."',
          '"I would like to report a lost item..."',
          '"I was disappointed to find that..."',
          '"I hope you can resolve this matter quickly"',
        ],
      },
      {
        title: "Friends / social",
        bullets: [
          '"I hope this letter finds you well"',
          '"It was great to hear from you"',
          '"I would love it if you could..."',
          '"Let me know when you are free"',
        ],
      },
      {
        title: "Useful linkers for GT letters",
        bullets: [
          "Firstly,",
          "Furthermore,",
          "However,",
          "In addition,",
          "I look forward to hearing from you",
        ],
      },
    ],
    practice: {
      title: "Practice exercise",
      prompt:
        "Complete this semi-formal letter using appropriate phrases from the lesson:\n\nDear Mr Ahmed,\n\nI am writing to ___(1)___ about the noise from the flat above mine. ___(2)___, the problem has continued for three weeks. ___(3)___, I would appreciate your help in resolving this. ___(4)___\n\nYours sincerely,\n[Your name]",
      placeholder: "Rewrite the full letter with the blanks filled in...",
    },
  },
];

export const GT_WRITING_LESSON_COUNT = GT_WRITING_LESSONS.length;

export type GtWritingLessonTrack = "task1" | "task2";

export const GT_WRITING_LESSON_TRACKS: {
  id: GtWritingLessonTrack;
  label: string;
  headline: string;
  description: string;
  criterion: string;
  criterionFull: string;
  accent: string;
  accentSoft: string;
}[] = [
  {
    id: "task1",
    label: "Task 1",
    headline: "Letter",
    description:
      "Write a formal, semi-formal, or informal letter in 150+ words. Scored on Task Achievement (TA).",
    criterion: "TA",
    criterionFull: "Task Achievement",
    accent: "#0d9488",
    accentSoft: "rgba(13, 148, 136, 0.1)",
  },
  {
    id: "task2",
    label: "Task 2",
    headline: "Essay",
    description:
      "Develop a clear position on an everyday topic in 250+ words. Scored on Task Response (TR).",
    criterion: "TR",
    criterionFull: "Task Response",
    accent: "#c9972c",
    accentSoft: "rgba(201, 151, 44, 0.12)",
  },
];

export function gtLessonsForTrack(track: GtWritingLessonTrack): WritingLesson[] {
  return GT_WRITING_LESSONS.filter((l) => l.taskFocus === track);
}

export function gtSharedWritingLessons(): WritingLesson[] {
  return GT_WRITING_LESSONS.filter((l) => l.taskFocus === "shared");
}

export function gtTrackProgress(
  track: GtWritingLessonTrack,
  completedSlugs: string[]
): { done: number; total: number } {
  const all = [...gtLessonsForTrack(track), ...gtSharedWritingLessons()];
  const done = all.filter((l) => completedSlugs.includes(l.slug)).length;
  return { done, total: all.length };
}

export function getWritingLesson(slug: string): WritingLesson | undefined {
  return GT_WRITING_LESSONS.find((l) => l.slug === slug);
}

export const LESSONS_STORAGE_KEY = "ielts-general-writing-lessons-completed";

export function readCompletedLessons(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LESSONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function markLessonComplete(slug: string): void {
  if (typeof window === "undefined") return;
  const current = new Set(readCompletedLessons());
  current.add(slug);
  localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify([...current]));
}
