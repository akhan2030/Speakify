import { markPromptAttemptedLocally } from "./writingPromptRecommendation";

export async function fetchAttemptedPromptIds(taskType: "task1" | "task2"): Promise<string[]> {
  try {
    const res = await fetch(`/api/student/writing-prompts/attempted?taskType=${taskType}`);
    if (!res.ok) return [];
    const data = await res.json().catch(() => null);
    return Array.isArray(data?.promptIds) ? data.promptIds : [];
  } catch {
    return [];
  }
}

export function recordPromptAttempt(promptId: string): void {
  markPromptAttemptedLocally(promptId);
}
