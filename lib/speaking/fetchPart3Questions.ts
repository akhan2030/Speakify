import type { Part2CueCardInput, SpeakingTestType } from "@/lib/speaking/part3Generation";

export async function fetchPart3Questions(payload: {
  cueCard: Part2CueCardInput;
  part2Transcript?: string;
  sessionId?: string;
  testType?: SpeakingTestType;
}): Promise<string[]> {
  const res = await fetch("/api/speaking/part3-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to generate Part 3 questions"
    );
  }

  return Array.isArray(data.questions) ? data.questions.map(String) : [];
}
