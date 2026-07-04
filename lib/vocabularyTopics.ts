/** Program track used to prioritize Browse-by-Topic order. */
export type VocabProgramTrack =
  | "ielts_academic"
  | "ielts_general"
  | "pathway"
  | "default";

/** Preferred topic order per enrollment track (first = most relevant). */
export const TOPIC_PRIORITY_BY_TRACK: Record<VocabProgramTrack, string[]> = {
  ielts_academic: [
    "academic",
    "education",
    "science",
    "technology",
    "environment",
    "economy",
    "business",
    "government",
    "infrastructure",
    "urbanization",
    "health",
    "society",
    "communication",
    "culture",
    "travel",
    "work",
    "vision2030",
    "general",
  ],
  ielts_general: [
    "work",
    "travel",
    "health",
    "society",
    "communication",
    "culture",
    "education",
    "technology",
    "environment",
    "economy",
    "business",
    "general",
    "academic",
    "science",
    "government",
    "infrastructure",
    "urbanization",
    "vision2030",
  ],
  pathway: [
    "general",
    "education",
    "work",
    "travel",
    "health",
    "society",
    "communication",
    "culture",
    "technology",
    "environment",
    "economy",
    "business",
    "academic",
    "science",
    "government",
    "infrastructure",
    "urbanization",
    "vision2030",
  ],
  default: [
    "general",
    "education",
    "work",
    "technology",
    "health",
    "environment",
    "travel",
    "society",
    "academic",
    "business",
    "economy",
    "science",
    "communication",
    "culture",
    "government",
    "infrastructure",
    "urbanization",
    "vision2030",
  ],
};

export function sortTopicsForTrack<T extends { key: string; wordCount: number }>(
  topics: T[],
  track: VocabProgramTrack
): T[] {
  const priority = TOPIC_PRIORITY_BY_TRACK[track] ?? TOPIC_PRIORITY_BY_TRACK.default;
  const rank = (key: string) => {
    const i = priority.indexOf(normalizeVocabTopicKey(key));
    return i === -1 ? priority.length + 50 : i;
  };
  return [...topics].sort((a, b) => {
    const byRank = rank(a.key) - rank(b.key);
    if (byRank !== 0) return byRank;
    return b.wordCount - a.wordCount;
  });
}

/** First track-relevant topic that exists in the student's available list. */
export function defaultTopicForTrack(
  track: VocabProgramTrack,
  topics: { key: string }[]
): string | null {
  if (!topics.length) return null;
  const available = new Set(topics.map((t) => normalizeVocabTopicKey(t.key)));
  const priority = TOPIC_PRIORITY_BY_TRACK[track] ?? TOPIC_PRIORITY_BY_TRACK.default;
  for (const key of priority) {
    if (available.has(key)) return key;
  }
  return normalizeVocabTopicKey(topics[0].key);
}

/** Display labels for vocabulary_words.topic_category slugs */
export const VOCAB_TOPIC_LABELS: Record<string, string> = {
  economy: "Business & Economy",
  business: "Business & Economy",
  environment: "Environment",
  technology: "Technology",
  health: "Health & Society",
  society: "Health & Society",
  education: "Education",
  academic: "Academic",
  government: "Government & Law",
  infrastructure: "Infrastructure",
  science: "Science",
  travel: "Travel & Culture",
  culture: "Travel & Culture",
  work: "Work & Careers",
  communication: "Communication",
  urbanization: "Urban Life",
  Vision2030: "Vision 2030",
  vision2030: "Vision 2030",
  general: "General",
};

export function normalizeVocabTopicKey(raw: string | null | undefined): string {
  if (!raw?.trim()) return "general";
  return raw.trim().toLowerCase();
}

export function formatVocabTopicLabel(raw: string | null | undefined): string {
  const key = normalizeVocabTopicKey(raw);
  if (VOCAB_TOPIC_LABELS[key]) return VOCAB_TOPIC_LABELS[key];
  return key
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export type VocabTopicSummary = {
  key: string;
  label: string;
  wordCount: number;
};
