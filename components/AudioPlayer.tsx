"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ExamPlayerShell,
  ExamProgressBar,
  ExamWaveformBars,
} from "@/components/listening/listeningAudioPlayerUi";
import {
  buildListeningTtsRequestKey,
  playListeningBrowserFallback,
  requestListeningTtsBlob,
  stopListeningPlayback,
} from "@/lib/listeningTtsClient";
import {
  buildSpeakerTimeline,
  getActiveSpeakerEntryAtTime,
  getSpeakerDotColor,
  parseTranscriptIntoSegments,
  scaleTimelineToDuration,
} from "@/lib/listeningTranscriptParse";

export type SpeakerInfo = {
  label: string;
  name?: string;
};

export type AudioPlayerProps = {
  transcript: string;
  sectionNumber: number;
  sectionTitle: string;
  onComplete: () => void;
  onStart: () => void;
  allowReplay?: boolean;
  practiceMode?: boolean;
  /** Optional stable id for localStorage (defaults to React useId). */
  sessionId?: string;
  speakers?: SpeakerInfo[];
  voice?: string;
  speed?: number;
  /** Smaller layout for split-screen during playback */
  compact?: boolean;
  /** Slim fixed top bar (~70px) — never blocks page content */
  topBar?: boolean;
  /** Load audio in background without showing ready/play UI */
  suppressReadyUI?: boolean;
  /** Start playback automatically when audio is ready (e.g. after preview countdown) */
  autoStart?: boolean;
  /** part1 | part2 | full | g0, g1, … per question-type group */
  audioPart?: string;
  /** Required for part1/part2 TTS split at Q5 */
  questions?: Array<{ questionNumber?: number; answer?: string }>;
  /** `exam` = platform-standard listening card; use ListeningAudioPlayer instead of setting this directly */
  presentation?: "default" | "exam";
};

type PlayerState =
  | "loading"
  | "ready"
  | "playing"
  | "buffering"
  | "completed"
  | "error";

type SpeakerTimelineEntry = {
  speaker: string;
  name?: string;
  startSec: number;
  endSec: number;
};

const NAVY = "#0d1b35";
function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function estimateDurationSeconds(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(30, Math.round((words / 150) * 60));
}

function storageKey(
  sectionNumber: number,
  sessionId: string,
  audioPart: string
) {
  return `section_${sectionNumber}_${audioPart}_played_${sessionId}`;
}

function HeadphonesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <path d="M3 14h3a2 2 0 0 0 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 0 2-2h3" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={className}
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function NowSpeakingIndicator({
  speaker,
}: {
  speaker: string | null;
}) {
  if (!speaker) return null;
  const color = getSpeakerDotColor(speaker);
  return (
    <div className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2">
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="text-sm text-white">
        Now speaking: <span className="font-semibold">{speaker}</span>
      </span>
    </div>
  );
}

function WaveformBars() {
  return (
    <div className="flex h-14 items-end justify-center gap-1.5" aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className="w-1.5 animate-pulse rounded-full bg-[#c9972c]"
          style={{
            animationDelay: `${i * 0.12}s`,
            animationDuration: "0.85s",
            height: `${32 + (i % 3) * 22}%`,
          }}
        />
      ))}
    </div>
  );
}

export default function AudioPlayer({
  transcript,
  sectionNumber,
  sectionTitle,
  onComplete,
  onStart,
  allowReplay = false,
  practiceMode = false,
  sessionId: sessionIdProp,
  speakers = [],
  voice,
  speed = 0.9,
  compact = false,
  topBar = false,
  suppressReadyUI = false,
  autoStart = false,
  audioPart = "full",
  questions = [],
  presentation = "default",
}: AudioPlayerProps) {
  const isExamPresentation = presentation === "exam";
  const reactId = useId();
  const sessionId = sessionIdProp ?? reactId.replace(/:/g, "");

  const [state, setState] = useState<PlayerState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usingDeviceVoice, setUsingDeviceVoice] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(() => estimateDurationSeconds(transcript));
  const [activeSpeakerName, setActiveSpeakerName] = useState<string | null>(
    null
  );

  const estimatedTimeline = useMemo(() => {
    const segments = parseTranscriptIntoSegments(transcript, sectionNumber);
    return buildSpeakerTimeline(segments, sectionNumber);
  }, [transcript, sectionNumber]);

  const speakerTimelineRef = useRef<SpeakerTimelineEntry[]>(
    estimatedTimeline as SpeakerTimelineEntry[]
  );

  useEffect(() => {
    speakerTimelineRef.current = estimatedTimeline as SpeakerTimelineEntry[];
  }, [estimatedTimeline]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onStartRef = useRef(onStart);
  const hasStartedRef = useRef(false);
  const autoStartPendingRef = useRef(false);
  const browserModeRef = useRef(false);

  onCompleteRef.current = onComplete;
  onStartRef.current = onStart;

  const canReplay = allowReplay || practiceMode;
  const playKey = storageKey(sectionNumber, sessionId, audioPart);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const markPlayed = useCallback(() => {
    try {
      localStorage.setItem(playKey, "1");
    } catch {
      /* ignore quota / private mode */
    }
  }, [playKey]);

  const wasPlayedThisSession = useCallback(() => {
    try {
      return localStorage.getItem(playKey) === "1";
    } catch {
      return false;
    }
  }, [playKey]);

  const clearPlayedFlag = useCallback(() => {
    try {
      localStorage.removeItem(playKey);
    } catch {
      /* ignore */
    }
  }, [playKey]);

  const loadAudio = useCallback(async () => {
    if (!transcript.trim()) {
      setErrorMessage("No transcript provided for audio generation.");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMessage(null);
    setUsingDeviceVoice(false);
    browserModeRef.current = false;
    revokeBlob();
    stopListeningPlayback();

    try {
      const apiResult = await requestListeningTtsBlob({
        transcript,
        sectionNumber,
        audioPart,
        questions,
        speakers,
        voice,
        speed,
      });

      if (!apiResult) {
        browserModeRef.current = true;
        setDuration(estimateDurationSeconds(transcript));
        setState("ready");
        return;
      }

      const timelineHeader = apiResult.timelineHeader;
      if (timelineHeader) {
        try {
          const parsed = JSON.parse(decodeURIComponent(timelineHeader));
          if (Array.isArray(parsed) && parsed.length > 0) {
            speakerTimelineRef.current = parsed as SpeakerTimelineEntry[];
          }
        } catch {
          /* use estimated timeline */
        }
      }

      const url = URL.createObjectURL(apiResult.blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
          speakerTimelineRef.current = scaleTimelineToDuration(
            speakerTimelineRef.current,
            audio.duration
          ) as SpeakerTimelineEntry[];
        }
      });

      audio.onended = () => {
        clearTimer();
        setElapsed(Math.round(audio.duration || duration));
        markPlayed();
        setState("completed");
        onCompleteRef.current();
      };

      audio.onerror = () => {
        clearTimer();
        setErrorMessage("Failed to play audio.");
        setState("error");
      };

      audio.addEventListener("waiting", () => {
        if (hasStartedRef.current && !audio.paused && !audio.ended) {
          setState("buffering");
        }
      });

      audio.addEventListener("playing", () => {
        if (hasStartedRef.current && !audio.ended) {
          setState("playing");
        }
      });

      setState("ready");
    } catch {
      browserModeRef.current = true;
      setDuration(estimateDurationSeconds(transcript));
      setState("ready");
    }
  }, [
    transcript,
    voice,
    sectionNumber,
    speed,
    duration,
    clearTimer,
    markPlayed,
    revokeBlob,
    audioPart,
    questions,
    speakers,
  ]);

  const ttsRequestKey = buildListeningTtsRequestKey({
    transcript,
    sectionNumber,
    audioPart,
    questions,
    speakers,
    voice,
    speed,
  });

  useEffect(() => {
    if (!canReplay && wasPlayedThisSession()) {
      setState("completed");
      return () => {
        clearTimer();
        revokeBlob();
        stopListeningPlayback();
      };
    }

    loadAudio();

    return () => {
      clearTimer();
      stopListeningPlayback();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      revokeBlob();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable serialized payload
  }, [ttsRequestKey, sessionId, canReplay]);

  const startPlayback = useCallback(async () => {
    if (
      state === "playing" ||
      state === "buffering" ||
      state === "completed"
    ) {
      return;
    }

    if (browserModeRef.current) {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        onStartRef.current();
      }
      setUsingDeviceVoice(true);
      setState("playing");
      setElapsed(0);
      clearTimer();
      timerRef.current = setInterval(() => {
        setElapsed((prev) => Math.min(duration, prev + 1));
      }, 1000);
      try {
        await playListeningBrowserFallback(transcript);
        clearTimer();
        setElapsed(duration);
        markPlayed();
        setState("completed");
        onCompleteRef.current();
      } catch {
        clearTimer();
        setErrorMessage("Device voice playback failed. Try again.");
        setState("error");
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      onStartRef.current();
    }

    setState("playing");
    setElapsed(0);

    clearTimer();
    timerRef.current = setInterval(() => {
      if (audioRef.current) {
        const t = Math.floor(audioRef.current.currentTime);
        setElapsed(t);
        const entry = getActiveSpeakerEntryAtTime(
          t,
          speakerTimelineRef.current
        );
        setActiveSpeakerName(entry?.name ?? entry?.speaker ?? null);
      }
    }, 250);

    try {
      await audio.play();
    } catch {
      clearTimer();
      setErrorMessage("Playback was blocked. Check your browser audio settings.");
      setState("error");
    }
  }, [state, clearTimer, transcript, duration, markPlayed]);

  useEffect(() => {
    if (!autoStart) {
      autoStartPendingRef.current = false;
      return;
    }
    if (state !== "ready") {
      autoStartPendingRef.current = true;
      return;
    }
    autoStartPendingRef.current = false;
    void startPlayback();
  }, [autoStart, state, startPlayback]);

  useEffect(() => {
    if (!autoStartPendingRef.current || state !== "ready") return;
    autoStartPendingRef.current = false;
    void startPlayback();
  }, [state, startPlayback]);

  const handleReplayPractice = useCallback(() => {
    if (!canReplay) return;
    clearPlayedFlag();
    hasStartedRef.current = false;
    setElapsed(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setState("ready");
    } else {
      loadAudio();
    }
  }, [canReplay, clearPlayedFlag, loadAudio]);

  const estimatedMinutes = Math.max(1, Math.ceil(duration / 60));
  const progress =
    duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

  if (
    suppressReadyUI &&
    (isExamPresentation || !topBar) &&
    (state === "loading" || state === "ready")
  ) {
    return (
      <div className="sr-only absolute h-0 w-0 overflow-hidden" aria-hidden>
        {state === "loading" ? (
          <span>Loading audio…</span>
        ) : (
          <button type="button" onClick={startPlayback} tabIndex={-1}>
            Preload play
          </button>
        )}
      </div>
    );
  }

  if (isExamPresentation) {
    const statusLabel =
      state === "loading"
        ? "Preparing audio…"
        : state === "ready"
          ? autoStart
            ? `Getting ready — Section ${sectionNumber}`
            : `Ready — Section ${sectionNumber}`
          : state === "buffering"
            ? `Buffering — Section ${sectionNumber}`
            : state === "playing"
              ? usingDeviceVoice
                ? `Playing with device voice — Section ${sectionNumber}`
                : `Now playing Section ${sectionNumber}`
              : state === "completed"
                ? `Section ${sectionNumber} audio complete`
                : "Audio unavailable";

    const showWaveformAnimated =
      state === "playing" || state === "buffering";
    const showWaveformStatic =
      state === "loading" || state === "ready" || state === "completed";

    return (
      <ExamPlayerShell>
        {(showWaveformAnimated || showWaveformStatic) && (
          <ExamWaveformBars animated={showWaveformAnimated} />
        )}

        {state === "loading" && (
          <>
            <p className="mt-6 text-lg font-semibold text-white">{statusLabel}</p>
            <p className="mt-2 text-sm text-slate-400">
              This may take 10–20 seconds
            </p>
          </>
        )}

        {state === "ready" && (
          <>
            <p className="mt-6 text-lg font-semibold text-white">{statusLabel}</p>
            <p
              className="mt-2 font-mono text-base font-bold"
              style={{ color: "#c5a059" }}
            >
              ~{formatTime(duration)}
            </p>
            {autoStart ? (
              <p className="mt-2 text-sm text-slate-400">Starting automatically…</p>
            ) : (
              <button
                type="button"
                onClick={startPlayback}
                className="mt-6 rounded-xl px-6 py-3 text-sm font-bold text-[#05122b] transition-colors hover:opacity-90"
                style={{ backgroundColor: "#c5a059" }}
              >
                Start audio
              </button>
            )}
          </>
        )}

        {(state === "playing" || state === "buffering") && (
          <>
            <p className="mt-6 text-lg font-bold text-white">{statusLabel}</p>
            <p
              className="mt-2 font-mono text-2xl font-bold"
              style={{ color: "#c5a059" }}
            >
              {formatTime(elapsed)}
              <span className="text-base font-normal text-slate-400">
                {" "}
                / ~{formatTime(duration)}
              </span>
            </p>
            <ExamProgressBar progress={progress} />
          </>
        )}

        {state === "completed" && (
          <>
            <CheckIcon className="mx-auto h-12 w-12 text-green-500" />
            <p className="mt-4 text-lg font-bold text-white">{statusLabel}</p>
            <p
              className="mt-2 text-sm font-semibold"
              style={{ color: "#c5a059" }}
            >
              Check your answers below
            </p>
            {canReplay ? (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleReplayPractice}
                  className="rounded-xl border-2 border-white/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#c5a059] hover:text-[#c5a059]"
                >
                  Listen again (practice only)
                </button>
              </div>
            ) : null}
          </>
        )}

        {state === "error" && (
          <>
            <WarningIcon className="mx-auto h-12 w-12 text-red-400" />
            <p className="mt-4 text-lg font-bold text-white">Audio failed to load</p>
            <p className="mt-2 text-sm text-slate-400">
              {errorMessage ?? "Please check your internet connection"}
            </p>
            <button
              type="button"
              onClick={loadAudio}
              className="mt-6 rounded-xl px-6 py-3 text-sm font-bold text-[#05122b] transition-colors hover:opacity-90"
              style={{ backgroundColor: "#c5a059" }}
            >
              Try again
            </button>
          </>
        )}
      </ExamPlayerShell>
    );
  }

  if (topBar) {
    return (
      <div
        className="flex min-h-[52px] max-h-[70px] items-center gap-3 bg-[#0d1b35] px-4 py-2"
        role="region"
        aria-label={`Section ${sectionNumber} audio`}
      >
        <HeadphonesIcon className="h-5 w-5 shrink-0 text-[#c9972c]" />

        <div className="min-w-0 flex-1">
          {state === "loading" && (
            <p className="truncate text-sm font-medium text-white">
              Preparing audio…
            </p>
          )}
          {state === "ready" && (
            <p className="truncate text-sm font-medium text-white">
              Audio ready — starting shortly
            </p>
          )}
          {state === "playing" && (
            <>
              <p className="truncate text-sm font-medium text-white">
                {activeSpeakerName
                  ? `Now speaking: ${activeSpeakerName}`
                  : `Section ${sectionNumber} — playing`}
              </p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#c9972c] transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          )}
          {state === "completed" && (
            <p className="truncate text-sm font-medium text-white">
              Section {sectionNumber} audio complete
            </p>
          )}
          {state === "error" && (
            <p className="truncate text-sm text-red-300">
              {errorMessage ?? "Audio failed"}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          {state === "playing" && (
            <span className="font-mono text-sm font-bold tabular-nums text-[#c9972c]">
              {formatTime(elapsed)}
            </span>
          )}
          {state === "error" && (
            <button
              type="button"
              onClick={loadAudio}
              className="text-xs font-bold text-[#c9972c] hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const wrapperClass = `overflow-hidden rounded-2xl shadow-lg ${compact ? "" : ""}`;

  return (
    <div className={wrapperClass} style={{ backgroundColor: NAVY }}>
      {state === "loading" && (
        <div
          className={`flex flex-col items-center text-center ${
            compact ? "px-4 py-6" : "px-6 py-12"
          }`}
        >
          <span
            className="h-12 w-12 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]"
            aria-hidden
          />
          <p className="mt-6 text-lg font-semibold text-white">
            Preparing your audio…
          </p>
          <p className="mt-2 text-sm text-slate-400">
            This may take 10-20 seconds
          </p>
        </div>
      )}

      {state === "ready" && (
        <div className="p-6">
          <div className="flex items-start gap-3">
            <HeadphonesIcon className="h-8 w-8 shrink-0 text-[#c9972c]" />
            <div>
              <p className="text-lg font-bold text-white">
                Section {sectionNumber} — {sectionTitle}
              </p>
              <p className="mt-1 text-sm text-[#c9972c]">
                Duration: ~{estimatedMinutes}{" "}
                {estimatedMinutes === 1 ? "minute" : "minutes"}
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={startPlayback}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[#c9972c] text-[#0d1b35] shadow-md transition-colors hover:bg-[#d4a84a]"
              aria-label="Play section audio"
            >
              <PlayIcon className="h-10 w-10" />
            </button>
          </div>

          {speakers.length > 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {speakers.map((s) => (
                <span
                  key={s.label}
                  className="flex items-center gap-1.5 text-xs text-slate-300"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getSpeakerDotColor(s.label) }}
                  />
                  {s.label}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 rounded-lg bg-amber-500/20 px-4 py-3 text-sm text-amber-100">
            <p className="font-semibold text-amber-200">
              ⚠ This audio will play once only.
            </p>
            <p className="mt-1 text-amber-100/90">
              You cannot pause or replay it. Make sure your volume is turned up
              before starting.
            </p>
          </div>

          <button
            type="button"
            onClick={startPlayback}
            className="mt-6 w-full rounded-xl bg-[#c9972c] py-3.5 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
          >
            Start Audio
          </button>
        </div>
      )}

      {state === "playing" && (
        <div className={`text-center ${compact ? "px-4 py-6" : "px-6 py-10"}`}>
          <WaveformBars />
          {!compact ? (
            <NowSpeakingIndicator speaker={activeSpeakerName} />
          ) : null}
          <p
            className={`font-bold text-white ${compact ? "mt-3 text-sm" : "mt-6 text-lg"}`}
          >
            Now playing Section {sectionNumber}
          </p>
          <p
            className={`mt-2 font-mono font-bold text-[#c9972c] ${
              compact ? "text-lg" : "text-2xl"
            }`}
          >
            {formatTime(elapsed)}
            <span className="text-base font-normal text-slate-400">
              {" "}
              / ~{formatTime(duration)}
            </span>
          </p>
          <div className="mx-auto mt-4 h-1 max-w-md overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#c9972c] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {state === "completed" && (
        <div className={`text-center ${compact ? "px-4 py-6" : "px-6 py-10"}`}>
          <CheckIcon
            className={`mx-auto text-green-500 ${compact ? "h-10 w-10" : "h-16 w-16"}`}
          />
          <p
            className={`font-bold text-white ${compact ? "mt-2 text-sm" : "mt-4 text-xl"}`}
          >
            Section {sectionNumber} audio complete
          </p>
          <p className="mt-2 text-sm font-semibold text-[#c9972c]">
            Check your answers below
          </p>

          {canReplay ? (
            <div className="mt-8">
              <button
                type="button"
                onClick={handleReplayPractice}
                className="rounded-xl border-2 border-white/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#c9972c] hover:text-[#c9972c]"
              >
                Listen again (practice only)
              </button>
              <p className="mt-2 text-xs text-slate-400">
                In the real exam you cannot replay
              </p>
            </div>
          ) : (
            <button
              type="button"
              disabled
              className="mt-8 cursor-not-allowed rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-500"
            >
              Audio played
            </button>
          )}
        </div>
      )}

      {state === "error" && (
        <div className="px-6 py-10 text-center">
          <WarningIcon className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-4 text-lg font-bold text-white">Audio failed to load</p>
          <p className="mt-2 text-sm text-slate-400">
            {errorMessage ?? "Please check your internet connection"}
          </p>
          <button
            type="button"
            onClick={loadAudio}
            className="mt-6 rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
          >
            Try Again
          </button>
        </div>
      )}

    </div>
  );
}
