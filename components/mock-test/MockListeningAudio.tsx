"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildListeningTtsRequestKey,
  playListeningBrowserFallback,
  requestListeningTtsBlob,
  stopListeningPlayback,
  type ListeningTtsPayload,
} from "@/lib/listeningTtsClient";

export type MockAudioStatus = "idle" | "loading" | "ready" | "playing" | "complete" | "error";

type SpeakerPayload = {
  label: string;
  name?: string;
  displayName?: string;
  gender?: string;
  voice?: string;
};

type QuestionPayload = {
  questionNumber?: number;
  number?: number;
  type?: string;
  answer?: string;
};

type Props = {
  transcript: string;
  voice?: string;
  sectionNumber?: number;
  mockNumber?: number;
  speakers?: SpeakerPayload[];
  questions?: QuestionPayload[];
  onComplete: () => void;
  onStatusChange?: (status: MockAudioStatus) => void;
};

export default function MockListeningAudio({
  transcript,
  voice = "onyx",
  sectionNumber = 1,
  mockNumber = 1,
  speakers = [],
  questions = [],
  onComplete,
  onStatusChange,
}: Props) {
  const [status, setStatus] = useState<MockAudioStatus>("loading");
  const [usingDeviceVoice, setUsingDeviceVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const hasPlayedRef = useRef(false);
  const autoplayAttemptedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const updateStatus = useCallback((next: MockAudioStatus) => {
    setStatus(next);
    onStatusChangeRef.current?.(next);
  }, []);

  const cleanup = useCallback(() => {
    stopListeningPlayback();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const playOnce = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || hasPlayedRef.current) return;
    try {
      updateStatus("playing");
      await audio.play();
      hasPlayedRef.current = true;
    } catch {
      if (!hasPlayedRef.current) updateStatus("ready");
    }
  }, [updateStatus]);

  const ttsPayload: ListeningTtsPayload = {
    transcript,
    voice,
    mockTest: true,
    sectionNumber,
    speakers,
    questions,
    testId: `mock-${mockNumber}-s${sectionNumber}`,
  };
  const requestKey = buildListeningTtsRequestKey(ttsPayload);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    hasPlayedRef.current = false;
    autoplayAttemptedRef.current = false;
    setUsingDeviceVoice(false);
    updateStatus("loading");
    cleanup();

    async function loadAudio() {
      const transcriptText = transcript.trim();
      if (!transcriptText) {
        if (!cancelled) updateStatus("error");
        return;
      }

      try {
        const apiResult = await requestListeningTtsBlob(ttsPayload, {
          signal: controller.signal,
        });

        if (cancelled) return;

        if (apiResult) {
          const audioUrl = URL.createObjectURL(apiResult.blob);
          blobUrlRef.current = audioUrl;
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          audio.onended = () => {
            if (cancelled) return;
            updateStatus("complete");
            onCompleteRef.current();
          };
          audio.onerror = () => {
            if (!cancelled) updateStatus("error");
          };

          updateStatus("ready");
          return;
        }

        setUsingDeviceVoice(true);
        updateStatus("playing");
        hasPlayedRef.current = true;
        await playListeningBrowserFallback(transcriptText);
        if (cancelled) return;
        updateStatus("complete");
        onCompleteRef.current();
      } catch {
        if (!cancelled) updateStatus("error");
      }
    }

    void loadAudio();

    return () => {
      cancelled = true;
      controller.abort();
      cleanup();
    };
    // Only reload when the actual TTS payload changes — not on parent timer re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  useEffect(() => {
    if (status !== "ready" || autoplayAttemptedRef.current) return;
    autoplayAttemptedRef.current = true;
    void playOnce();
  }, [status, playOnce]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-[#0d1b35]">
      {status === "loading" && "Generating audio…"}
      {status === "ready" && "Starting audio…"}
      {status === "playing" &&
        (usingDeviceVoice
          ? "🔊 Playing with device voice — listen carefully. No replay available."
          : "🔊 Audio playing — listen carefully. No replay available.")}
      {status === "complete" && "Audio finished — no replay available."}
      {status === "error" &&
        "Audio unavailable — please check your connection and refresh."}
    </div>
  );
}
