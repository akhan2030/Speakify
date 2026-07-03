import type { PronunciationMetrics, WordTiming } from "@/lib/speaking/scoringSchema";
import { lowConfidenceWords } from "@/lib/speaking/fluencyMetrics";

/**
 * Pronunciation assessment.
 * Prefer Azure Speech Pronunciation Assessment when configured.
 * Otherwise estimate from STT confidence / segment quality (marked estimated: true).
 */
export async function assessPronunciation(input: {
  words?: WordTiming[];
  transcript: string;
  speakingSeconds?: number;
}): Promise<PronunciationMetrics> {
  const azure = await tryAzurePronunciation(input.transcript);
  if (azure) return azure;

  return estimateFromStt(input.words ?? [], input.transcript);
}

async function tryAzurePronunciation(
  _transcript: string
): Promise<PronunciationMetrics | null> {
  // Wire-up point for Azure Speech Pronunciation Assessment.
  // Requires AZURE_SPEECH_KEY + AZURE_SPEECH_REGION and audio bytes.
  // We do not store full-session audio yet, so this returns null until Phase 2
  // audio retention is added. Keep the branch so integration is one-file.
  if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
    return null;
  }
  return null;
}

function estimateFromStt(
  words: WordTiming[],
  transcript: string
): PronunciationMetrics {
  const withConfidence = words.filter((w) => w.confidence != null);
  const lowWords = lowConfidenceWords(words);

  let accuracy = 75;
  if (withConfidence.length >= 5) {
    const avg =
      withConfidence.reduce((sum, w) => sum + (w.confidence ?? 0), 0) /
      withConfidence.length;
    accuracy = Math.round(avg * 100);
  } else if (transcript.length > 40) {
    // No confidence scores (typical Whisper) — neutral estimate.
    accuracy = 72;
  }

  const fluencyScore = Math.min(90, Math.max(50, accuracy - lowWords.length * 2));

  return {
    accuracy_score: accuracy,
    fluency_score: fluencyScore,
    prosody_score: undefined,
    estimated: true,
    notes:
      withConfidence.length >= 5
        ? "Estimated from STT word confidence. Dedicated pronunciation API not configured."
        : "Estimated from transcript quality only. Whisper does not return per-word confidence; configure Azure Speech for phoneme-level scores.",
    low_confidence_words: lowWords,
  };
}

/** Map pronunciation metrics to a rough band anchor for the LLM (not final score). */
export function pronunciationMetricsToBandHint(metrics: PronunciationMetrics): number {
  const accuracy = metrics.accuracy_score ?? 70;
  if (accuracy >= 90) return 8;
  if (accuracy >= 82) return 7;
  if (accuracy >= 72) return 6.5;
  if (accuracy >= 62) return 6;
  if (accuracy >= 52) return 5;
  return 4.5;
}
