"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speakWithBrowser, stopBrowserSpeech } from "@/lib/browserSpeech";
import { extractListeningTranscript } from "@/lib/placement/format";
import type { Question } from "@/lib/placement/types";

function SpeakerIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 ${active ? "text-[#0d9488]" : "text-slate-400"}`}
      aria-hidden
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

type Props = {
  question: Question;
};

type AudioMode = "openai" | "browser";

function getTranscript(question: Question): string {
  const fromField = question.audioScript?.trim();
  if (fromField) return fromField;
  return extractListeningTranscript(question.explanation);
}

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

export default function PlacementListeningAudio({ question }: Props) {
  const [audioLoading, setAudioLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AudioMode>("openai");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    stopBrowserSpeech();
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

  const playWithBrowser = useCallback(async (transcript: string) => {
    setMode("browser");
    setError(null);
    setIsPlaying(true);
    await speakWithBrowser(transcript);
    setIsPlaying(false);
  }, []);

  const generateAndPlayAudio = useCallback(async () => {
    cleanup();
    setAudioLoading(true);
    setIsPlaying(false);
    setError(null);
    setMode("openai");

    const transcript = getTranscript(question);
    if (!transcript.trim()) {
      setAudioLoading(false);
      setError("Missing transcript for this listening question.");
      return;
    }

    try {
      const response = await fetch("/api/listening/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          transcript,
          text: transcript,
          voice: "onyx",
          announcement: true,
          placement: true,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || contentType.includes("application/json")) {
        let message = "TTS request failed";
        try {
          const json = await response.json();
          message = String(json.error ?? message);
        } catch {
          // ignore parse errors
        }

        if (isQuotaOrUnavailable(message)) {
          setAudioLoading(false);
          await playWithBrowser(transcript);
          return;
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      if (!blob.size) {
        throw new Error("Empty audio response");
      }

      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setError("Audio playback failed — tap replay to use your device voice.");
      };

      setAudioLoading(false);
      setIsPlaying(true);
      await audio.play();
    } catch (err) {
      console.error("Audio failed:", err);
      const message =
        err instanceof Error ? err.message : "Audio unavailable — please refresh.";

      if (isQuotaOrUnavailable(message)) {
        try {
          setAudioLoading(false);
          await playWithBrowser(transcript);
          return;
        } catch (browserErr) {
          console.error("Browser speech failed:", browserErr);
        }
      }

      setAudioLoading(false);
      setIsPlaying(false);
      setError(
        isQuotaOrUnavailable(message)
          ? "AI audio is unavailable (OpenAI quota). Tap replay to use your device voice."
          : message
      );
    }
  }, [cleanup, playWithBrowser, question]);

  useEffect(() => {
    if (question.section !== "listening") return;
    void generateAndPlayAudio();
    return cleanup;
  }, [question.id, question.section, generateAndPlayAudio, cleanup]);

  const replayWithDeviceVoice = useCallback(async () => {
    cleanup();
    setAudioLoading(true);
    setError(null);
    const transcript = getTranscript(question);
    try {
      await playWithBrowser(transcript);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Device voice unavailable on this browser."
      );
    } finally {
      setAudioLoading(false);
    }
  }, [cleanup, playWithBrowser, question]);

  if (error) {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-900">{error}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void replayWithDeviceVoice()}
            className="text-sm font-semibold text-[#0d9488] underline"
          >
            Read with device voice
          </button>
          <button
            type="button"
            onClick={() => void generateAndPlayAudio()}
            className="text-sm font-semibold text-amber-900 underline"
          >
            Retry AI audio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#0d9488]/20 bg-[#0d9488]/5 px-4 py-3">
      <button
        type="button"
        aria-label={isPlaying ? "Audio is playing" : "Replay audio"}
        onClick={() => void generateAndPlayAudio()}
        disabled={audioLoading}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm disabled:opacity-60"
      >
        <SpeakerIcon active={isPlaying} />
      </button>
      <div>
        <p className="text-sm font-medium text-[#0d9488]">
          {audioLoading
            ? "Generating audio..."
            : isPlaying
              ? "Playing audio..."
              : "Audio ready — tap to replay"}
        </p>
        {mode === "browser" && !audioLoading && (
          <p className="mt-0.5 text-xs text-amber-700">
            Using your device voice (AI audio unavailable)
          </p>
        )}
      </div>
    </div>
  );
}
