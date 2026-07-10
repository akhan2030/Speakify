"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PracticeQuestion } from "@/lib/accelerator/normalizePracticeContent";
import type { NormalizedListeningSection } from "@/lib/accelerator/normalizePracticeContent";
import {
  groupListeningQuestions,
  type QuestionGroup,
} from "@/lib/accelerator/listeningQuestionUtils";
import {
  logListeningValidationDev,
  validateListeningSectionForDisplay,
} from "@/lib/accelerator/validateListeningForDisplay";
import PracticeQuestionField, {
  IeltsFormCompletionHeader,
  IeltsMcqHeader,
  McqQuestionPrompt,
  PracticeRefreshMessage,
} from "@/components/accelerator/PracticeQuestionField";
import { ExamHighlightSection } from "@/components/exam/ExamHighlightSection";
import type { TextHighlight } from "@/lib/examHighlight";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";
const SPEEDS = [0.75, 1, 1.25, 1.5];

type AudioStatus =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "done"
  | "error";

function speakWithBrowserTts(text: string, onEnd: () => void): (() => void) | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 8000));
  utterance.rate = 0.95;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
  return () => window.speechSynthesis.cancel();
}

function resolveSectionAudioUrl(section: NormalizedListeningSection): string | null {
  if (section.audioUrl) return section.audioUrl;
  return section.questions.find((q) => q.audioUrl)?.audioUrl ?? null;
}

function formatTime(sec: number) {
  if (!sec || !Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function estimateDurationFromTranscript(transcript: string) {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(30, Math.round((words / 130) * 60));
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

function VolumeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03z" />
    </svg>
  );
}

function SectionAudio({ section }: { section: NormalizedListeningSection }) {
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const ttsCancelRef = useRef<(() => void) | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usingBrowserTtsRef = useRef(false);

  const hasTranscript = Boolean(section.transcript?.trim());
  const estimatedDuration = hasTranscript
    ? estimateDurationFromTranscript(section.transcript)
    : 0;
  const displayDuration = duration > 0 ? duration : estimatedDuration;

  const cleanup = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    ttsCancelRef.current?.();
    ttsCancelRef.current = null;
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    usingBrowserTtsRef.current = false;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  function attachAudioHandlers(audio: HTMLAudioElement) {
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    audio.onloadedmetadata = () => {
      setDuration(audio.duration || estimatedDuration);
    };
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    audio.onended = () => {
      setProgress(100);
      setCurrentTime(audio.duration || displayDuration);
      setStatus("done");
    };
    audio.onerror = () => {
      console.warn("[ListeningPractice] Audio load failed");
      setStatus("error");
    };
  }

  function bindAudioElement(audio: HTMLAudioElement, url: string) {
    audio.src = url;
    audioRef.current = audio;
    attachAudioHandlers(audio);
    audio.load();
    return new Promise<void>((resolve, reject) => {
      audio.onloadedmetadata = () => {
        setDuration(audio.duration || estimatedDuration);
        attachAudioHandlers(audio);
        resolve();
      };
      audio.onerror = () => reject(new Error("Audio load failed"));
    });
  }

  async function fetchAudioUrl(): Promise<string> {
    const audioUrl = resolveSectionAudioUrl(section);
    if (audioUrl) return audioUrl;

    const { transcript, voice, id: sectionNumber, speakers, questions } = section;
    const response = await fetch("/api/listening/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        text: transcript,
        voice,
        mockTest: true,
        sectionNumber,
        speakers,
        questions: questions.map((q) => q.raw),
      }),
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.includes("audio")) {
      const errJson = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : {};
      throw new Error(String(errJson.error ?? "TTS failed"));
    }

    const blob = await response.blob();
    if (!blob.size) throw new Error("Empty audio");
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    return url;
  }

  useEffect(() => {
    if (!hasTranscript && !resolveSectionAudioUrl(section)) return;
    let cancelled = false;

    async function preload() {
      setStatus("loading");
      try {
        const url = await fetchAudioUrl();
        if (cancelled) return;
        const audio = new Audio();
        await bindAudioElement(audio, url);
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.warn("[ListeningPractice] Preload failed", err);
        if (!cancelled) {
          setDuration(estimatedDuration);
          setStatus(hasTranscript ? "ready" : "error");
        }
      }
    }

    void preload();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id, section.transcript]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  async function startPlayback() {
    const audio = audioRef.current;
    if (audio && blobUrlRef.current) {
      setStatus("playing");
      await audio.play();
      return;
    }

    if (!hasTranscript) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const url = await fetchAudioUrl();
      const el = new Audio();
      await bindAudioElement(el, url);
      setStatus("playing");
      await el.play();
    } catch (err) {
      console.warn("[ListeningPractice] TTS failed", err);
      usingBrowserTtsRef.current = true;
      setStatus("playing");
      setDuration(estimatedDuration);
      let pct = 5;
      progressTimerRef.current = setInterval(() => {
        pct = Math.min(95, pct + 1.5);
        setProgress(pct);
        setCurrentTime((pct / 100) * estimatedDuration);
      }, 800);
      ttsCancelRef.current = speakWithBrowserTts(section.transcript, () => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setProgress(100);
        setCurrentTime(estimatedDuration);
        setStatus("done");
      });
      if (!ttsCancelRef.current) setStatus("error");
    }
  }

  function togglePlayPause() {
    if (status === "playing") {
      audioRef.current?.pause();
      if (usingBrowserTtsRef.current) window.speechSynthesis.pause();
      setStatus("paused");
      return;
    }
    if (status === "paused") {
      void audioRef.current?.play();
      if (usingBrowserTtsRef.current) window.speechSynthesis.resume();
      setStatus("playing");
      return;
    }
    if (status === "done" || status === "ready" || status === "idle") {
      if (status === "done") {
        cleanup();
        setProgress(0);
        setCurrentTime(0);
      }
      void startPlayback();
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !displayDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
    setCurrentTime(audio.currentTime);
    setProgress(pct * 100);
  }

  const isActive = status === "playing" || status === "paused";
  const progressWidth =
    status === "done" ? 100 : isActive || currentTime > 0 ? progress : 0;

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold" style={{ color: NAVY }}>
        Listening audio
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={status === "loading"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#0d1b35] disabled:opacity-60"
          style={{ backgroundColor: GOLD }}
          aria-label={
            status === "playing" ? "Pause" : status === "done" ? "Replay" : "Play"
          }
        >
          {status === "loading" ? (
            <span className="text-xs font-bold">…</span>
          ) : status === "playing" ? (
            <PauseIcon className="h-5 w-5" />
          ) : (
            <PlayIcon className="h-5 w-5" />
          )}
        </button>

        <div className="min-w-[200px] flex-1">
          <div
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={displayDuration}
            aria-valuenow={currentTime}
            className="h-2 cursor-pointer overflow-hidden rounded-full bg-slate-200"
            onClick={handleSeek}
            onKeyDown={(e) => {
              if (!audioRef.current || !displayDuration) return;
              if (e.key === "ArrowRight") {
                audioRef.current.currentTime = Math.min(
                  audioRef.current.duration,
                  audioRef.current.currentTime + 5
                );
              }
              if (e.key === "ArrowLeft") {
                audioRef.current.currentTime = Math.max(
                  0,
                  audioRef.current.currentTime - 5
                );
              }
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progressWidth}%`,
                backgroundColor: status === "done" ? TEAL : GOLD,
              }}
            />
          </div>
          <p className="mt-1 text-xs tabular-nums text-slate-500">
            {formatTime(currentTime)} / {formatTime(displayDuration)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <VolumeIcon className="h-4 w-4 text-slate-500" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer accent-[#c9972c]"
            aria-label="Volume"
          />
        </div>

        <select
          value={playbackRate}
          onChange={(e) => setPlaybackRate(Number(e.target.value))}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700"
          aria-label="Playback speed"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s % 1 === 0 ? `${s.toFixed(1)}x` : `${s}x`}
            </option>
          ))}
        </select>
      </div>

      <div
        className="mt-4 rounded-lg px-4 py-3 text-sm text-slate-700"
        style={{ backgroundColor: `${TEAL}18`, borderLeft: `3px solid ${TEAL}` }}
      >
        You can play the audio as many times as you need.
      </div>

      {status === "error" ? (
        <p className="mt-2 text-xs text-red-600">
          Audio temporarily unavailable — please try again.
        </p>
      ) : null}
    </div>
  );
}

function QuestionGroupBlock({
  group,
  answers,
  onChange,
  variant,
  mcqCompact = false,
}: {
  group: QuestionGroup;
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  variant: "completion" | "mcq" | "other";
  mcqCompact?: boolean;
}) {
  return (
    <div className="space-y-1">
      {variant === "completion" ? (
        <IeltsFormCompletionHeader startNum={group.startNum} endNum={group.endNum} />
      ) : null}
      {variant === "mcq" ? (
        <IeltsMcqHeader
          startNum={group.startNum}
          endNum={group.endNum}
          compact={mcqCompact}
        />
      ) : null}

      {group.questions.map((q) => (
        <div
          key={q.key}
          className={
            variant === "mcq"
              ? "border-b border-slate-100 py-4 last:border-0"
              : "py-0.5"
          }
        >
          {variant === "mcq" ? <McqQuestionPrompt question={q} /> : null}
          <PracticeQuestionField
            question={q}
            value={answers[q.key] ?? ""}
            onChange={(v) => onChange(q.key, v)}
            showCompletionStyle={variant === "completion"}
          />
        </div>
      ))}
    </div>
  );
}

function SectionQuestions({
  section,
  displayableQuestions,
  answers,
  onChange,
}: {
  section: NormalizedListeningSection;
  displayableQuestions: PracticeQuestion[];
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const groups = groupListeningQuestions(displayableQuestions);
  const completionGroup = groups.find((g) => g.kind === "completion");
  const mcqGroup = groups.find((g) => g.kind === "mcq");
  const useTwoColumn = Boolean(completionGroup && mcqGroup);

  if (useTwoColumn) {
    return (
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div>
          <h2 className="mb-5 text-xl font-bold" style={{ color: NAVY }}>
            Section {section.id}
          </h2>
          {completionGroup ? (
            <QuestionGroupBlock
              group={completionGroup}
              answers={answers}
              onChange={onChange}
              variant="completion"
            />
          ) : null}
        </div>
        <div className="lg:pt-0">
          {mcqGroup ? (
            <QuestionGroupBlock
              group={mcqGroup}
              answers={answers}
              onChange={onChange}
              variant="mcq"
              mcqCompact
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="mb-4 text-xl font-bold" style={{ color: NAVY }}>
        Section {section.id}
      </h2>
      {groups.map((group) => (
        <QuestionGroupBlock
          key={`${group.kind}-${group.startNum}`}
          group={group}
          answers={answers}
          onChange={onChange}
          variant={
            group.kind === "completion"
              ? "completion"
              : group.kind === "mcq"
                ? "mcq"
                : "other"
          }
        />
      ))}
    </div>
  );
}

export default function PracticeListeningPanel({
  sections,
  answers,
  onChange,
}: {
  sections: NormalizedListeningSection[];
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const [partIdx, setPartIdx] = useState(0);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const section = sections[partIdx];

  useEffect(() => {
    setHighlights([]);
  }, [partIdx]);

  const sectionValidation = section
    ? validateListeningSectionForDisplay(section)
    : null;

  useEffect(() => {
    if (section && sectionValidation) {
      logListeningValidationDev(section.id, sectionValidation);
    }
  }, [section, sectionValidation]);

  if (!sections.length) {
    return <PracticeRefreshMessage />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {sections.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setPartIdx(i)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                i === partIdx ? "text-[#0d1b35]" : "bg-slate-100 text-slate-600"
              }`}
              style={i === partIdx ? { backgroundColor: GOLD } : undefined}
            >
              Section {s.id}
            </button>
          ))}
        </div>
      ) : null}

      {section ? (
        <>
          <SectionAudio key={section.id} section={section} />

          {sectionValidation && !sectionValidation.canRender ? (
            <PracticeRefreshMessage />
          ) : sectionValidation ? (
            <>
              {sectionValidation.studentMessage && !sectionValidation.canRender ? (
                <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
                  {sectionValidation.studentMessage}
                </div>
              ) : null}
              <ExamHighlightSection
                sectionId={`acc-listening-${section.id}`}
                highlights={highlights}
                onHighlightsChange={setHighlights}
                className="select-text"
                toolbarClassName="mb-4"
              >
                <SectionQuestions
                  section={section}
                  displayableQuestions={sectionValidation.displayableQuestions}
                  answers={answers}
                  onChange={onChange}
                />
              </ExamHighlightSection>
            </>
          ) : null}
        </>
      ) : null}

      {sections.length > 1 ? (
        <div className="flex justify-between gap-3 pt-4">
          <button
            type="button"
            disabled={partIdx === 0}
            onClick={() => setPartIdx((i) => i - 1)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
          >
            ← Previous section
          </button>
          <button
            type="button"
            disabled={partIdx >= sections.length - 1}
            onClick={() => setPartIdx((i) => i + 1)}
            className="rounded-lg px-4 py-2 text-sm font-bold text-[#0d1b35] disabled:opacity-40"
            style={{ backgroundColor: GOLD }}
          >
            Next section →
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function getListeningQuestionKeys(sections: NormalizedListeningSection[]) {
  return sections.flatMap((s) => {
    const v = validateListeningSectionForDisplay(s);
    return v.displayableQuestions.map((q) => q.key);
  });
}

export function countAnsweredQuestions(
  keys: string[],
  answers: Record<string, string>
) {
  return keys.filter((k) => String(answers[k] ?? "").trim().length > 0).length;
}
