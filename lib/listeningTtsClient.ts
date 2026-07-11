import {
  canUseBrowserSpeech,
  speakDialogueWithBrowser,
  speakWithBrowser,
  stopBrowserSpeech,
} from "@/lib/browserSpeech";

export const LISTENING_TTS_TIMEOUT_MS = 45_000;

export type ListeningTtsPayload = {
  transcript: string;
  text?: string;
  sectionNumber?: number;
  voice?: string;
  speed?: number;
  mockTest?: boolean;
  placement?: boolean;
  announcement?: boolean;
  audioPart?: string;
  speakers?: unknown[];
  questions?: unknown[];
  testId?: string;
};

export type ListeningTtsBlobResult = {
  blob: Blob;
  timelineHeader: string | null;
};

/** Stable key so audio loads once per unique transcript/payload — not on parent re-renders. */
export function buildListeningTtsRequestKey(payload: ListeningTtsPayload): string {
  const text = String(payload.transcript ?? "").trim();
  return JSON.stringify({
    text,
    sectionNumber: payload.sectionNumber ?? 0,
    voice: payload.voice ?? "",
    speed: payload.speed ?? 0,
    mockTest: Boolean(payload.mockTest),
    placement: Boolean(payload.placement),
    announcement: Boolean(payload.announcement),
    audioPart: payload.audioPart ?? "full",
    speakers: payload.speakers ?? [],
    questions: payload.questions ?? [],
    testId: payload.testId ?? "",
  });
}

function buildRequestBody(payload: ListeningTtsPayload) {
  const text = String(payload.transcript ?? "").trim();
  return {
    transcript: text,
    text,
    sectionNumber: payload.sectionNumber,
    voice: payload.voice,
    speed: payload.speed,
    mockTest: payload.mockTest,
    placement: payload.placement,
    announcement: payload.announcement,
    audioPart: payload.audioPart,
    speakers: payload.speakers,
    questions: payload.questions,
    testId: payload.testId,
  };
}

/**
 * Fetch OpenAI TTS audio. Returns null when the API is unavailable (quota, timeout, etc.).
 */
export async function requestListeningTtsBlob(
  payload: ListeningTtsPayload,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<ListeningTtsBlobResult | null> {
  const text = String(payload.transcript ?? "").trim();
  if (!text) return null;

  const timeoutMs = options?.timeoutMs ?? LISTENING_TTS_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const externalSignal = options?.signal;
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort);

  try {
    const response = await fetch("/api/listening/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(buildRequestBody(payload)),
    });

    const contentType = response.headers.get("Content-Type") ?? "";
    if (!response.ok || !contentType.includes("audio")) {
      return null;
    }

    const blob = await response.blob();
    if (!blob.size) return null;

    return {
      blob,
      timelineHeader: response.headers.get("X-Speaker-Timeline"),
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

/** Speak transcript with device voices when OpenAI TTS is unavailable. */
export async function playListeningBrowserFallback(
  transcript: string,
  options?: {
    announcement?: boolean;
    speakers?: Array<{
      label?: string;
      name?: string;
      gender?: string;
      voice?: string;
    }>;
    sectionNumber?: number;
  }
): Promise<void> {
  const text = String(transcript ?? "").trim();
  if (!text) {
    throw new Error("No transcript to play.");
  }
  if (!canUseBrowserSpeech()) {
    throw new Error("Browser speech is not supported on this device.");
  }

  stopBrowserSpeech();

  const useSingleVoice =
    Boolean(options?.announcement) || !/^[A-Za-z][A-Za-z\s.'-]*:\s/m.test(text);

  if (useSingleVoice) {
    await speakWithBrowser(text);
    return;
  }

  await speakDialogueWithBrowser(text, {
    speakers: options?.speakers,
    sectionNumber: options?.sectionNumber,
  });
}

/**
 * Try OpenAI TTS first; fall back to browser speech. Returns how audio was played.
 */
export async function loadListeningAudioWithFallback(
  payload: ListeningTtsPayload,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<"api" | "browser"> {
  const text = String(payload.transcript ?? "").trim();
  if (!text) {
    throw new Error("No transcript to play.");
  }

  const apiResult = await requestListeningTtsBlob(payload, options);
  if (apiResult) {
    return "api";
  }

  await playListeningBrowserFallback(text, {
    announcement: payload.announcement,
  });
  return "browser";
}

export function stopListeningPlayback(): void {
  stopBrowserSpeech();
}
