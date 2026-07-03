/**
 * Natural turn-taking for IELTS speaking (Phase 1).
 *
 * Sarah finishes → thinking pause (4–6s) → mic arms (listening pulse)
 * → VAD detects speech onset (official timer starts)
 * → "I'm done" OR ~2.8s silence after speech → submit recording
 *
 * MediaRecorder captures audio; @ricky0123/vad-web only signals speech/silence.
 */

export type TurnState =
  | "idle"
  | "thinking"
  | "listening"
  | "speaking"
  | "processing";

export const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export function thinkingPauseMs() {
  return 4000 + Math.floor(Math.random() * 2000);
}

export const SILENCE_AUTO_STOP_MS = 2800;
export const POST_TTS_MUTE_MS = 300;

const VAD_ASSET_BASE =
  "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/";
const ORT_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/";

export type TurnTakingCallbacks = {
  onStateChange: (state: TurnState) => void;
  onSpeechStart: () => void;
  onAnswerReady: (blob: Blob, durationMs: number) => void;
  onError: (message: string) => void;
};

export type TurnTakingController = {
  armAfterExaminer: () => void;
  cancelArm: () => void;
  stopManual: () => Promise<void>;
  destroy: () => Promise<void>;
  getState: () => TurnState;
};

export async function createTurnTakingController(
  callbacks: TurnTakingCallbacks
): Promise<TurnTakingController> {
  const { MicVAD } = await import("@ricky0123/vad-web");

  let state: TurnState = "idle";
  let vad: Awaited<ReturnType<typeof MicVAD.new>> | null = null;
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];
  let armTimer: ReturnType<typeof setTimeout> | null = null;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let muteUntil = 0;
  let speechStartedAt = 0;
  let recordStartedAt = 0;
  let hasSpeechSegment = false;
  let destroyed = false;
  let submitting = false;

  const setState = (next: TurnState) => {
    state = next;
    callbacks.onStateChange(next);
  };

  const clearArmTimer = () => {
    if (armTimer) {
      clearTimeout(armTimer);
      armTimer = null;
    }
  };

  const clearSilenceTimer = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  };

  const releaseStream = () => {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  };

  const stopVad = async () => {
    if (!vad) return;
    try {
      vad.pause();
    } catch {
      /* noop */
    }
    try {
      await vad.destroy();
    } catch {
      /* noop */
    }
    vad = null;
  };

  const finalizeRecording = async (reason: "silence" | "manual") => {
    if (submitting || destroyed) return;
    submitting = true;
    clearSilenceTimer();
    clearArmTimer();

    const hadSpeech = hasSpeechSegment;
    const started = speechStartedAt || recordStartedAt;
    const durationMs = started ? Math.max(400, Date.now() - started) : 400;

    await stopVad();

    const rec = recorder;
    recorder = null;

    const blob = await new Promise<Blob | null>((resolve) => {
      if (!rec || rec.state === "inactive") {
        resolve(chunks.length ? new Blob(chunks, { type: "audio/webm" }) : null);
        return;
      }
      rec.onstop = () => {
        const mime = rec.mimeType || "audio/webm";
        resolve(chunks.length ? new Blob(chunks, { type: mime }) : null);
      };
      try {
        rec.stop();
      } catch {
        resolve(null);
      }
    });

    chunks = [];
    releaseStream();
    hasSpeechSegment = false;
    speechStartedAt = 0;
    recordStartedAt = 0;

    if (!hadSpeech || !blob || blob.size < 500) {
      callbacks.onError(
        reason === "manual"
          ? "We didn't detect any speech — check your microphone and speak your answer."
          : "We didn't detect any speech — check your microphone."
      );
      setState("idle");
      submitting = false;
      return;
    }

    setState("processing");
    callbacks.onAnswerReady(blob, durationMs);
    submitting = false;
    setState("idle");
  };

  const markSpeechStart = () => {
    if (Date.now() < muteUntil) return;
    clearSilenceTimer();
    if (!hasSpeechSegment) {
      hasSpeechSegment = true;
      speechStartedAt = Date.now();
      callbacks.onSpeechStart();
    }
    setState("speaking");
  };

  const markPossibleSilence = () => {
    if (!hasSpeechSegment || submitting) return;
    clearSilenceTimer();
    silenceTimer = setTimeout(() => {
      silenceTimer = null;
      void finalizeRecording("silence");
    }, SILENCE_AUTO_STOP_MS);
  };

  const startListening = async () => {
    if (destroyed || submitting) return;
    await stopVad();
    releaseStream();
    chunks = [];
    hasSpeechSegment = false;
    speechStartedAt = 0;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recordStartedAt = Date.now();
      recorder.start(250);

      vad = await MicVAD.new({
        baseAssetPath: VAD_ASSET_BASE,
        onnxWASMBasePath: ORT_WASM_BASE,
        redemptionMs: SILENCE_AUTO_STOP_MS,
        positiveSpeechThreshold: 0.6,
        negativeSpeechThreshold: 0.35,
        minSpeechMs: 250,
        submitUserSpeechOnPause: true,
        startOnLoad: false,
        // Share the MediaRecorder stream so we only open the mic once.
        getStream: async () => stream as MediaStream,
        pauseStream: async () => {
          /* keep tracks alive for MediaRecorder */
        },
        resumeStream: async (existing) => existing,
        onSpeechStart: () => {
          markSpeechStart();
        },
        onSpeechEnd: () => {
          // Utterance-level end from Silero — treat as silence candidate.
          markPossibleSilence();
        },
        onVADMisfire: () => {
          if (!hasSpeechSegment && state === "speaking") {
            setState("listening");
          }
        },
      });

      await vad.start();
      setState("listening");
    } catch (err) {
      console.error("[turnTaking] start failed", err);
      await stopVad();
      releaseStream();
      recorder = null;
      callbacks.onError(
        "Could not start listening. Allow microphone access and try again."
      );
      setState("idle");
    }
  };

  return {
    getState: () => state,

    armAfterExaminer: () => {
      if (destroyed || submitting) return;
      clearArmTimer();
      clearSilenceTimer();
      void stopVad();
      if (recorder?.state === "recording") {
        try {
          recorder.stop();
        } catch {
          /* noop */
        }
      }
      recorder = null;
      releaseStream();
      chunks = [];
      hasSpeechSegment = false;

      muteUntil = Date.now() + POST_TTS_MUTE_MS;
      setState("thinking");

      const pause = thinkingPauseMs();
      armTimer = setTimeout(() => {
        armTimer = null;
        void startListening();
      }, POST_TTS_MUTE_MS + pause);
    },

    cancelArm: () => {
      clearArmTimer();
      clearSilenceTimer();
      void stopVad();
      if (recorder?.state === "recording") {
        try {
          recorder.stop();
        } catch {
          /* noop */
        }
      }
      recorder = null;
      releaseStream();
      chunks = [];
      hasSpeechSegment = false;
      if (state !== "processing") setState("idle");
    },

    stopManual: async () => {
      await finalizeRecording("manual");
    },

    destroy: async () => {
      destroyed = true;
      clearArmTimer();
      clearSilenceTimer();
      await stopVad();
      if (recorder?.state === "recording") {
        try {
          recorder.stop();
        } catch {
          /* noop */
        }
      }
      recorder = null;
      releaseStream();
      setState("idle");
    },
  };
}
