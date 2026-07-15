/**
 * Browser Web Speech API helper for classroom vocabulary / prompts.
 * Client-only — calls window.speechSynthesis.
 */

export type SpeakWordOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
};

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const exact = voices.find((v) => v.lang === lang);
  if (exact) return exact;
  const prefix = lang.split("-")[0];
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ?? null;
}

/**
 * Speak a word or short phrase using the browser TTS engine.
 * Defaults to British English (en-GB).
 */
export function speakWord(
  text: string,
  lang: string = "en-GB",
  options: SpeakWordOptions = {}
): boolean {
  if (typeof window === "undefined") return false;
  const synth = window.speechSynthesis;
  if (!synth || !text?.trim()) return false;

  try {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = options.lang ?? lang;
    utterance.rate = options.rate ?? 0.95;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    const voice = pickVoice(utterance.lang);
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined"
  );
}
