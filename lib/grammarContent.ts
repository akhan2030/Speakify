import type { GrammarCategorySlug, GrammarExercise } from "@/lib/grammar";
import { GRAMMAR_LESSONS_GT } from "@/lib/ielts-general/grammarContent";

export type GrammarLessonContent = {
  rules: string[];
  ieltsWritingExamples: string[];
  ieltsSpeakingExamples: string[];
  saudiMistakes: string[];
  exercises: GrammarExercise[];
};

export const GRAMMAR_LESSONS: Record<GrammarCategorySlug, GrammarLessonContent> = {
  tenses: {
    rules: [
      "Present Simple: facts, habits, and graph descriptions (The chart shows…).",
      "Present Continuous: temporary situations — not for stative verbs (know, believe).",
      "Past Simple: finished past events with clear time markers (in 2019, last year).",
      "Present Perfect: past actions connected to now (has increased, have changed).",
      "Future: will / going to / present continuous for arrangements — choose by certainty.",
    ],
    ieltsWritingExamples: [
      "The proportion of students studying abroad has risen steadily since 2010.",
      "By 2030, renewable energy will account for the majority of production.",
    ],
    ieltsSpeakingExamples: [
      "I've been learning IELTS for about six months now.",
      "When I was at university, I lived in Riyadh.",
    ],
    saudiMistakes: [
      "Using present simple for completed past actions (*Yesterday I go* → Yesterday I went).",
      "Overusing present continuous with stative verbs (*I am believing*).",
      "Mixing present perfect with past time expressions (*I have visited Jeddah last year*).",
    ],
    exercises: [
      {
        id: "t1",
        type: "fill",
        prompt: "The number of tourists ______ (increase) every year since 2015.",
        modelAnswer: "has increased",
        hint: "Present perfect + since",
      },
      {
        id: "t2",
        type: "correct",
        prompt: "Find the error: Last decade, technology is changing education dramatically.",
        modelAnswer: "Last decade, technology changed education dramatically.",
      },
      {
        id: "t3",
        type: "rewrite",
        prompt: "Rewrite formally: People will probably use more electric cars in the future.",
        modelAnswer: "Electric cars are likely to become more widely used in the future.",
      },
      {
        id: "t4",
        type: "fill",
        prompt: "While I ______ (study) for IELTS, my brother works in Dammam.",
        modelAnswer: "am studying",
      },
    ],
  },
  conditionals: {
    rules: [
      "Zero: If + present, present — general truths (If water boils, it evaporates).",
      "First: If + present, will — real future possibilities.",
      "Second: If + past, would — unlikely present/future hypotheticals.",
      "Third: If + past perfect, would have — regrets about the past.",
    ],
    ieltsWritingExamples: [
      "If governments invested more in public transport, air pollution would decrease.",
      "If the trend had continued, sales would have exceeded expectations.",
    ],
    ieltsSpeakingExamples: [
      "If I had more time, I would practise speaking every day.",
      "If the weather is good, we'll visit the corniche.",
    ],
    saudiMistakes: [
      "Using would in both clauses (*If I would study harder…*).",
      "Using would have for present unreal situations instead of would.",
      "Comma splices instead of proper if-clauses.",
    ],
    exercises: [
      {
        id: "c1",
        type: "fill",
        prompt: "If students ______ (have) better facilities, their results would improve.",
        modelAnswer: "had",
      },
      {
        id: "c2",
        type: "correct",
        prompt: "Find the error: If I would get band 7, I will apply for the scholarship.",
        modelAnswer: "If I got band 7, I would apply for the scholarship.",
      },
      {
        id: "c3",
        type: "rewrite",
        prompt: "Rewrite with a third conditional: I didn't prepare enough, so I failed the mock test.",
        modelAnswer: "If I had prepared enough, I would have passed the mock test.",
      },
      {
        id: "c4",
        type: "fill",
        prompt: "If oil prices rise, consumers ______ (pay) more for transport.",
        modelAnswer: "will pay",
      },
    ],
  },
  "passive-voice": {
    rules: [
      "Form: be + past participle (is produced, were analysed).",
      "Use when the action is more important than who did it (common in Task 1).",
      "Agent with by is optional when the doer is obvious or unknown.",
      "Avoid overusing passive — balance with active verbs in Task 2.",
    ],
    ieltsWritingExamples: [
      "Approximately 40% of energy was generated from renewable sources.",
      "It is argued that technology has transformed modern education.",
    ],
    ieltsSpeakingExamples: [
      "My hometown is known for its historical sites.",
      "I was born in Saudi Arabia and raised in the Eastern Province.",
    ],
    saudiMistakes: [
      "Missing be verb (*The chart shown* → The chart is shown).",
      "Wrong past participle (*was build* → was built).",
      "Active voice where passive is expected in formal reports.",
    ],
    exercises: [
      {
        id: "p1",
        type: "fill",
        prompt: "Millions of barrels of oil ______ (export) annually from the region.",
        modelAnswer: "are exported",
      },
      {
        id: "p2",
        type: "correct",
        prompt: "Find the error: The results were show in the table below.",
        modelAnswer: "The results were shown in the table below.",
      },
      {
        id: "p3",
        type: "rewrite",
        prompt: "Rewrite in passive: The government launched a new health campaign.",
        modelAnswer: "A new health campaign was launched by the government.",
      },
      {
        id: "p4",
        type: "fill",
        prompt: "It ______ (believe) that education improves economic growth.",
        modelAnswer: "is believed",
      },
    ],
  },
  articles: {
    rules: [
      "a/an: first mention, singular countable, jobs (a doctor).",
      "the: specific, unique, second mention, superlatives.",
      "Zero article: plural generalisations, uncountable general concepts, countries (usually).",
      "No article with most academic subjects (study engineering).",
    ],
    ieltsWritingExamples: [
      "The graph illustrates the proportion of the population living in cities.",
      "Education plays a vital role in economic development.",
    ],
    ieltsSpeakingExamples: [
      "I want to be an engineer in the energy sector.",
      "The weather in summer is extremely hot.",
    ],
    saudiMistakes: [
      "Adding the before general plural nouns (*The students should study*).",
      "Omitting the before superlatives (*most important factor* → the most important factor).",
      "a/an confusion before vowel sounds (an hour, a university).",
    ],
    exercises: [
      {
        id: "a1",
        type: "fill",
        prompt: "______ internet has changed how ______ students access information.",
        modelAnswer: "The; /",
        hint: "Second blank = zero article",
      },
      {
        id: "a2",
        type: "correct",
        prompt: "Find the error: She is best student in the class.",
        modelAnswer: "She is the best student in the class.",
      },
      {
        id: "a3",
        type: "rewrite",
        prompt: "Rewrite correctly: I studied engineering at university in Riyadh.",
        modelAnswer: "I studied engineering at a university in Riyadh.",
      },
      {
        id: "a4",
        type: "fill",
        prompt: "He wants to become ______ doctor after completing ______ MBBS.",
        modelAnswer: "a; an",
      },
    ],
  },
  "relative-clauses": {
    rules: [
      "Defining clauses: essential information, no commas (who/which/that).",
      "Non-defining: extra information, commas, cannot use that.",
      "Reduced relatives: The data (which was) collected shows…",
      "Preposition placement: the issue which we discussed / which we discussed the issue.",
    ],
    ieltsWritingExamples: [
      "Students who study abroad often gain international experience.",
      "The UAE, which has diversified its economy, attracts investment.",
    ],
    ieltsSpeakingExamples: [
      "My brother, who lives in Jeddah, works in finance.",
      "The book that I read last week was about leadership.",
    ],
    saudiMistakes: [
      "Using that in non-defining clauses with commas.",
      "Double subjects (*My friend he is kind*).",
      "Omitting relative pronoun objects incorrectly.",
    ],
    exercises: [
      {
        id: "r1",
        type: "fill",
        prompt: "The policy ______ was introduced last year reduced traffic congestion.",
        modelAnswer: "which",
      },
      {
        id: "r2",
        type: "correct",
        prompt: "Find the error: Riyadh, that is the capital, is growing rapidly.",
        modelAnswer: "Riyadh, which is the capital, is growing rapidly.",
      },
      {
        id: "r3",
        type: "rewrite",
        prompt: "Combine: Many graduates seek jobs. The jobs require English skills.",
        modelAnswer: "Many graduates seek jobs that require English skills.",
      },
      {
        id: "r4",
        type: "fill",
        prompt: "Students ______ study daily tend to achieve higher band scores.",
        modelAnswer: "who",
      },
    ],
  },
  "academic-structures": {
    rules: [
      "Nominalisation: develop → development, improve → improvement.",
      "Hedging: appears to, tends to, it is possible that.",
      "Impersonal openings: It is widely acknowledged that…",
      "Parallel structures in lists and comparisons.",
    ],
    ieltsWritingExamples: [
      "There has been a significant improvement in healthcare provision.",
      "It appears that urbanisation contributes to environmental degradation.",
    ],
    ieltsSpeakingExamples: [
      "I'd say that technology has somewhat changed family life.",
      "It seems to me that practice is the key factor.",
    ],
    saudiMistakes: [
      "Overly informal phrases in essays (a lot of, kids, get).",
      "Repeating the same simple noun-verb patterns.",
      "Missing hedging — sounding too absolute (will definitely).",
    ],
    exercises: [
      {
        id: "s1",
        type: "fill",
        prompt: "There has been a rapid ______ (expand) of online learning platforms.",
        modelAnswer: "expansion",
      },
      {
        id: "s2",
        type: "correct",
        prompt: "Find the error: Technology will definitely solve all education problems.",
        modelAnswer: "Technology may help address several education problems.",
      },
      {
        id: "s3",
        type: "rewrite",
        prompt: "Rewrite with hedging: Social media causes mental health problems.",
        modelAnswer: "Social media may contribute to mental health problems.",
      },
      {
        id: "s4",
        type: "rewrite",
        prompt: "Nominalise: When cities grow quickly, pollution increases.",
        modelAnswer: "Rapid urban growth leads to an increase in pollution.",
      },
    ],
  },
};

export type GrammarPracticeQuestion = GrammarExercise & {
  category: GrammarCategorySlug;
  categoryName: string;
};

export const GRAMMAR_PRACTICE_POOL: GrammarPracticeQuestion[] = buildPracticePool(
  GRAMMAR_LESSONS
);

export const GRAMMAR_PRACTICE_POOL_GT: GrammarPracticeQuestion[] = buildPracticePool(
  GRAMMAR_LESSONS_GT,
  "general"
);

function buildPracticePool(
  lessons: Record<GrammarCategorySlug, GrammarLessonContent>,
  programme: "academic" | "general" = "academic"
): GrammarPracticeQuestion[] {
  return Object.entries(lessons).flatMap(([slug, lesson]) => {
    const meta = slug as GrammarCategorySlug;
    const name = practiceCategoryName(meta, programme);
    return lesson.exercises.map((ex) => ({
      ...ex,
      category: meta,
      categoryName: name,
    }));
  });
}

function practiceCategoryName(
  slug: GrammarCategorySlug,
  programme: "academic" | "general"
): string {
  if (programme === "general" && slug === "academic-structures") {
    return "Formal Letter Structures";
  }
  if (slug === "passive-voice") return "Passive Voice";
  if (slug === "relative-clauses") return "Relative Clauses";
  if (slug === "academic-structures") return "Academic Structures";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function getPracticePool(programme: "academic" | "general" = "academic") {
  return programme === "general" ? GRAMMAR_PRACTICE_POOL_GT : GRAMMAR_PRACTICE_POOL;
}

export function getLessonContent(
  slug: GrammarCategorySlug,
  programme: "academic" | "general" = "academic"
) {
  if (programme === "general") {
    return GRAMMAR_LESSONS_GT[slug];
  }
  return GRAMMAR_LESSONS[slug];
}

export function pickPracticeQuestions(
  count = 10,
  programme: "academic" | "general" = "academic",
  options?: { focusCategories?: string[] }
) {
  const pool = [...getPracticePool(programme)];
  const focusCategories = (options?.focusCategories ?? []).filter(Boolean);

  if (focusCategories.length > 0) {
    const focused = pool.filter((q) => focusCategories.includes(q.category));
    const remainder = pool.filter((q) => !focusCategories.includes(q.category));
    const focusedCount = Math.min(
      count,
      Math.max(Math.ceil(count * 0.7), Math.min(focused.length, count - 1))
    );
    const mixed = [
      ...focused.slice(0, focusedCount),
      ...remainder.slice(0, Math.max(0, count - focusedCount)),
    ];

    for (let i = mixed.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
    }

    return mixed.slice(0, count);
  }

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function normalizeAnswer(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function answersMatch(student: string, model: string) {
  const a = normalizeAnswer(student);
  const b = normalizeAnswer(model);
  if (a === b) return true;
  if (b.includes(";")) {
    return b.split(";").some((part) => normalizeAnswer(part) === a);
  }
  return false;
}
