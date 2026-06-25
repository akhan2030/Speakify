export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const blockClipboard = {
  onPaste: (e: React.ClipboardEvent) => e.preventDefault(),
  onCopy: (e: React.ClipboardEvent) => e.preventDefault(),
  onCut: (e: React.ClipboardEvent) => e.preventDefault(),
};

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  ms = 5000
): Promise<Response> {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(id);
  }
}

export function answersMatch(student: string, correct: string): boolean {
  // Dynamic import path must match lib/checkListeningAnswer.js (not under mock-test/)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { checkListeningAnswer } = require("@/lib/checkListeningAnswer.js") as {
    checkListeningAnswer: (a: string, b: string) => boolean;
  };
  if (checkListeningAnswer(student, correct)) return true;

  const a = normalizeAnswer(student);
  const b = normalizeAnswer(correct);
  if (!a) return false;
  if (a === b) return true;
  return a.replace(/[.,]/g, "") === b.replace(/[.,]/g, "");
}
