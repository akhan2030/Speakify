"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import StepSectionTopBar, {
  type SectionProgress,
  STEP_GOLD,
  STEP_NAVY,
  STEP_TEAL,
} from "./StepSectionTopBar";
import type { StepMcqOption } from "@/lib/step/types";
import { speakWithBrowser, stopBrowserSpeech, canUseBrowserSpeech } from "@/lib/browserSpeech";
import { accuracyPercent } from "@/lib/step/practiceScoreUtils";
import { STEP_STUDENT_BASE } from "@/lib/step/paths";

type ClientQuestion = {
  id: string;
  stem: string;
  questionType: string;
  options: Record<StepMcqOption, string>;
};

type GradedResult = {
  id: string;
  isCorrect: boolean;
  correct: StepMcqOption;
  explanation: string;
};

const OPTS: StepMcqOption[] = ["A", "B", "C", "D"];

function estimateDurationSeconds(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(30, Math.ceil(words / 2.5));
}

function highlightTranscript(transcript: string, phrase: string): string {
  if (!phrase || phrase.length < 4) return transcript;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return transcript.replace(
    new RegExp(escaped, "gi"),
    (m) => `⟦${m}⟧`
  );
}

export default function StepListeningPractice() {
  const [recordingOffset, setRecordingOffset] = useState(0);
  const [recordingsToday, setRecordingsToday] = useState(1);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState<{
    id: string;
    recordingNumber: number;
    transcript: string;
    setting?: string;
  } | null>(null);
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [progress, setProgress] = useState<SectionProgress | null>(null);
  const [weightPercent, setWeightPercent] = useState(20);

  const [audioPlayed, setAudioPlayed] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioFinished, setAudioFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const [answers, setAnswers] = useState<Record<string, StepMcqOption>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [graded, setGraded] = useState<GradedResult[]>([]);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  const loadRecording = useCallback(async (offset: number) => {
    setLoading(true);
    setAudioPlayed(false);
    setAudioPlaying(false);
    setAudioFinished(false);
    setSecondsLeft(null);
    setAnswers({});
    setSubmitted(false);
    setGraded([]);
    stopBrowserSpeech();

    const res = await fetch(
      `/api/step/questions?section=listening&limit=7&recordingOffset=${offset}`
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    setRecording(json.recording);
    setQuestions(json.questions ?? []);
    setProgress(json.progress);
    setWeightPercent(json.weightPercent ?? 20);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecording(recordingOffset).catch(() => setLoading(false));
    return () => stopBrowserSpeech();
  }, [loadRecording, recordingOffset]);

  const durationSec = useMemo(
    () => (recording ? estimateDurationSeconds(recording.transcript) : 0),
    [recording]
  );

  const handlePlay = async () => {
    if (!recording || audioPlayed || audioPlaying) return;
    if (!canUseBrowserSpeech()) {
      alert("Browser speech is not supported. Use Chrome or Edge on desktop.");
      return;
    }
    setAudioPlaying(true);
    setAudioPlayed(true);
    setSecondsLeft(durationSec);

    const interval = window.setInterval(() => {
      setSecondsLeft((s) => (s != null && s > 0 ? s - 1 : 0));
    }, 1000);

    try {
      await speakWithBrowser(recording.transcript, "en-US");
    } catch {
      // still show questions after timer
    } finally {
      window.clearInterval(interval);
      setSecondsLeft(0);
      setAudioPlaying(false);
      setAudioFinished(true);
    }
  };

  const allAnswered = questions.length > 0 && Object.keys(answers).length >= questions.length;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/step/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "listening", answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setGraded(json.results ?? []);
      setSessionCorrect(json.sessionCorrect ?? 0);
      setSubmitted(true);
      if (json.today && progress) {
        setProgress({
          ...progress,
          questionsAttemptedToday: json.today.questionsAttempted,
          estimatedSectionScore: json.today.estimatedScore,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const gradedById = useMemo(() => {
    const m = new Map<string, GradedResult>();
    for (const g of graded) m.set(g.id, g);
    return m;
  }, [graded]);

  let displayTranscript = recording?.transcript ?? "";
  if (submitted) {
    for (const g of graded) {
      if (!g.isCorrect) {
        const q = questions.find((x) => x.id === g.id);
        const phrase = q?.options[g.correct] ?? "";
        displayTranscript = highlightTranscript(displayTranscript, phrase.slice(0, 40));
      }
    }
  }

  if (loading || !recording) return <PageSpinner />;

  const todayAttempted = progress?.questionsAttemptedToday ?? 0;
  const estScore = progress?.estimatedSectionScore ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <StepSectionTopBar
        label="Listening"
        weightPercent={weightPercent}
        progress={
          progress ?? {
            questionsAttemptedToday: 0,
            questionsCorrectToday: 0,
            estimatedSectionScore: 0,
            sectionMax: 20,
          }
        }
      />

      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        ⚠ In the real STEP exam, audio plays <strong>once only</strong>. Practice under the same
        conditions.
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-500">
          Recording {recordingsToday} of 3 today
          {recording.setting ? ` · ${recording.setting}` : ""}
        </p>

        <button
          type="button"
          disabled={audioPlayed || audioPlaying}
          onClick={handlePlay}
          className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full text-3xl text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: audioPlayed ? "#94a3b8" : STEP_TEAL }}
          aria-label="Play recording once"
        >
          ▶
        </button>

        <p className="mt-4 text-sm font-medium" style={{ color: STEP_NAVY }}>
          {audioPlaying
            ? "Playing… listen carefully"
            : audioPlayed
              ? "Listen carefully — you cannot replay this recording"
              : "Press play to hear the recording (one time only)"}
        </p>

        {secondsLeft != null ? (
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            Audio duration: ~{durationSec}s
            {audioPlaying || audioFinished
              ? ` · ${secondsLeft}s remaining`
              : ""}
          </p>
        ) : null}
      </div>

      {audioFinished && !submitted ? (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold" style={{ color: STEP_NAVY }}>
                Question {i + 1}. {q.stem}
              </p>
              <div className="mt-3 space-y-2">
                {OPTS.map((letter) => (
                  <label
                    key={letter}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                      answers[q.id] === letter
                        ? "border-teal-400 bg-teal-50"
                        : "border-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === letter}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: letter }))
                      }
                    />
                    <span>
                      <strong>{letter}.</strong> {q.options[letter]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            disabled={!allAnswered || submitting}
            onClick={handleSubmit}
            className="rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: STEP_TEAL }}
          >
            {submitting ? "Submitting…" : "Submit answers"}
          </button>
        </div>
      ) : null}

      {submitted ? (
        <div className="space-y-4">
          <div
            className="rounded-xl p-4 text-white"
            style={{ backgroundColor: STEP_NAVY }}
          >
            <p className="font-bold">
              {sessionCorrect}/{questions.length} correct —{" "}
              {accuracyPercent(sessionCorrect, questions.length)}%
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-bold" style={{ color: STEP_NAVY }}>
              Transcript
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {displayTranscript.split("⟦").map((part, i) => {
                if (i === 0) return part;
                const [hl, rest] = part.split("⟧");
                return (
                  <span key={i}>
                    <mark className="rounded bg-yellow-200 px-0.5">{hl}</mark>
                    {rest}
                  </span>
                );
              })}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Highlighted phrases relate to correct answers you missed.
            </p>
          </div>

          {questions.map((q, i) => {
            const g = gradedById.get(q.id);
            if (!g) return null;
            return (
              <div
                key={q.id}
                className={`rounded-lg border p-3 text-sm ${
                  g.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                }`}
              >
                {g.isCorrect ? "✅" : "❌"} Q{i + 1}: {g.explanation}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setRecordingsToday((n) => Math.min(3, n + 1));
              setRecordingOffset((n) => n + 1);
            }}
            className="rounded-lg px-5 py-2.5 text-sm font-bold"
            style={{ backgroundColor: STEP_GOLD, color: STEP_NAVY }}
          >
            Next Recording →
          </button>
        </div>
      ) : null}

      <p className="text-sm text-slate-600">
        {todayAttempted} listening questions answered today — estimated{" "}
        <strong>{estScore}/20</strong>
      </p>

      <Link
        href={STEP_STUDENT_BASE}
        className="inline-block text-sm font-semibold"
        style={{ color: STEP_TEAL }}
      >
        ← Return to Dashboard
      </Link>
    </div>
  );
}
