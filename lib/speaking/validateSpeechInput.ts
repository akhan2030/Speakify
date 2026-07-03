export const MIN_STUDENT_CHARS = 50;
export const MIN_STUDENT_WORDS = 30;
export const MIN_SPEAKING_SECONDS = 30;

const PLACEHOLDER_RESPONSES = new Set([
  "i have finished speaking about the topic on the cue card.",
]);

type TranscriptEntry = {
  role?: string;
  text?: string;
  part?: number;
};

export function extractStudentSpeech(transcript: unknown) {
  const entries: TranscriptEntry[] = Array.isArray(transcript) ? transcript : [];
  const studentEntries = entries.filter(
    (t) => t?.role === "student" && typeof t.text === "string" && t.text.trim().length > 0
  );

  const realEntries = studentEntries.filter(
    (t) => !PLACEHOLDER_RESPONSES.has(String(t.text).trim().toLowerCase())
  );

  const text = realEntries.map((t) => String(t.text).trim()).join(" ").trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const part1Responses = realEntries.filter((t) => t.part === 1).length;

  return {
    text,
    charCount: text.length,
    wordCount: words.length,
    part1Responses,
    responseCount: realEntries.length,
  };
}

export function hasValidSpeechInput(input: {
  transcript: unknown;
  speakingTimeSeconds: number;
}): { valid: boolean; reason?: string } {
  const { text, charCount, wordCount, part1Responses } = extractStudentSpeech(
    input.transcript
  );

  if (!text || charCount === 0) {
    return {
      valid: false,
      reason: "No speech detected. Please complete the speaking session before requesting a score.",
    };
  }

  if (part1Responses === 0) {
    return {
      valid: false,
      reason: "Please answer at least one Part 1 question before requesting a score.",
    };
  }

  if (charCount < MIN_STUDENT_CHARS) {
    return {
      valid: false,
      reason: `Not enough speech detected. Please speak for longer (minimum ${MIN_STUDENT_CHARS} characters).`,
    };
  }

  if (wordCount < MIN_STUDENT_WORDS) {
    return {
      valid: false,
      reason: `Not enough speech detected. Minimum ${MIN_STUDENT_WORDS} words required for scoring.`,
    };
  }

  if (!input.speakingTimeSeconds || input.speakingTimeSeconds < MIN_SPEAKING_SECONDS) {
    return {
      valid: false,
      reason: `Please record at least ${MIN_SPEAKING_SECONDS} seconds of speaking before submitting.`,
    };
  }

  return { valid: true };
}

export function studentTranscriptFromHistory(
  history: { role: string; text: string }[]
): string {
  const entries = history
    .filter((e) => e.role === "student")
    .map((e) => e.text.trim())
    .filter((t) => t && !PLACEHOLDER_RESPONSES.has(t.toLowerCase()));
  return entries.join(" ").trim();
}
