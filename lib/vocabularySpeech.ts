import { speakWithBrowser, stopBrowserSpeech } from "@/lib/browserSpeech";

const blobCache = new Map<string, Blob>();

function isQuotaOrUnavailable(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("billing") ||
    lower.includes("openai_api_key") ||
    lower.includes("not configured")
  );
}

/** Primary: OpenAI TTS via POST /api/vocabulary/tts → audio/mpeg blob → HTMLAudioElement. Fallback: Web Speech API (speechSynthesis). */
async function fetchWordAudio(word: string): Promise<Blob> {
  console.log("[vocabulary Listen] TTS API request:", { word, url: "/api/vocabulary/tts" });

  const response = await fetch("/api/vocabulary/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ word }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  console.log("[vocabulary Listen] TTS API response:", {
    ok: response.ok,
    status: response.status,
    contentType,
  });

  if (!response.ok || contentType.includes("application/json")) {
    let message = "AI audio unavailable";
    let body: unknown = null;
    try {
      body = await response.json();
      message = String((body as { error?: string })?.error ?? message);
      console.error("[vocabulary Listen] TTS API error body:", body);
    } catch (parseErr) {
      console.error("[vocabulary Listen] TTS API error (non-JSON):", parseErr);
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  console.log("[vocabulary Listen] TTS API audio blob:", { size: blob.size, type: blob.type });
  if (!blob.size) {
    throw new Error("Empty audio response");
  }
  return blob;
}

async function getWordBlob(word: string): Promise<Blob> {
  const key = word.trim().toLowerCase();
  const cached = blobCache.get(key);
  if (cached) {
    console.log("[vocabulary Listen] using cached audio blob for:", key);
    return cached;
  }

  const blob = await fetchWordAudio(word);
  blobCache.set(key, blob);
  return blob;
}

async function playBlobOnElement(audioEl: HTMLAudioElement, blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  console.log("[vocabulary Listen] audio file URL (blob):", url);

  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (ok: boolean, err?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      audioEl.onended = null;
      audioEl.onerror = null;
      audioEl.oncanplaythrough = null;
      URL.revokeObjectURL(url);
      if (ok) resolve();
      else reject(err ?? new Error("Could not play pronunciation audio."));
    };

    const timeoutId = window.setTimeout(() => {
      console.error("[vocabulary Listen] audio playback timed out");
      settle(false, new Error("Audio timed out. Click Listen again."));
    }, 12000);

    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.src = url;
    audioEl.load();

    audioEl.onended = () => {
      console.log("[vocabulary Listen] audio element ended");
      settle(true);
    };

    audioEl.onerror = () => {
      console.error("[vocabulary Listen] audio element error", audioEl.error);
      settle(false, new Error("Could not play pronunciation audio."));
    };

    let playStarted = false;
    const tryPlay = () => {
      if (playStarted) return;
      playStarted = true;
      console.log("[vocabulary Listen] audio.play() — readyState:", audioEl.readyState);
      void audioEl
        .play()
        .then(() => {
          console.log("[vocabulary Listen] audio.play() started successfully");
        })
        .catch((playErr) => {
          console.error("[vocabulary Listen] audio.play() rejected:", playErr);
          settle(
            false,
            playErr instanceof Error
              ? playErr
              : new Error("Playback blocked — check browser sound settings.")
          );
        });
    };

    if (audioEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      tryPlay();
    } else {
      audioEl.oncanplaythrough = () => {
        audioEl.oncanplaythrough = null;
        tryPlay();
      };
      window.setTimeout(() => {
        if (!playStarted) {
          console.warn("[vocabulary Listen] canplaythrough slow — trying play anyway");
          tryPlay();
        }
      }, 500);
    }
  });
}

export type SpeakVocabularyResult = "ai" | "browser";

export async function speakVocabularyWord(
  word: string,
  audioEl: HTMLAudioElement
): Promise<SpeakVocabularyResult> {
  const trimmed = word.trim();
  if (!trimmed) {
    throw new Error("Nothing to pronounce.");
  }

  stopBrowserSpeech();
  audioEl.pause();

  let aiError: string | null = null;

  try {
    const blob = await getWordBlob(trimmed);
    await playBlobOnElement(audioEl, blob);
    return "ai";
  } catch (err) {
    aiError = err instanceof Error ? err.message : "AI audio failed";
    console.error("[vocabulary Listen] OpenAI TTS / audio file path failed:", err);
    if (!isQuotaOrUnavailable(aiError)) {
      console.warn("[vocabulary Listen] falling back to speechSynthesis");
    }
  }

  try {
    // User-gesture may be lost after await — clear stuck queue before speechSynthesis.
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
    console.log("[vocabulary Listen] speechSynthesis fallback for:", trimmed);
    await speakWithBrowser(trimmed);
    console.log("[vocabulary Listen] speechSynthesis finished");
    return "browser";
  } catch (browserErr) {
    console.error("[vocabulary Listen] speechSynthesis failed:", browserErr);
    const browserMessage =
      browserErr instanceof Error ? browserErr.message : "Device voice failed";
    throw new Error(aiError ? `${aiError}. ${browserMessage}` : browserMessage);
  }
}
