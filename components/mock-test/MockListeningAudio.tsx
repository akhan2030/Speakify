"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    let cancelled = false;
    hasPlayedRef.current = false;
    autoplayAttemptedRef.current = false;
    updateStatus("loading");
    cleanup();

    async function loadAudio() {
      const transcriptText = transcript.trim();
      if (!transcriptText) {
        if (!cancelled) updateStatus("error");
        return;
      }

      try {
        const response = await fetch("/api/listening/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: transcriptText,
            text: transcriptText,
            voice,
            mockTest: true,
            sectionNumber,
            speakers,
            questions,
            testId: `mock-${mockNumber}-s${sectionNumber}`,
          }),
        });

        if (!response.ok || cancelled) {
          if (!cancelled) updateStatus("error");
          return;
        }

        const audioBlob = await response.blob();
        if (cancelled) return;

        const audioUrl = URL.createObjectURL(audioBlob);
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

        if (!cancelled) updateStatus("ready");
      } catch {
        if (!cancelled) updateStatus("error");
      }
    }

    void loadAudio();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [
    transcript,
    voice,
    sectionNumber,
    mockNumber,
    speakers,
    questions,
    cleanup,
    updateStatus,
  ]);

  useEffect(() => {
    if (status !== "ready" || autoplayAttemptedRef.current) return;
    autoplayAttemptedRef.current = true;
    void playOnce();
  }, [status, playOnce]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-[#0d1b35]">
      {status === "loading" && "Generating audio…"}
      {status === "ready" && "Starting audio…"}
      {status === "playing" && "🔊 Audio playing — listen carefully. No replay available."}
      {status === "complete" && "Audio finished — no replay available."}
      {status === "error" && "Audio unavailable — please check your connection and refresh."}
    </div>
  );
}
