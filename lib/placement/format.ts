import type { Section } from "./types";

export function sectionLabel(section: Section | string): string {
  const map: Record<string, string> = {
    vocabulary: "Vocabulary",
    grammar: "Grammar",
    reading: "Reading",
    writing_prompt: "Writing",
    listening: "Listening",
    speaking: "Speaking",
  };
  return map[section] ?? section;
}

export function extractListeningTranscript(explanation: string): string {
  const match = explanation.match(/Transcript:\s*([\s\S]+)/i);
  return match ? match[1].trim() : explanation;
}

export function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Show the full sentence with the blank filled (for feedback). */
export function formatFillBlankAnswer(question: string, answer: string): string {
  const filled = String(question ?? "").replace(
    /___+\s*(\([^)]+\))?\s*/,
    `${answer} `
  );
  return filled.replace(/\s+/g, " ").trim();
}
