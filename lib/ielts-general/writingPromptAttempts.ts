import { markGtPromptAttemptedLocally } from "./writingPromptRecommendation";

export async function fetchGtAttemptedPromptIds(
  taskType: "task1" | "task2"
): Promise<string[]> {
  try {
    const res = await fetch(
      `/api/ielts-general/writing-prompts/attempted?taskType=${taskType}`
    );
    if (!res.ok) return [];
    const data = await res.json().catch(() => null);
    return Array.isArray(data?.promptIds) ? data.promptIds : [];
  } catch {
    return [];
  }
}

export function recordGtPromptAttempt(promptId: string): void {
  markGtPromptAttemptedLocally(promptId);
}
