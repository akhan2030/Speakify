import { GT_GRAMMAR_CATEGORY_LABELS } from "@/lib/ielts-general/grammarContent";

export const GRAMMAR_CATEGORY_SLUGS = [
  "tenses",
  "conditionals",
  "passive-voice",
  "articles",
  "relative-clauses",
  "academic-structures",
] as const;

export type GrammarCategorySlug = (typeof GRAMMAR_CATEGORY_SLUGS)[number];

export type GrammarExerciseType = "fill" | "correct" | "rewrite";

export type GrammarExercise = {
  id: string;
  type: GrammarExerciseType;
  prompt: string;
  modelAnswer: string;
  hint?: string;
};

export type GrammarCategoryMeta = {
  slug: GrammarCategorySlug;
  name: string;
  subtitle: string;
  difficulty: "Beginner" | "Intermediate" | "Upper-Intermediate" | "Advanced";
  lessonCount: number;
  ieltsTip: string;
};

export const GRAMMAR_CATEGORIES: GrammarCategoryMeta[] = [
  {
    slug: "tenses",
    name: "Tenses",
    subtitle: "Present / Past / Future / Perfect",
    difficulty: "Intermediate",
    lessonCount: 8,
    ieltsTip: "Accurate tense control is essential for GRA in Writing and fluency in Speaking.",
  },
  {
    slug: "conditionals",
    name: "Conditionals",
    subtitle: "Zero / First / Second / Third",
    difficulty: "Upper-Intermediate",
    lessonCount: 6,
    ieltsTip: "Conditionals help you discuss trends, predictions, and hypothetical solutions in Task 2.",
  },
  {
    slug: "passive-voice",
    name: "Passive Voice",
    subtitle: "Form & academic use",
    difficulty: "Intermediate",
    lessonCount: 5,
    ieltsTip: "Passive structures are common in academic Writing Task 1 reports.",
  },
  {
    slug: "articles",
    name: "Articles & Determiners",
    subtitle: "a / an / the / zero article",
    difficulty: "Beginner",
    lessonCount: 6,
    ieltsTip: "Article errors are frequent for Arabic speakers and affect LR accuracy.",
  },
  {
    slug: "relative-clauses",
    name: "Relative Clauses",
    subtitle: "Defining & non-defining",
    difficulty: "Upper-Intermediate",
    lessonCount: 5,
    ieltsTip: "Relative clauses add detail without new sentences — key for band 7+ complexity.",
  },
  {
    slug: "academic-structures",
    name: "Academic Sentence Structures",
    subtitle: "Formal patterns for Task 2",
    difficulty: "Advanced",
    lessonCount: 7,
    ieltsTip: "Nominalisation and hedging show sophistication in argument essays.",
  },
];

export function isGrammarCategorySlug(
  value: string
): value is GrammarCategorySlug {
  return (GRAMMAR_CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function getCategoryMeta(slug: string): GrammarCategoryMeta | null {
  return GRAMMAR_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function getCategoryMetaForProgram(
  slug: string,
  programme: "academic" | "general" = "academic"
): GrammarCategoryMeta | null {
  const base = getCategoryMeta(slug);
  if (!base || programme === "academic") return base;
  const overrides = GT_GRAMMAR_CATEGORY_LABELS[slug as GrammarCategorySlug];
  if (!overrides) return base;
  return { ...base, ...overrides };
}

export function getGrammarCategories(
  programme: "academic" | "general" = "academic"
): GrammarCategoryMeta[] {
  if (programme === "academic") return GRAMMAR_CATEGORIES;
  return GRAMMAR_CATEGORIES.map((cat) => {
    const overrides = GT_GRAMMAR_CATEGORY_LABELS[cat.slug];
    if (!overrides) return cat;
    return { ...cat, ...overrides };
  });
}

export function percentComplete(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

/** Lesson page path for a grammar category card. */
export function grammarLessonHref(
  slug: GrammarCategorySlug,
  base = "/dashboard/student"
) {
  return `${base}/grammar/lessons/${slug}` as const;
}
