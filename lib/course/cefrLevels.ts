export type CefrSubLevel = {
  slug: string;
  code: string;
  name: string;
  description: string;
  cefr: string;
  weekCount: number;
  sortOrder: number;
};

export const CEFR_SUB_LEVELS: CefrSubLevel[] = [
  { slug: "a1-1", code: "A1.1", name: "Beginner Start", description: "First steps: greetings, basic vocabulary, present simple.", cefr: "A1", weekCount: 4, sortOrder: 1 },
  { slug: "a1-2", code: "A1.2", name: "Beginner Plus", description: "Daily routines, questions, and simple conversations.", cefr: "A1", weekCount: 4, sortOrder: 2 },
  { slug: "a2-1", code: "A2.1", name: "Elementary Core", description: "Past tenses, shopping, travel basics.", cefr: "A2", weekCount: 4, sortOrder: 3 },
  { slug: "a2-2", code: "A2.2", name: "Elementary Plus", description: "Future forms, opinions, and short paragraphs.", cefr: "A2", weekCount: 4, sortOrder: 4 },
  { slug: "b1-1", code: "B1.1", name: "Intermediate Core", description: "Academic vocabulary, complex sentences, IELTS foundations.", cefr: "B1", weekCount: 4, sortOrder: 5 },
  { slug: "b1-2", code: "B1.2", name: "Intermediate Plus", description: "Essay structure, listening strategies, fluency drills.", cefr: "B1", weekCount: 4, sortOrder: 6 },
  { slug: "b2-1", code: "B2.1", name: "Upper-Intermediate Core", description: "Coherence, argument essays, advanced reading.", cefr: "B2", weekCount: 4, sortOrder: 7 },
  { slug: "b2-2", code: "B2.2", name: "Upper-Intermediate Plus", description: "Timed tasks, collocation, mock sections.", cefr: "B2", weekCount: 4, sortOrder: 8 },
  { slug: "c1-1", code: "C1.1", name: "Advanced Core", description: "Nuanced grammar, academic writing, band 7+ skills.", cefr: "C1", weekCount: 4, sortOrder: 9 },
  { slug: "c1-2", code: "C1.2", name: "Advanced Mastery", description: "Exam polish, high-stakes strategy, graduation ready.", cefr: "C1", weekCount: 4, sortOrder: 10 },
];

/** Normalize URL/db id to hyphen slug (b2_1 → b2-1) */
export function normalizeCefrSlug(slugOrId: string) {
  return slugOrId.trim().toLowerCase().replace(/_/g, "-");
}

/** First sub-level for a parent band (b2 → b2-1) */
export function defaultSubLevelForBand(band: string) {
  const b = band.trim().toUpperCase();
  return CEFR_SUB_LEVELS.find((l) => l.cefr === b && l.slug.endsWith("-1"));
}

export function getCefrLevel(slugOrId: string) {
  if (!slugOrId?.trim()) return undefined;
  const normalized = normalizeCefrSlug(slugOrId);
  const direct = CEFR_SUB_LEVELS.find((l) => l.slug === normalized);
  if (direct) return direct;
  const parent = normalized.match(/^([abc][12])$/i);
  if (parent) return defaultSubLevelForBand(parent[1]);
  return undefined;
}

export function getNextLevelSlug(slug: string): string | null {
  const idx = CEFR_SUB_LEVELS.findIndex((l) => l.slug === slug);
  if (idx < 0 || idx >= CEFR_SUB_LEVELS.length - 1) return null;
  return CEFR_SUB_LEVELS[idx + 1].slug;
}

export function bandToCefrSubLevelSlug(band: number): string {
  if (band < 4.0) return "a1-1";
  if (band < 4.5) return "a1-2";
  if (band < 5.0) return "a2-1";
  if (band < 5.5) return "a2-2";
  if (band < 6.0) return "b1-1";
  if (band < 6.5) return "b1-2";
  if (band < 7.0) return "b2-1";
  if (band < 7.5) return "b2-2";
  if (band < 8.0) return "c1-1";
  return "c1-2";
}
