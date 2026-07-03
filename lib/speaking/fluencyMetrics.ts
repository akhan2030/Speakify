import type { FluencyMetrics, WordTiming } from "@/lib/speaking/scoringSchema";

const FILLER_WORDS = new Set([
  "um",
  "uh",
  "erm",
  "ah",
  "like",
  "youknow",
  "basically",
  "actually",
]);

const PAUSE_THRESHOLD_MS = 600;

function normalizeToken(word: string) {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

function countFillers(text: string) {
  const tokens = text
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z']/g, ""))
    .filter(Boolean);

  let count = 0;
  for (let i = 0; i < tokens.length; i += 1) {
    if (FILLER_WORDS.has(tokens[i])) count += 1;
    if (tokens[i] === "you" && tokens[i + 1] === "know") {
      count += 1;
      i += 1;
    }
  }
  return count;
}

function countSelfCorrections(text: string) {
  const patterns = [
    /\b(\w+)\s*[-–—]\s*\1\b/gi,
    /\bi mean\b/gi,
    /\bsorry\b/gi,
    /\bno,?\s+i\b/gi,
    /\bwait\b/gi,
  ];
  return patterns.reduce((sum, pattern) => {
    const matches = text.match(pattern);
    return sum + (matches?.length ?? 0);
  }, 0);
}

/**
 * Compute fluency metrics from word timings (preferred) and transcript text.
 * Pause metrics require word-level timestamps from STT.
 */
export function computeFluencyMetrics(input: {
  text: string;
  words?: WordTiming[];
  speakingSeconds?: number;
}): FluencyMetrics {
  const text = String(input.text || "").trim();
  const words = Array.isArray(input.words) ? input.words : [];
  const textWordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const totalWords = words.length > 0 ? words.length : textWordCount;

  let speakingSeconds = Number(input.speakingSeconds) || 0;
  if (!speakingSeconds && words.length >= 2) {
    speakingSeconds = Math.max(1, words[words.length - 1].end - words[0].start);
  }
  if (!speakingSeconds) {
    // ~130 wpm fallback estimate when no timing exists
    speakingSeconds = Math.max(1, Math.round((totalWords / 130) * 60));
  }

  let pauseCount = 0;
  let pauseTotalMs = 0;
  for (let i = 1; i < words.length; i += 1) {
    const gapMs = (words[i].start - words[i - 1].end) * 1000;
    if (gapMs >= PAUSE_THRESHOLD_MS) {
      pauseCount += 1;
      pauseTotalMs += gapMs;
    }
  }

  const fillerWordCount = countFillers(text);
  const wordsPerMinute =
    speakingSeconds > 0 ? Math.round((totalWords / speakingSeconds) * 60) : 0;

  return {
    words_per_minute: wordsPerMinute,
    pause_count: pauseCount,
    average_pause_ms:
      pauseCount > 0 ? Math.round(pauseTotalMs / pauseCount) : 0,
    filler_word_count: fillerWordCount,
    filler_word_rate:
      totalWords > 0
        ? Math.round((fillerWordCount / totalWords) * 1000) / 1000
        : 0,
    self_correction_count: countSelfCorrections(text),
    speaking_seconds: Math.round(speakingSeconds),
    total_words: totalWords,
  };
}

export function collectWordTimingsFromTranscript(transcript: unknown): WordTiming[] {
  if (!Array.isArray(transcript)) return [];
  const words: WordTiming[] = [];
  for (const entry of transcript) {
    if (entry?.role !== "student" || !Array.isArray(entry.words)) continue;
    for (const word of entry.words) {
      if (!word?.word) continue;
      words.push({
        word: String(word.word),
        start: Number(word.start) || 0,
        end: Number(word.end) || 0,
        confidence:
          word.confidence != null ? Number(word.confidence) : undefined,
      });
    }
  }
  return words;
}

export function lowConfidenceWords(words: WordTiming[], threshold = 0.55): string[] {
  const flagged = words
    .filter((w) => w.confidence != null && w.confidence < threshold)
    .map((w) => normalizeToken(w.word))
    .filter((w) => w.length > 2);

  return [...new Set(flagged)].slice(0, 12);
}
