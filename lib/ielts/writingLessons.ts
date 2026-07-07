export type AcademicWritingLessonSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
};

export type AcademicWritingLesson = {
  slug: string;
  number: number;
  title: string;
  minutes: number;
  desc: string;
  sections: AcademicWritingLessonSection[];
  practice: {
    title: string;
    prompt: string;
    placeholder: string;
  };
};

export const ACADEMIC_WRITING_LESSONS: AcademicWritingLesson[] = [
  {
    slug: "essay-structure-band-6",
    number: 1,
    title: "Essay structure for Band 6+",
    minutes: 12,
    desc: "Introduction → body paragraphs → conclusion with clear thesis.",
    sections: [
      {
        title: "Why structure matters",
        paragraphs: [
          "Task 2 is worth twice as much as Task 1 in your Writing score, and Coherence & Cohesion (CC) is one of the four criteria. A clear, predictable structure is the fastest way to move from Band 5 to Band 6+ because it lets the examiner follow your argument without effort.",
          "Every Band 6+ essay follows the same four-paragraph skeleton. You do not need to be creative with structure — you need to be clear.",
        ],
      },
      {
        title: "The 4-paragraph structure",
        bullets: [
          "Introduction — paraphrase the question, then state your position (thesis)",
          "Body 1 — first main idea, explained and supported with an example",
          "Body 2 — second main idea (or the other side), explained and supported",
          "Conclusion — restate your position and summarise; add nothing new",
        ],
      },
      {
        title: "Introduction (2–3 sentences)",
        bullets: [
          "Sentence 1 — paraphrase the question in your own words (do not copy it)",
          "Sentence 2 — state your thesis: agree, disagree, or a balanced view",
          "Optional outline sentence — briefly signal what your two body paragraphs will cover",
        ],
      },
      {
        title: "Body paragraphs (the P-E-E-L method)",
        bullets: [
          "Point — start with a topic sentence stating the paragraph's main idea",
          "Explain — develop the idea logically (why is it true?)",
          "Example — give a specific, realistic example to support it",
          "Link — connect back to the question or the thesis",
        ],
      },
      {
        title: "Conclusion (2 sentences)",
        paragraphs: [
          "Restate your position using different words from the introduction, then summarise your two main ideas in one sentence. Never introduce a new argument or example in the conclusion — examiners penalise unsupported ideas.",
        ],
      },
      {
        title: "Common structure mistakes",
        bullets: [
          "No clear position (the examiner cannot tell what you think)",
          "One giant body paragraph instead of two focused ones",
          "Examples that are too vague ('some people', 'studies show') — be specific",
          "A conclusion that adds a brand-new idea",
        ],
      },
    ],
    practice: {
      title: "Practice exercise",
      prompt:
        'Write a full introduction (paraphrase + clear thesis) for this Task 2 question:\n\n"Some people believe that universities should only offer degrees that lead directly to jobs. To what extent do you agree or disagree?"',
      placeholder:
        "It is sometimes argued that universities ought to focus only on... In my opinion, I largely disagree because...",
    },
  },
  {
    slug: "task1-describing-trends",
    number: 2,
    title: "Task 1: describing trends",
    minutes: 15,
    desc: "Overview sentence, comparisons, and accurate data language.",
    sections: [
      {
        title: "What Academic Task 1 asks",
        paragraphs: [
          "In Academic Writing Task 1 you describe visual information — a line graph, bar chart, pie chart, table, map, or process diagram — in at least 150 words. You are scored on Task Achievement (TA): did you accurately report and summarise the key features, with data to support it?",
          "You must NOT give opinions or reasons. Task 1 is purely a factual report of what the visual shows.",
        ],
      },
      {
        title: "The 4-part structure",
        bullets: [
          "Introduction — paraphrase what the visual shows (1 sentence)",
          "Overview — describe the 2–3 biggest trends or most striking features (no numbers)",
          "Detail 1 — describe and support one group of data with figures",
          "Detail 2 — describe and support the remaining data with figures",
        ],
      },
      {
        title: "The overview is the most important sentence",
        paragraphs: [
          "You cannot score above Band 5 for Task Achievement without a clear overview. The overview summarises the main trends without specific numbers — for example, which value is highest, which is lowest, and the overall direction of change.",
        ],
        bullets: [
          '"Overall, sales of all three products increased over the period, with the sharpest rise seen in mobile phones."',
          '"In general, the majority of energy was generated from renewable sources, while coal use fell steadily."',
        ],
      },
      {
        title: "Language for describing change",
        table: {
          headers: ["Direction", "Verbs", "Nouns"],
          rows: [
            ["Up", "rose, increased, climbed, surged", "a rise, an increase, a surge"],
            ["Down", "fell, decreased, declined, dropped", "a fall, a decrease, a decline"],
            ["No change", "remained stable, levelled off, plateaued", "stability, a plateau"],
            ["Peak/low", "peaked at, reached a low of", "a peak, a low point"],
          ],
        },
      },
      {
        title: "Describing the degree and speed of change",
        bullets: [
          "Big change: dramatically, sharply, significantly, considerably",
          "Small change: slightly, marginally, gradually",
          "Adjective + noun: 'a dramatic increase', 'a slight fall'",
          "Adverb + verb: 'increased dramatically', 'fell slightly'",
        ],
      },
      {
        title: "Making comparisons accurately",
        bullets: [
          "Comparatives: 'higher than', 'twice as high as', 'far lower than'",
          "Superlatives: 'the highest', 'the least popular'",
          "Proportions: 'accounted for', 'made up', 'a quarter of', 'the majority of'",
          "Always support comparisons with figures from the visual",
        ],
      },
    ],
    practice: {
      title: "Practice exercise",
      prompt:
        "A line graph shows that car sales in a city rose from 10,000 in 2010 to 25,000 in 2020, while motorbike sales fell from 15,000 to 8,000 over the same period.\n\nWrite ONE clear overview sentence (no specific numbers) summarising the main trends.",
      placeholder:
        "Overall, car sales rose considerably over the decade, whereas motorbike sales showed the opposite trend...",
    },
  },
  {
    slug: "cohesion-linking-words",
    number: 3,
    title: "Cohesion & linking words",
    minutes: 10,
    desc: "However, furthermore, in contrast — avoid overusing firstly/secondly.",
    sections: [
      {
        title: "What Coherence & Cohesion means",
        paragraphs: [
          "Coherence is whether your ideas are logically ordered and easy to follow. Cohesion is how you connect sentences and paragraphs using linking words (cohesive devices), pronouns, and referencing. It is one of the four Writing criteria — a quarter of your score.",
          "The Band 7 descriptor says you use a range of cohesive devices 'appropriately' — the key word is appropriately, not 'a lot'. Overusing linkers actually lowers your score.",
        ],
      },
      {
        title: "Linking words by function",
        table: {
          headers: ["Function", "Examples"],
          rows: [
            ["Adding", "Furthermore, Moreover, In addition, Additionally"],
            ["Contrasting", "However, In contrast, On the other hand, Nevertheless"],
            ["Cause / effect", "Therefore, As a result, Consequently, Thus"],
            ["Giving examples", "For instance, For example, Such as, To illustrate"],
            ["Concluding", "In conclusion, To sum up, Overall"],
          ],
        },
      },
      {
        title: "Avoid overusing firstly / secondly",
        paragraphs: [
          "Starting every paragraph with 'Firstly', 'Secondly', 'Thirdly' is a Band 5–6 habit. It is mechanical and the examiner sees it constantly. Instead, connect ideas by meaning, not by counting.",
        ],
        bullets: [
          "Weak: 'Firstly, pollution is bad. Secondly, traffic is bad.'",
          "Better: 'One major concern is air pollution... A further problem is traffic congestion, which...'",
          "Use 'firstly' at most once per essay, if at all",
        ],
      },
      {
        title: "Cohesion beyond linking words",
        bullets: [
          "Pronoun referencing — use 'this', 'these', 'it', 'they' to refer back (avoids repetition)",
          "Substitution — 'This problem', 'Such measures', 'The former / the latter'",
          "Punctuation — most linkers at the start of a sentence take a comma: 'However, ...'",
          "Do not start a sentence with 'And', 'But', or 'Because' in formal writing",
        ],
      },
      {
        title: "Common linking-word errors",
        bullets: [
          "Wrong punctuation: 'However' joining two clauses with only a comma (comma splice)",
          "Overuse: three linkers in one sentence",
          "Wrong meaning: using 'moreover' where you mean 'however'",
          "Informal connectors: 'plus', 'anyway', 'so' at sentence start",
        ],
      },
    ],
    practice: {
      title: "Practice exercise",
      prompt:
        "Join these two ideas into ONE well-linked sentence (or two connected sentences) using an appropriate cohesive device — without using 'firstly' or 'secondly':\n\nIdea A: Working from home saves commuting time.\nIdea B: It can make people feel isolated.",
      placeholder:
        "Although working from home saves commuting time, it can... / Working from home saves commuting time; however, ...",
    },
  },
  {
    slug: "saudi-common-errors",
    number: 4,
    title: "Saudi common errors",
    minutes: 10,
    desc: "Articles (a/the), subject-verb agreement, and word order fixes.",
    sections: [
      {
        title: "Why these errors matter",
        paragraphs: [
          "Grammatical Range and Accuracy (GRA) is a quarter of your Writing score. For Arabic-speaking learners, a few recurring error types cost the most marks — especially articles, subject–verb agreement, and word order. Fixing these three areas often lifts GRA by a full band.",
        ],
      },
      {
        title: "1. Articles (a / an / the)",
        paragraphs: [
          "Arabic has no equivalent of 'a/an', so articles are often dropped or added incorrectly. Use 'a/an' for a singular countable noun mentioned for the first time, 'the' for something specific or already known, and no article for general plural or uncountable nouns.",
        ],
        bullets: [
          "Wrong: 'Pollution is problem in cities.' → Right: 'Pollution is a problem in cities.'",
          "Wrong: 'The people need education.' (in general) → Right: 'People need education.'",
          "Right: 'The government should act.' (specific, known)",
          "General uncountable: 'Water is essential' (no 'the')",
        ],
      },
      {
        title: "2. Subject–verb agreement",
        bullets: [
          "Wrong: 'The number of students are rising.' → Right: 'The number of students is rising.'",
          "Wrong: 'People is affected.' → Right: 'People are affected.'",
          "Wrong: 'Everyone have a phone.' → Right: 'Everyone has a phone.' (everyone = singular)",
          "Uncountables are singular: 'Information is...', 'Advice is...' (not 'are')",
        ],
      },
      {
        title: "3. Word order",
        paragraphs: [
          "English follows Subject–Verb–Object order, and adjectives come before the noun. Arabic word order differs, which causes predictable slips.",
        ],
        bullets: [
          "Adjective before noun: 'a big problem' (not 'a problem big')",
          "Adverbs of frequency before the main verb: 'People often use...' (not 'use often')",
          "Questions/indirect: 'I do not know why he left' (not 'why did he leave')",
        ],
      },
      {
        title: "4. Other high-frequency slips",
        table: {
          headers: ["Error", "Correction"],
          rows: [
            ["'informations', 'advices'", "'information', 'advice' (uncountable, no plural)"],
            ["'depend of'", "'depend on'"],
            ["'in the other hand'", "'on the other hand'"],
            ["'nowadays' overused", "vary: 'today', 'currently', 'in modern society'"],
            ["'more better'", "'better' (never double comparatives)"],
          ],
        },
      },
      {
        title: "Proofreading checklist (last 2 minutes)",
        bullets: [
          "Does every singular countable noun have an article?",
          "Does each verb agree with its subject?",
          "Are adjectives before their nouns?",
          "Any plural on an uncountable noun (informations, advices)?",
        ],
      },
    ],
    practice: {
      title: "Practice exercise",
      prompt:
        "Correct the errors in this paragraph and rewrite it accurately:\n\n\"Nowadays, the technology have changed our life. People is using internet for everything, and this cause many informations to spread quickly. It is problem big for society.\"",
      placeholder:
        "Technology has changed our lives. People use the internet for everything, and this causes...",
    },
  },
];

export const ACADEMIC_WRITING_LESSON_COUNT = ACADEMIC_WRITING_LESSONS.length;

export function getAcademicWritingLesson(
  slug: string
): AcademicWritingLesson | undefined {
  return ACADEMIC_WRITING_LESSONS.find((l) => l.slug === slug);
}

export const ACADEMIC_LESSONS_STORAGE_KEY =
  "ielts-academic-writing-lessons-completed";

export function readCompletedAcademicLessons(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACADEMIC_LESSONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((s) => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

export function markAcademicLessonComplete(slug: string): void {
  if (typeof window === "undefined") return;
  const current = new Set(readCompletedAcademicLessons());
  current.add(slug);
  localStorage.setItem(
    ACADEMIC_LESSONS_STORAGE_KEY,
    JSON.stringify([...current])
  );
}
