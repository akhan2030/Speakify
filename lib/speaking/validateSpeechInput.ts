export const MIN_STUDENT_CHARS = 50;
export const MIN_STUDENT_WORDS = 30;
export const MIN_SPEAKING_SECONDS = 30;
export const MIN_SUBSTANTIVE_ANSWERS = 2;
export const MIN_WORDS_PER_SUBSTANTIVE_ANSWER = 8;

const PLACEHOLDER_RESPONSES = new Set([
  "i have finished speaking about the topic on the cue card.",
]);

/**
 * Background media / YouTube outros often leak into the mic.
 * Note: "thank you for watching" must allow optional "you" / "so much" —
 * `thanks?\s+for\s+watching` alone does NOT match "Thank you for watching!".
 */
const BACKGROUND_MEDIA_PATTERNS = [
  /\bthanks?\s+(you\s+)?(so\s+much\s+)?for\s+watching\b/i,
  /\bthank\s+you\s+(so\s+much\s+)?for\s+watching\b/i,
  /\bplease\s+subscribe\b/i,
  /\blike\s+and\s+subscribe\b/i,
  /\bsubscribe\s*(and|&|,)?\s*(share|like)\b/i,
  /\bshare\s*(and|&|,)?\s*(like|subscribe)\b/i,
  /\bdon'?t\s+forget\s+to\s+(like|subscribe|share)\b/i,
  /\bthis\s+video\s+is\s+available\b/i,
  /\bhit\s+the\s+(like|bell|subscribe)\b/i,
  /\bcomment\s+below\b/i,
  /\bsee\s+you\s+in\s+the\s+next\s+(video|one)\b/i,
  /\bchannel\b.*\bsubscribe\b/i,
  /\b\d+k\b.*\b(hd|fpv|video)\b/i,
  /\b(1080p|1440p|4k|2160p|720p)\b/i,
];

/** Sarah's own lines often get re-captured when speakers are on. */
const EXAMINER_ECHO_PATTERNS = [
  /^thank you\.?$/i,
  /^thanks\.?$/i,
  /^thank you for that\.?$/i,
  /^right,?\s+please begin speaking now\.?$/i,
  /^you have one minute to prepare/i,
  /^now i'?d like to move on/i,
  /^good morning\.?\s*my name is sarah/i,
  /^that is the end of the speaking test/i,
  /^we'?ve been talking about/i,
  /^could you tell me your full name/i,
];

type TranscriptEntry = {
  role?: string;
  text?: string;
  part?: number;
};

function normalizeText(text: string) {
  return String(text || "")
    .trim()
    .replace(/\s+/g, " ");
}

function wordList(text: string) {
  return normalizeText(text)
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9']/g, ""))
    .filter(Boolean);
}

function isMostlyNumbersOrSymbols(text: string) {
  const words = wordList(text);
  if (words.length === 0) return true;
  const numeric = words.filter((w) => /^\d+$/.test(w)).length;
  return numeric / words.length >= 0.6;
}

function isTooRepetitive(text: string) {
  const words = wordList(text).map((w) => w.toLowerCase());
  if (words.length < 4) return false;
  const unique = new Set(words);
  return unique.size / words.length < 0.35;
}

/**
 * Reject a single transcribed utterance that is clearly not the student answering.
 * Used live after STT so garbage never enters the conversation.
 */
export function isLikelyRealStudentSpeech(text: string): {
  ok: boolean;
  reason?: string;
} {
  const cleaned = normalizeText(text);
  if (!cleaned) {
    return { ok: false, reason: "Couldn't hear anything. Speak clearly into your microphone and try again." };
  }

  const lower = cleaned.toLowerCase();
  if (PLACEHOLDER_RESPONSES.has(lower)) {
    return { ok: false, reason: "No real answer detected. Please speak your response." };
  }

  for (const pattern of BACKGROUND_MEDIA_PATTERNS) {
    if (pattern.test(cleaned)) {
      return {
        ok: false,
        reason:
          "Background audio was detected (for example a video or TV). Use headphones, mute other media, and speak your own answer.",
      };
    }
  }

  for (const pattern of EXAMINER_ECHO_PATTERNS) {
    if (pattern.test(cleaned)) {
      return {
        ok: false,
        reason:
          "It sounds like Sarah's voice was picked up by the microphone. Use headphones and speak your own answer.",
      };
    }
  }

  if (isMostlyNumbersOrSymbols(cleaned)) {
    return {
      ok: false,
      reason: "That recording did not contain a clear spoken answer. Please try again.",
    };
  }

  const words = wordList(cleaned);
  if (words.length < 3) {
    return {
      ok: false,
      reason: "Answer too short. Speak at least a few full words for each question.",
    };
  }

  if (isTooRepetitive(cleaned) && words.length >= 6) {
    return {
      ok: false,
      reason: "That answer was too repetitive to score. Please give a natural spoken response.",
    };
  }

  return { ok: true };
}

function isSubstantiveAnswer(text: string) {
  if (!isLikelyRealStudentSpeech(text).ok) return false;
  return wordList(text).length >= MIN_WORDS_PER_SUBSTANTIVE_ANSWER;
}

export function extractStudentSpeech(transcript: unknown) {
  const entries: TranscriptEntry[] = Array.isArray(transcript) ? transcript : [];
  const studentEntries = entries.filter(
    (t) => t?.role === "student" && typeof t.text === "string" && t.text.trim().length > 0
  );

  const realEntries = studentEntries.filter((t) => {
    const text = String(t.text).trim();
    if (PLACEHOLDER_RESPONSES.has(text.toLowerCase())) return false;
    return isLikelyRealStudentSpeech(text).ok;
  });

  const rejectedEntries = studentEntries.filter((t) => {
    const text = String(t.text).trim();
    if (PLACEHOLDER_RESPONSES.has(text.toLowerCase())) return true;
    return !isLikelyRealStudentSpeech(text).ok;
  });

  const text = realEntries.map((t) => String(t.text).trim()).join(" ").trim();
  const words = text ? wordList(text) : [];
  const part1Responses = realEntries.filter((t) => t.part === 1).length;
  const substantiveAnswers = realEntries.filter((t) => isSubstantiveAnswer(String(t.text))).length;

  return {
    text,
    charCount: text.length,
    wordCount: words.length,
    part1Responses,
    responseCount: realEntries.length,
    substantiveAnswers,
    rejectedCount: rejectedEntries.length,
    totalStudentTurns: studentEntries.length,
  };
}

function sessionLooksLikeBackgroundMedia(transcript: unknown) {
  const entries: TranscriptEntry[] = Array.isArray(transcript) ? transcript : [];
  const studentTexts = entries
    .filter((t) => t?.role === "student")
    .map((t) => String(t.text || "").trim())
    .filter(Boolean);

  if (studentTexts.length === 0) return false;

  const mediaHits = studentTexts.filter((text) =>
    BACKGROUND_MEDIA_PATTERNS.some((pattern) => pattern.test(text))
  ).length;

  return mediaHits >= 2 || mediaHits / studentTexts.length >= 0.4;
}

export function hasValidSpeechInput(input: {
  transcript: unknown;
  speakingTimeSeconds: number;
  practiceMode?: boolean;
}): { valid: boolean; reason?: string } {
  const extracted = extractStudentSpeech(input.transcript);
  const {
    text,
    charCount,
    wordCount,
    part1Responses,
    responseCount,
    substantiveAnswers,
    rejectedCount,
    totalStudentTurns,
  } = extracted;

  if (sessionLooksLikeBackgroundMedia(input.transcript)) {
    return {
      valid: false,
      reason:
        "No valid student speech detected. Background media (for example YouTube) was transcribed instead of your voice. Use headphones, mute other audio, and answer in your own words.",
    };
  }

  if (!text || charCount === 0) {
    return {
      valid: false,
      reason:
        rejectedCount > 0
          ? "No valid student speech detected. Recordings were too short, echoed the examiner, or sounded like background media. Please speak your own answers clearly."
          : "No speech detected. Please complete the speaking session before requesting a score.",
    };
  }

  if (totalStudentTurns > 0 && rejectedCount / totalStudentTurns >= 0.5 && substantiveAnswers < MIN_SUBSTANTIVE_ANSWERS) {
    return {
      valid: false,
      reason:
        "Most of this session was not valid student speech. Use headphones, speak your own answers, and try again.",
    };
  }

  if (!input.practiceMode && part1Responses === 0) {
    return {
      valid: false,
      reason: "Please answer at least one Part 1 question before requesting a score.",
    };
  }

  if (input.practiceMode && responseCount === 0) {
    return {
      valid: false,
      reason: "Please answer at least one question in your chosen part before requesting a score.",
    };
  }

  if (substantiveAnswers < MIN_SUBSTANTIVE_ANSWERS) {
    return {
      valid: false,
      reason: `Please give at least ${MIN_SUBSTANTIVE_ANSWERS} real spoken answers (a few full sentences each) before requesting a score.`,
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
    .filter((t) => t && isLikelyRealStudentSpeech(t).ok);
  return entries.join(" ").trim();
}
