/**
 * Client-side speech fallback when OpenAI TTS is unavailable.
 */
export function canUseBrowserSpeech(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopBrowserSpeech(): void {
  if (canUseBrowserSpeech()) {
    window.speechSynthesis.cancel();
  }
}

export function speakWithBrowser(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!canUseBrowserSpeech()) {
      reject(new Error("Browser speech is not supported on this device."));
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      reject(new Error("Nothing to read aloud."));
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = "en-GB";
    utterance.rate = 0.92;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith("en-GB") && v.localService) ??
      voices.find((v) => v.lang.startsWith("en-GB")) ??
      voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => resolve();
    utterance.onerror = () =>
      reject(new Error("Device voice playback failed. Try replaying."));

    window.speechSynthesis.speak(utterance);
  });
}
