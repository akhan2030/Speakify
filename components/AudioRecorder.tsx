"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioRecorderProps = {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onTranscriptReady: (transcript: string) => void;
  onElapsedChange?: (seconds: number) => void;
  maxDuration?: number;
  minDuration?: number;
  disabled?: boolean;
  autoSubmit?: boolean;
};

type RecorderState = "idle" | "recording" | "processing" | "complete" | "error";
type PermissionState = "checking" | "granted" | "prompt" | "denied" | "unsupported";

const WARNING_SECONDS = 30;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-1.08A7 7 0 0 0 19 11Z" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
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
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function WaveformBars() {
  return (
    <div className="flex h-12 items-end justify-center gap-1" aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-[#E24B4A] animate-pulse"
          style={{
            height: `${28 + (i % 3) * 18}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: "0.8s",
          }}
        />
      ))}
    </div>
  );
}

export default function AudioRecorder({
  onRecordingComplete,
  onTranscriptReady,
  onElapsedChange,
  maxDuration = 120,
  minDuration = 10,
  disabled = false,
  autoSubmit = false,
}: AudioRecorderProps) {
  const [permission, setPermission] = useState<PermissionState>("checking");
  const [state, setState] = useState<RecorderState>("idle");
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const maxDurationRef = useRef(maxDuration);

  maxDurationRef.current = maxDuration;

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetToIdle = useCallback(() => {
    clearTimer();
    stopStream();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setElapsed(0);
    setTranscript("");
    setAudioBlob(null);
    setRecordedDuration(0);
    setErrorMessage(null);
    setState("idle");
  }, [clearTimer, stopStream]);

  const checkMicrophonePermission = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermission("unsupported");
      return;
    }

    try {
      if (navigator.permissions?.query) {
        const result = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (result.state === "granted") {
          setPermission("granted");
          return;
        }
        // Do not treat "denied" from the Permissions API alone — wait for getUserMedia
        // on a user click so Chrome can still show the allow prompt when possible.
        setPermission("prompt");
        result.onchange = () => {
          if (result.state === "granted") {
            setPermission("granted");
          }
        };
        return;
      }
      setPermission("prompt");
    } catch {
      setPermission("prompt");
    }
  }, []);

  useEffect(() => {
    checkMicrophonePermission();
    const timeout = window.setTimeout(() => {
      setPermission((current) => (current === "checking" ? "prompt" : current));
    }, 2500);
    return () => {
      window.clearTimeout(timeout);
      clearTimer();
      stopStream();
    };
  }, [checkMicrophonePermission, clearTimer, stopStream]);

  const transcribeAudio = useCallback(
    async (blob: Blob, duration: number) => {
      setState("processing");
      setErrorMessage(null);

      try {
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");

        const res = await fetch("/api/speaking/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.transcript) {
          throw new Error(data?.error ?? "Transcription failed. Please try again.");
        }

        const text = String(data.transcript).trim();
        setTranscript(text);
        setAudioBlob(blob);
        setRecordedDuration(duration);
        onTranscriptReady(text);
        setState("complete");

        if (autoSubmit) {
          onRecordingComplete(blob, duration);
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Transcription failed. Please try again."
        );
        setState("error");
      }
    },
    [autoSubmit, onRecordingComplete, onTranscriptReady]
  );

  const stopRecording = useCallback(() => {
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    const duration = Math.max(
      0,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    );

    if (duration < minDuration) {
      recorder.stop();
      stopStream();
      chunksRef.current = [];
      setElapsed(0);
      setState("error");
      setErrorMessage(
        `Recording too short. Please speak for at least ${minDuration} seconds.`
      );
      return;
    }

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      stopStream();
      chunksRef.current = [];
      transcribeAudio(blob, duration);
    };

    recorder.stop();
    setElapsed(duration);
  }, [clearTimer, minDuration, stopStream, transcribeAudio]);

  const startRecording = useCallback(async () => {
    if (disabled) return;

    setErrorMessage(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermission("granted");

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setState("error");
        setErrorMessage("Recording failed. Please try again.");
        clearTimer();
        stopStream();
      };

      recorder.start(250);
      startTimeRef.current = Date.now();
      setElapsed(0);
      setState("recording");

      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(seconds);
        onElapsedChange?.(seconds);

        if (seconds >= maxDurationRef.current) {
          stopRecording();
        }
      }, 250);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setPermission("denied");
        setErrorMessage(
          "Microphone access denied. Please enable it in your browser settings."
        );
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Could not access microphone."
        );
      }
      setState("error");
    }
  }, [disabled, clearTimer, stopStream, stopRecording, onElapsedChange]);

  const requestPermission = useCallback(async () => {
    setErrorMessage(null);
    setRequestingPermission(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermission("granted");
      setState("idle");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setPermission("prompt");
        setErrorMessage(
          "No microphone found. Plug in or enable your mic in Windows Settings, then try again."
        );
        setState("error");
        return;
      }
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setPermission("denied");
        setErrorMessage(
          "Microphone blocked for this site. Follow the steps below, then click Try again."
        );
        setState("idle");
        return;
      }
      setPermission("prompt");
      setErrorMessage(
        err instanceof Error ? err.message : "Could not access microphone."
      );
      setState("error");
    } finally {
      setRequestingPermission(false);
    }
  }, []);

  const handleUseRecording = useCallback(() => {
    if (audioBlob && recordedDuration > 0) {
      onRecordingComplete(audioBlob, recordedDuration);
    }
  }, [audioBlob, recordedDuration, onRecordingComplete]);

  const secondsRemaining = maxDuration - elapsed;
  const showTimeWarning =
    state === "recording" && secondsRemaining <= WARNING_SECONDS && secondsRemaining > 0;

  const isDisabled = disabled || permission === "unsupported";

  if (permission === "checking") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
        <p className="mt-4 text-sm text-slate-500">Checking microphone access…</p>
      </div>
    );
  }

  if (permission === "unsupported") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <WarningIcon className="mx-auto h-10 w-10 text-[#E24B4A]" />
        <p className="mt-4 text-sm font-medium text-[#E24B4A]">
          Audio recording is not supported in this browser.
        </p>
      </div>
    );
  }

  if (permission === "prompt" || permission === "denied") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <MicrophoneIcon className="mx-auto h-12 w-12 text-[#c9972c]" />
        <h3 className="mt-4 text-lg font-bold text-[#0d1b35]">Microphone access required</h3>
        <p className="mt-2 text-sm text-slate-500">
          {permission === "denied"
            ? "Chrome has blocked the microphone for localhost. Reset it using the steps below."
            : "Click the button — Chrome will ask you to allow the microphone for this site."}
        </p>

        {permission === "denied" ? (
          <ol className="mt-5 space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-left text-sm text-slate-700">
            <li>
              <strong>1.</strong> Click the <strong>lock / tune icon</strong> left of the
              address bar (where it says localhost:3000)
            </li>
            <li>
              <strong>2.</strong> Set <strong>Microphone</strong> to <strong>Allow</strong>
            </li>
            <li>
              <strong>3.</strong> Reload this page, then click <strong>Try again</strong>
            </li>
            <li className="text-xs text-slate-500">
              Windows: Settings → Privacy → Microphone → allow access for desktop apps &
              Chrome
            </li>
          </ol>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={requestPermission}
          disabled={isDisabled || requestingPermission}
          className="mt-6 rounded-xl bg-[#c9972c] px-8 py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {requestingPermission
            ? "Requesting access…"
            : permission === "denied"
              ? "Try again"
              : "Enable Microphone"}
        </button>

        {permission === "denied" ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 block w-full text-sm font-semibold text-[#0d9488] hover:underline"
          >
            Reload page after changing settings
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      {state === "idle" && (
        <div className="flex flex-col items-center text-center">
          <MicrophoneIcon className="h-12 w-12 text-[#c9972c]" />
          <p className="mt-4 text-sm text-slate-500">Click to start recording</p>
          <button
            type="button"
            onClick={startRecording}
            disabled={isDisabled}
            aria-label="Start recording"
            className="mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#c9972c] text-[#0d1b35] shadow-lg transition-transform hover:scale-105 hover:bg-[#b8862b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MicrophoneIcon className="h-10 w-10" />
          </button>
          <p className="mt-4 text-xs text-slate-400">
            Make sure your microphone is enabled
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Speak for {minDuration}–{maxDuration} seconds
          </p>
        </div>
      )}

      {state === "recording" && (
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#E24B4A]/30" />
            <span className="absolute inset-2 animate-pulse rounded-full bg-[#E24B4A]/20" />
            <MicrophoneIcon className="relative h-10 w-10 text-[#E24B4A]" />
          </div>
          <p className="mt-4 text-base font-bold text-[#E24B4A]">Recording…</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#0d1b35]">
            {formatTime(elapsed)}
          </p>
          <div className="mt-4 w-full">
            <WaveformBars />
          </div>
          {showTimeWarning ? (
            <p className="mt-3 text-sm font-semibold text-amber-600">
              {secondsRemaining} second{secondsRemaining === 1 ? "" : "s"} remaining
            </p>
          ) : null}
          <button
            type="button"
            onClick={stopRecording}
            className="mt-6 flex items-center gap-2 rounded-xl bg-[#E24B4A] px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-[#c93d3c]"
          >
            <span className="inline-block h-4 w-4 rounded-sm bg-white" aria-hidden />
            Stop Recording
          </button>
        </div>
      )}

      {state === "processing" && (
        <div className="flex flex-col items-center text-center py-4">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
          <p className="mt-6 text-base font-semibold text-[#0d1b35]">
            Transcribing your speech…
          </p>
          <p className="mt-2 text-sm text-slate-500">This takes a few seconds</p>
        </div>
      )}

      {state === "complete" && (
        <div className="flex flex-col items-center text-center">
          <CheckIcon className="h-12 w-12 text-green-600" />
          <p className="mt-3 text-base font-bold text-green-700">Recording complete</p>
          <div className="mt-6 w-full rounded-xl border border-blue-100 bg-blue-50 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0d1b35]">
              What we heard:
            </p>
            <p className="mt-2 text-sm italic text-slate-600">
              {transcript || "No speech detected."}
            </p>
          </div>
          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleUseRecording}
              className="flex-1 rounded-xl bg-[#c9972c] px-4 py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
            >
              Use this recording
            </button>
            <button
              type="button"
              onClick={resetToIdle}
              className="flex-1 rounded-xl border-2 border-[#0d1b35] px-4 py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#0d1b35] hover:text-white"
            >
              Re-record
            </button>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="flex flex-col items-center text-center">
          <WarningIcon className="h-12 w-12 text-[#E24B4A]" />
          <p className="mt-4 text-sm font-medium text-[#E24B4A]">
            {errorMessage ?? "Something went wrong. Please try again."}
          </p>
          <button
            type="button"
            onClick={resetToIdle}
            className="mt-6 rounded-xl bg-[#0d1b35] px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-[#152a4d]"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
