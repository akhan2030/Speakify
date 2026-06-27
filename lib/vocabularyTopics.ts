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
