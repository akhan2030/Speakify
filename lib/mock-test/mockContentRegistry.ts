/**
 * Tracks content reserved for full mock exams so practice pools can exclude it.
 * Mock-only listening (Seaside Hotel) and static academic reading are never served in practice.
 */
export const MOCK_ONLY_LISTENING_IDS = new Set(
  Array.from({ length: 40 }, (_, i) => `l-q${i + 1}`)
);

export const MOCK_ONLY_READING_TEST_ID = "full-mock-academic-static";

/** Passage titles from generated_mock_tests — practice must not reuse these. */
export const MOCK_RESERVED_READING_TITLES = [
  "The Impact of Artificial Intelligence on Modern Science",
  "The Fragile Balance of Ecosystems",
  "Uncovering the Past: The Role of Archaeology in History",
  "Exploring the Interplay Between Psychology and Behaviour",
  "The Evolution of Education and Learning",
  "Exploring the Universe: The Role of Astronomy",
  "The Influence of Arts and Culture on Society",
] as const;

export function isMockReservedReadingTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase();
  return MOCK_RESERVED_READING_TITLES.some(
    (t) => t.toLowerCase() === normalized
  );
}

export function isMockOnlyListeningQuestionId(id: string): boolean {
  return MOCK_ONLY_LISTENING_IDS.has(id);
}
