import {
  TASK1_CATEGORIES,
  TASK1_PROMPT_BANK,
  TASK2_CATEGORIES,
  TASK2_PROMPT_BANK,
} from "./writingPromptBank";
import type { Task1Question, Task1VisualType, Task2EssayType, Task2Question } from "./writingTaskData";

const ATTEMPTED_STORAGE_KEY = "ielts-writing-attempted-prompts";

export function getLocalAttemptedPromptIds(): string[] {
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

export function markPromptAttemptedLocally(promptId: string): void {
  if (typeof window === "undefined") return;
  const existing = new Set(getLocalAttemptedPromptIds());
  existing.add(promptId);
  localStorage.setItem(ATTEMPTED_STORAGE_KEY, JSON.stringify([...existing]));
}

export function mergeAttemptedIds(serverIds: string[], localIds: string[]): string[] {
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
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index] ?? null;
}

export function pickRecommendedTask1(
  attemptedIds: string[]
): { prompt: Task1Question; category: Task1VisualType; reason: string } | null {
  const attempted = new Set(attemptedIds);
  const categoryCounts = countByCategory(
    TASK1_PROMPT_BANK,
    attempted,
    (p) => p.visualType
  );

  const sortedCategories = [...TASK1_CATEGORIES].sort((a, b) => {
    const countA = categoryCounts.get(a.id) ?? 0;
    const countB = categoryCounts.get(b.id) ?? 0;
    return countA - countB;
  });

  for (const category of sortedCategories) {
    const pool = TASK1_PROMPT_BANK.filter((p) => p.visualType === category.id);
    const pick = pickFromPool(pool, attempted);
    if (pick) {
      const count = categoryCounts.get(category.id) ?? 0;
      const reason =
        count === 0
          ? `You haven't practised ${category.label.toLowerCase()}s yet`
          : `More ${category.label.toLowerCase()} practice will strengthen your Task 1 skills`;
      return { prompt: pick, category: category.id, reason };
    }
  }

  return null;
}

export function pickRecommendedTask2(
  attemptedIds: string[]
): { prompt: Task2Question; category: Task2EssayType; reason: string } | null {
  const attempted = new Set(attemptedIds);
  const categoryCounts = countByCategory(
    TASK2_PROMPT_BANK,
    attempted,
    (p) => p.essayType
  );

  const sortedCategories = [...TASK2_CATEGORIES].sort((a, b) => {
    const countA = categoryCounts.get(a.id) ?? 0;
    const countB = categoryCounts.get(b.id) ?? 0;
    return countA - countB;
  });

  for (const category of sortedCategories) {
    const pool = TASK2_PROMPT_BANK.filter((p) => p.essayType === category.id);
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
