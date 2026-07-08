import {
  GT_LETTER_CATEGORIES,
  GT_LETTER_PROMPT_BANK,
  GT_TASK2_CATEGORIES,
  GT_TASK2_PROMPT_BANK,
} from "./writingPromptBank";
import type {
  GeneralEssayType,
  GeneralLetterQuestion,
  GeneralTask2Question,
  LetterType,
} from "./writingTaskData";

const ATTEMPTED_STORAGE_KEY = "ielts-gt-writing-attempted-prompts";

export function getLocalGtAttemptedPromptIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ATTEMPTED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function markGtPromptAttemptedLocally(promptId: string): void {
  if (typeof window === "undefined") return;
  const existing = new Set(getLocalGtAttemptedPromptIds());
  existing.add(promptId);
  localStorage.setItem(ATTEMPTED_STORAGE_KEY, JSON.stringify([...existing]));
}

export function mergeGtAttemptedIds(serverIds: string[], localIds: string[]): string[] {
  return [...new Set([...serverIds, ...localIds])];
}

function countByCategory<T extends { id: string }>(
  prompts: T[],
  attemptedIds: Set<string>,
  getCategory: (p: T) => string
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const prompt of prompts) {
    if (!attemptedIds.has(prompt.id)) continue;
    const cat = getCategory(prompt);
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return counts;
}

function pickFromPool<T extends { id: string }>(
  pool: T[],
  attemptedIds: Set<string>
): T | null {
  if (pool.length === 0) return null;
  const unattempted = pool.filter((p) => !attemptedIds.has(p.id));
  const candidates = unattempted.length > 0 ? unattempted : pool;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

export function pickRecommendedGtLetter(
  attemptedIds: string[]
): { prompt: GeneralLetterQuestion; category: LetterType; reason: string } | null {
  const attempted = new Set(attemptedIds);
  const categoryCounts = countByCategory(
    GT_LETTER_PROMPT_BANK,
    attempted,
    (p) => p.letterType
  );

  const sorted = [...GT_LETTER_CATEGORIES].sort((a, b) => {
    return (categoryCounts.get(a.id) ?? 0) - (categoryCounts.get(b.id) ?? 0);
  });

  for (const category of sorted) {
    const pool = GT_LETTER_PROMPT_BANK.filter((p) => p.letterType === category.id);
    const pick = pickFromPool(pool, attempted);
    if (pick) {
      const count = categoryCounts.get(category.id) ?? 0;
      const reason =
        count === 0
          ? `You haven't practised ${category.label.toLowerCase()}s yet`
          : `More ${category.label.toLowerCase()} practice will strengthen your Task 1 letters`;
      return { prompt: pick, category: category.id, reason };
    }
  }
  return null;
}

export function pickRecommendedGtTask2(
  attemptedIds: string[]
): { prompt: GeneralTask2Question; category: GeneralEssayType; reason: string } | null {
  const attempted = new Set(attemptedIds);
  const categoryCounts = countByCategory(
    GT_TASK2_PROMPT_BANK,
    attempted,
    (p) => p.essayType
  );

  const sorted = [...GT_TASK2_CATEGORIES].sort((a, b) => {
    return (categoryCounts.get(a.id) ?? 0) - (categoryCounts.get(b.id) ?? 0);
  });

  for (const category of sorted) {
    const pool = GT_TASK2_PROMPT_BANK.filter((p) => p.essayType === category.id);
    const pick = pickFromPool(pool, attempted);
    if (pick) {
      const count = categoryCounts.get(category.id) ?? 0;
      const reason =
        count === 0
          ? `You haven't tried ${category.label.toLowerCase()}s yet`
          : `More ${category.label.toLowerCase()} practice will build your Task 2 range`;
      return { prompt: pick, category: category.id, reason };
    }
  }
  return null;
}
