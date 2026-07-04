/**
 * Natural turn-taking for IELTS speaking (Phase 1).
 *
 * Sarah finishes → thinking pause (4–6s) → mic arms (listening)
 * → speech onset starts official timer
 * → "I'm done" OR ~2.8s silence after speech → submit
 *
 * MediaRecorder always captures. VAD is preferred for speech/silence signals;
 * if VAD fails to load, an AnalyserNode energy monitor is used instead.
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

/** Prefer enhanced constraints; fall back to plain audio if the device rejects them. */
export async function getUserMediaWithFallback(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
  } catch (enhancedError) {
    console.warn(
      "[turnTaking] enhanced audio constraints failed, falling back to { audio: true }",
      enhancedError
    );
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

export function thinkingPauseMs() {
  // Short pause so auto-arm feels natural but stays reliable.
  return 1200 + Math.floor(Math.random() * 800); // 1.2–2.0s
}

export const SILENCE_AUTO_STOP_MS = 2800;
export const POST_TTS_MUTE_MS = 300;
/** If still thinking after this, force mic arm or surface an error. */
export const THINKING_WATCHDOG_MS = 4000;

const VAD_ASSET_BASE =
  "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/";
const ORT_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/";

const ENERGY_SPEECH_THRESHOLD = 0.045;

export type TurnTakingCallbacks = {
  onStateChange: (state: TurnState) => void;
  onSpeechStart: () => void;
  onAnswerReady: (blob: Blob, durationMs: number) => void;
  onError: (message: string) => void;
};

export type TurnTakingController = {
  armAfterExaminer: () => void;
  /** Skip the thinking pause and arm the mic immediately. */
  forceListenNow: () => void;
  cancelArm: () => void;
  stopManual: () => Promise<void>;
  destroy: () => Promise<void>;
  getState: () => TurnState;
};

type MicVadCtor = {
  new: (options: Record<string, unknown>) => Promise<{
    start: () => Promise<void>;
    pause: () => Promise<void>;
    destroy: () => Promise<void>;
  }>;
};

/**
 * Returns a controller immediately (does not wait on VAD CDN load).
 */
export function createTurnTakingController(
  callbacks: TurnTakingCallbacks
): TurnTakingController {
  let state: TurnState = "idle";
  let vad: {
    start: () => Promise<void>;
    pause: () => Promise<void>;
    destroy: () => Promise<void>;
  } | null = null;
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];
  let armTimer: ReturnType<typeof setTimeout> | null = null;
  let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let energyRaf: number | null = null;
  let audioContext: AudioContext | null = null;
  let muteUntil = 0;
  let speechStartedAt = 0;
  let recordStartedAt = 0;
  let lastLoudAt = 0;
  let hasSpeechSegment = false;
  let destroyed = false;
  let submitting = false;
  let armGeneration = 0;
  let micVadCtor: MicVadCtor | null | undefined;
  let micVadLoad: Promise<MicVadCtor | null> | null = null;

  const log = (event: string, extra?: Record<string, unknown>) => {
    console.info("[turnTaking]", event, { state, ...extra });
  };

  const setState = (next: TurnState) => {
    if (state === next) return;
    log(`state ${state} → ${next}`);
    state = next;
    callbacks.onStateChange(next);
  };

  const clearArmTimer = () => {
    if (armTimer) {
      clearTimeout(armTimer);
      armTimer = null;
    }
  };

  const clearWatchdog = () => {
    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
  };

  const clearSilenceTimer = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  };

  const stopEnergyMonitor = () => {
    if (energyRaf != null) {
      cancelAnimationFrame(energyRaf);
      energyRaf = null;
    }
    if (audioContext) {
      void audioContext.close().catch(() => undefined);
      audioContext = null;
    }
  };

  const releaseStream = () => {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  };

  const stopVad = async () => {
    if (!vad) return;
    try {
      await vad.pause();
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

  const loadMicVad = async (): Promise<MicVadCtor | null> => {
    if (micVadCtor !== undefined) return micVadCtor;
    if (!micVadLoad) {
      micVadLoad = import("@ricky0123/vad-web")
        .then((mod) => {
          micVadCtor = mod.MicVAD as unknown as MicVadCtor;
          return micVadCtor;
        })
        .catch((err) => {
          console.warn("[turnTaking] VAD module failed to load — using energy fallback", err);
          micVadCtor = null;
          return null;
        });
    }
    return micVadLoad;
  };

  const finalizeRecording = async (reason: "silence" | "manual") => {
    if (submitting || destroyed) return;
    submitting = true;
    clearSilenceTimer();
    clearArmTimer();
    clearWatchdog();
    stopEnergyMonitor();

    const hadSpeech = hasSpeechSegment;
    const started = speechStartedAt || recordStartedAt;
    const durationMs = started ? Math.max(400, Date.now() - started) : 400;

    log("finalizeRecording", { reason, hadSpeech, durationMs });

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
    lastLoudAt = 0;

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
    lastLoudAt = Date.now();
    if (!hasSpeechSegment) {
      hasSpeechSegment = true;
      speechStartedAt = Date.now();
      log("speechStart");
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

  const startEnergyMonitor = (mediaStream: MediaStream) => {
    stopEnergyMonitor();
    try {
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);

      const tick = () => {
        if (destroyed || submitting || !stream) return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);

        if (rms >= ENERGY_SPEECH_THRESHOLD) {
          markSpeechStart();
        } else if (hasSpeechSegment && Date.now() - lastLoudAt >= SILENCE_AUTO_STOP_MS) {
          void finalizeRecording("silence");
          return;
        }

        energyRaf = requestAnimationFrame(tick);
      };

      energyRaf = requestAnimationFrame(tick);
      log("energyMonitor started");
    } catch (err) {
      console.warn("[turnTaking] energy monitor failed", err);
      // Without VAD or energy, student can still use "I'm done".
      // Auto-mark speech after a short grace so silence auto-stop can work on timer.
      setTimeout(() => {
        if (!destroyed && state === "listening") {
          markSpeechStart();
        }
      }, 800);
    }
  };

  const startListening = async (generation: number) => {
    if (destroyed || submitting) return;
    if (generation !== armGeneration) {
      log("startListening aborted — stale generation", { generation, armGeneration });
      return;
    }

    log("startListening begin");
    await stopVad();
    stopEnergyMonitor();
    releaseStream();
    chunks = [];
    hasSpeechSegment = false;
    speechStartedAt = 0;
    lastLoudAt = 0;

    try {
      stream = await getUserMediaWithFallback();

      if (generation !== armGeneration || destroyed) {
        releaseStream();
        return;
      }

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

      // Arm listening immediately — do not block on VAD CDN/WASM.
      clearWatchdog();
      setState("listening");
      log("mic armed (listening)");

      const MicVAD = await loadMicVad();
      if (generation !== armGeneration || destroyed || !stream) return;

      if (MicVAD) {
        try {
          vad = await MicVAD.new({
            baseAssetPath: VAD_ASSET_BASE,
            onnxWASMBasePath: ORT_WASM_BASE,
            redemptionMs: SILENCE_AUTO_STOP_MS,
            positiveSpeechThreshold: 0.6,
            negativeSpeechThreshold: 0.35,
            minSpeechMs: 250,
            submitUserSpeechOnPause: true,
            startOnLoad: false,
            getStream: async () => stream as MediaStream,
            pauseStream: async () => {
              /* keep tracks alive for MediaRecorder */
            },
            resumeStream: async (existing: MediaStream) => existing,
            onSpeechStart: () => {
              markSpeechStart();
            },
            onSpeechEnd: () => {
              markPossibleSilence();
            },
            onVADMisfire: () => {
              if (!hasSpeechSegment && state === "speaking") {
                setState("listening");
              }
            },
          });
          await vad.start();
          log("VAD started");
          return;
        } catch (err) {
          console.warn("[turnTaking] VAD start failed — energy fallback", err);
          vad = null;
        }
      }

      startEnergyMonitor(stream);
    } catch (err) {
      console.error("[turnTaking] startListening failed", err);
      await stopVad();
      stopEnergyMonitor();
      releaseStream();
      recorder = null;
      callbacks.onError(
        "Could not start listening. Allow microphone access and try again."
      );
      setState("idle");
    }
  };

  const armAfterExaminer = () => {
    if (destroyed || submitting) {
      log("armAfterExaminer ignored", { destroyed, submitting });
      return;
    }

    armGeneration += 1;
    const generation = armGeneration;
    log("armAfterExaminer", { generation });

    clearArmTimer();
    clearWatchdog();
    clearSilenceTimer();
    stopEnergyMonitor();
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
      log("thinking timer fired", { generation, pause });
      void startListening(generation);
    }, POST_TTS_MUTE_MS + pause);

    // Hard fallback: never stay in thinking forever.
    watchdogTimer = setTimeout(() => {
      watchdogTimer = null;
      if (destroyed || generation !== armGeneration) return;
      if (state === "thinking") {
        console.error(
          "[turnTaking] thinking watchdog — forcing mic arm after",
          THINKING_WATCHDOG_MS,
          "ms"
        );
        clearArmTimer();
        void startListening(generation);
      }
    }, THINKING_WATCHDOG_MS);
  };

  return {
    getState: () => state,

    armAfterExaminer,

    forceListenNow: () => {
      if (destroyed || submitting) return;
      armGeneration += 1;
      const generation = armGeneration;
      log("forceListenNow", { generation });
      clearArmTimer();
      clearWatchdog();
      muteUntil = Date.now() + POST_TTS_MUTE_MS;
      setState("thinking");
      // Short mute only — no 4–6s pause.
      armTimer = setTimeout(() => {
        armTimer = null;
        void startListening(generation);
      }, POST_TTS_MUTE_MS);
    },

    cancelArm: () => {
      log("cancelArm");
      armGeneration += 1;
      clearArmTimer();
      clearWatchdog();
      clearSilenceTimer();
      stopEnergyMonitor();
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
      log("stopManual");
      await finalizeRecording("manual");
    },

    destroy: async () => {
      log("destroy");
      destroyed = true;
      armGeneration += 1;
      clearArmTimer();
      clearWatchdog();
      clearSilenceTimer();
      stopEnergyMonitor();
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
