"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PART1_QUESTIONS,
  PART2_CUE,
  usePart2Cue,
} from "@/lib/placement/speakingTasks";
import type { SpeakingScore } from "@/lib/placement/types";

const MAX_RECORD_SEC = 60;

type Props = {
  currentBand: number;
  onComplete: (score: SpeakingScore, timeTaken: number) => void;
};

export default function SpeakingSection({ currentBand, onComplete }: Props) {
  const part2 = usePart2Cue(currentBand);
  const [part1Index, setPart1Index] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<SpeakingScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  }, []);

  const startRecording = async () => {
    setError(null);
    setScore(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
      startRef.current = Date.now();
      setRecordSec(0);
      timerRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startRef.current) / 1000);
        setRecordSec(sec);
        if (sec >= MAX_RECORD_SEC) stopRecording();
      }, 200);
    } catch {
      setError("Microphone access is required. Please allow the mic and try again.");
    }
  };

  const submitSpeaking = async () => {
    if (!audioBlob) {
      setError("Please record your answer first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("audio", audioBlob, "speaking.webm");
      fd.append("targetBand", String(currentBand));
      const res = await fetch("/api/placement/score-speaking", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Scoring failed");
      setScore(json as SpeakingScore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not score speaking.");
    } finally {
      setSubmitting(false);
    }
  };

  const finish = () => {
    if (!score) return;
    const timeTaken = Math.max(1, recordSec || 30);
    onComplete(score, timeTaken);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <span className="rounded-full bg-[#0d9488]/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0d9488]">
        SPEAKING
      </span>

      {part2 ? (
        <>
          <h2 className="mt-4 text-xl font-bold text-[#0d1b35]">
            Part 2 — Cue Card
          </h2>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-semibold text-[#0d1b35]">
              {PART2_CUE.topic}
            </p>
            <p className="mt-3 text-sm text-slate-600">You should say:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {PART2_CUE.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[#c9972c]">
              You have 1 minute to speak.
            </p>
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-4 text-xl font-bold text-[#0d1b35]">
            Part 1 — Personal Questions
          </h2>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs text-slate-500">
              Question {part1Index + 1} of {PART1_QUESTIONS.length}
            </p>
            <p className="mt-3 text-lg font-medium text-[#0d1b35]">
              {PART1_QUESTIONS[part1Index]}
            </p>
            {part1Index < PART1_QUESTIONS.length - 1 ? (
              <button
                type="button"
                onClick={() => setPart1Index((i) => i + 1)}
                className="mt-4 text-sm font-semibold text-[#0d9488] hover:underline"
              >
                Next question →
              </button>
            ) : null}
          </div>
        </>
      )}

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {!recording && !audioUrl ? (
          <button
            type="button"
            onClick={startRecording}
            className="w-full rounded-xl bg-[#c9972c] px-6 py-4 text-lg font-bold text-[#0d1b35] hover:opacity-95"
          >
            Start Recording
          </button>
        ) : null}

        {recording ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <span className="text-sm font-semibold text-red-600">Recording</span>
            </div>
            <p className="mt-4 text-4xl font-bold text-[#0d1b35]">
              {formatMmSs(recordSec)}
              <span className="text-base font-normal text-slate-400">
                {" "}
                / {formatMmSs(MAX_RECORD_SEC)}
              </span>
            </p>
            <button
              type="button"
              onClick={stopRecording}
              className="mt-6 w-full rounded-xl border-2 border-red-500 bg-red-50 px-6 py-3 text-sm font-bold text-red-700"
            >
              Stop & Submit
            </button>
          </div>
        ) : null}

        {audioUrl && !recording ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-600">Playback</p>
            <audio src={audioUrl} controls className="w-full" />
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startRecording}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#0d1b35]"
              >
                Record again
              </button>
              <button
                type="button"
                onClick={submitSpeaking}
                disabled={submitting}
                className="flex-1 rounded-xl bg-[#0d1b35] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {submitting ? "Analysing…" : "Submit Speaking"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {score ? (
        <div className="mt-6 rounded-xl border border-[#0d9488]/40 bg-[#0d9488]/10 p-5">
          <p className="font-bold text-[#0d9488]">Speaking feedback</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              <span className="text-slate-500">Fluency</span>
              <p className="font-bold text-[#0d1b35]">{score.fluency}</p>
            </div>
            <div>
              <span className="text-slate-500">Vocabulary</span>
              <p className="font-bold text-[#0d1b35]">{score.lexicalResource}</p>
            </div>
            <div>
              <span className="text-slate-500">Grammar</span>
              <p className="font-bold text-[#0d1b35]">{score.grammaticalRange}</p>
            </div>
            <div>
              <span className="text-slate-500">Overall</span>
              <p className="font-bold text-[#c9972c]">{score.overallBand}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-700">{score.feedback}</p>
          <button
            type="button"
            onClick={finish}
            className="mt-5 w-full rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35]"
          >
            Continue test →
          </button>
        </div>
      ) : null}
    </div>
  );
}

function formatMmSs(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
