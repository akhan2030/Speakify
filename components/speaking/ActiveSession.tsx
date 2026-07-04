"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speakSarahExaminer, stopBrowserSpeech } from "@/lib/browserSpeech";
import { checkMicrophoneAccess } from "@/lib/speaking/checkMicrophone";
import { fetchPart3Questions } from "@/lib/speaking/fetchPart3Questions";
import { buildPart3TransitionSpeech } from "@/lib/speaking/part3Generation";
import {
  MIN_SPEAKING_SECONDS,
  hasValidSpeechInput,
  isLikelyRealStudentSpeech,
} from "@/lib/speaking/validateSpeechInput";
import {
  AUDIO_CONSTRAINTS,
  createTurnTakingController,
  type TurnState,
  type TurnTakingController,
} from "@/lib/speaking/turnTakingRecorder";

type Part = 1 | 2 | 3;

type HistoryEntry = { role: "student" | "examiner"; text: string; part?: Part };

type CueCard = {
  id: string;
  topic: string;
  prompt: string;
  bullets: string[];
  closing: string;
};

const PART_LABELS: Record<Part, string> = {
  1: "Personal Questions",
  2: "Long Turn",
  3: "Discussion",
};

function cueCardPayload(card: CueCard) {
  return {
    id: card.id,
    title: card.topic,
    prompt: card.prompt,
    bullets: card.bullets,
    closing: card.closing,
  };
}

function buildPart2PracticeIntro(card: CueCard) {
  const bullets = card.bullets.join(", ");
  return `Now I'm going to give you a topic. I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. You can make some notes if you wish. ${card.prompt} You should say: ${bullets}, and ${card.closing} You have one minute to prepare. You may make notes if you wish.`;
}

const PART_GUIDES: Record<
  Part,
  { title: string; duration: string; whatHappens: string; tips: string[] }
> = {
  1: {
    title: "Part 1 — Personal Questions",
    duration: "4–5 minutes",
    whatHappens:
      "Sarah asks short questions about familiar topics: your home, work or studies, hobbies, food, and daily life. She will ask follow-up questions based on your answers.",
    tips: [
      "Give 2–4 sentence answers — not one word, not a long speech",
      "After Sarah finishes, wait a moment — the mic arms automatically",
      "Speak naturally, then tap I'm done (or pause and it will submit)",
    ],
  },
  2: {
    title: "Part 2 — Cue Card (Long Turn)",
    duration: "3–4 minutes (1 min prep + 2 min speaking)",
    whatHappens:
      "Sarah gives you a cue card topic. You get 60 seconds to prepare notes, then speak for up to 2 minutes without interruption.",
    tips: [
      "Use the prep time to jot quick notes — they are not submitted",
      "Cover all bullet points on the cue card",
      "Recording starts automatically when prep time ends",
    ],
  },
  3: {
    title: "Part 3 — Discussion",
    duration: "4–5 minutes",
    whatHappens:
      "Sarah asks deeper, abstract questions linked to your Part 2 topic — opinions, comparisons, and society-level ideas.",
    tips: [
      "Explain your opinion and give reasons or examples",
      "It is fine to say \"That's an interesting question\" while you think",
      "Mic arms automatically — tap I'm done when you finish each answer",
    ],
  },
};
function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ActiveSession({
  sessionId,
  sessionNumber,
  currentPart,
  setCurrentPart,
  conversationHistory,
  setConversationHistory,
  examinerSpeech,
  setExaminerSpeech,
  isListening,
  setIsListening,
  isExaminerSpeaking,
  setIsExaminerSpeaking,
  transcript,
  setTranscript,
  cueCard,
  part2Timer,
  setPart2Timer,
  part2Phase,
  setPart2Phase,
  sessionStatus,
  setSessionStatus,
  sessionType,
  studentId,
  onComplete,
}: {
  sessionId: string | null;
  sessionNumber: number;
  currentPart: Part;
  setCurrentPart: (p: Part) => void;
  conversationHistory: HistoryEntry[];
  setConversationHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  examinerSpeech: string;
  setExaminerSpeech: (s: string) => void;
  isListening: boolean;
  setIsListening: (v: boolean) => void;
  isExaminerSpeaking: boolean;
  setIsExaminerSpeaking: (v: boolean) => void;
  transcript: string;
  setTranscript: (s: string) => void;
  cueCard: CueCard | null;
  part2Timer: number | null;
  setPart2Timer: (n: number | null) => void;
  part2Phase: "prep" | "speaking" | "done";
  setPart2Phase: (p: "prep" | "speaking" | "done") => void;
  sessionStatus: "idle" | "active" | "scoring" | "complete";
  setSessionStatus: (s: "idle" | "active" | "scoring" | "complete") => void;
  sessionType: "practice" | "mock";
  studentId?: string;
  onComplete: (feedback: unknown) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [prepNotes, setPrepNotes] = useState("");
  const [displayedSpeech, setDisplayedSpeech] = useState("");
  const [part2Pulse, setPart2Pulse] = useState(false);
  const [viewPart, setViewPart] = useState<Part>(1);
  const [micError, setMicError] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [microphoneGranted, setMicrophoneGranted] = useState(false);
  const [totalSpeakingSeconds, setTotalSpeakingSeconds] = useState(0);
  const [testEnded, setTestEnded] = useState(false);
  const [micGateError, setMicGateError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sarahThinking, setSarahThinking] = useState(false);
  const [part3Questions, setPart3Questions] = useState<string[]>([]);
  const [part3Generating, setPart3Generating] = useState(false);
  const [turnState, setTurnState] = useState<TurnState>("idle");
  const [answerSeconds, setAnswerSeconds] = useState(0);
  /**
   * Part 2 mic status:
   * arming = requesting permission
   * ready = stream open, waiting for Sarah (do not speak yet)
   * live = MediaRecorder actively capturing
   */
  const [part2MicStatus, setPart2MicStatus] = useState<
    "idle" | "arming" | "ready" | "live" | "error"
  >("idle");
  const part2ArmingRef = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const turnControllerRef = useRef<TurnTakingController | null>(null);
  const processRecordedAudioRef = useRef<
    (blob: Blob, durationMs: number, mode: "manual" | "part2") => Promise<void>
  >(async () => {});
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const testEndedRef = useRef(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartRef = useRef(0);
  const transcriptRef = useRef("");
  const part2TranscriptRef = useRef("");
  const part2MetaRef = useRef<{
    words?: { word: string; start: number; end: number; confidence?: number }[];
    speakingDurationMs?: number;
  }>({});
  const openedRef = useRef(false);
  const processingRef = useRef(false);
  const isExaminerSpeakingRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const currentPartRef = useRef(currentPart);
  const part2PhaseRef = useRef(part2Phase);
  const recordingModeRef = useRef<"manual" | "part2" | null>(null);
  const sendStudentMessageRef = useRef<
    (
      text: string,
      meta?: {
        words?: { word: string; start: number; end: number; confidence?: number }[];
        speakingDurationMs?: number;
      }
    ) => Promise<void>
  >(async () => {});
  const totalSpeakingSecondsRef = useRef(0);

  useEffect(() => {
    currentPartRef.current = currentPart;
    if (sessionType === "mock") {
      setViewPart((v) => (currentPart > v ? currentPart : v));
    } else {
      setViewPart(currentPart);
    }
  }, [currentPart, sessionType]);

  useEffect(() => {
    part2PhaseRef.current = part2Phase;
  }, [part2Phase]);

  useEffect(() => {
    isExaminerSpeakingRef.current = isExaminerSpeaking;
  }, [isExaminerSpeaking]);

  const clearRecordTimer = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  }, []);

  const releaseMicStream = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
  }, []);

  const transcribeBlob = useCallback(
    async (
      blob: Blob
    ): Promise<{
      text: string;
      words: { word: string; start: number; end: number; confidence?: number }[];
      duration?: number;
    }> => {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      console.time("[speaking] STT call");
      try {
        const res = await fetch("/api/speaking/transcribe", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Transcription failed");
        }
        return {
          text: String(data.transcript ?? "").trim(),
          words: Array.isArray(data.words) ? data.words : [],
          duration: data.duration != null ? Number(data.duration) : undefined,
        };
      } finally {
        console.timeEnd("[speaking] STT call");
      }
    },
    []
  );

  const processRecordedAudio = useCallback(
    async (blob: Blob, durationMs: number, mode: "manual" | "part2") => {
      if (blob.size < 500 || durationMs < 700) {
        setMicError("Recording too short. Tap the mic, speak for a few seconds, then tap again.");
        return;
      }

      setIsProcessing(true);
      setTranscript("Transcribing your answer…");

      const recoverAfterFailure = (message: string) => {
        setMicError(message);
        setTranscript("");
        transcriptRef.current = "";
        if (mode === "part2") {
          // Keep student on Part 2 with retry — do not silently advance to Part 3.
          part2TranscriptRef.current = "";
          part2MetaRef.current = {};
          part2PhaseRef.current = "speaking";
          setPart2Phase("speaking");
          setPart2Timer(null);
          setPart2MicStatus("error");
          part2ArmingRef.current = false;
          return;
        }
        if (
          sessionStatus === "active" &&
          !(currentPartRef.current === 2 && part2PhaseRef.current !== "done")
        ) {
          turnControllerRef.current?.armAfterExaminer();
        }
      };

      try {
        const stt = await transcribeBlob(blob);
        const text = stt.text;
        transcriptRef.current = text;
        setTranscript(text);

        if (!text) {
          recoverAfterFailure(
            "Couldn't hear anything. Tap Retry mic and speak your Part 2 answer again."
          );
          return;
        }

        const authenticity = isLikelyRealStudentSpeech(text);
        if (!authenticity.ok) {
          recoverAfterFailure(
            authenticity.reason ||
              "That recording was not a valid spoken answer. Tap Retry mic and try Part 2 again."
          );
          return;
        }

        setMicError(null);

        const spokenSeconds = Math.max(
          1,
          Math.floor((stt.duration ? stt.duration * 1000 : durationMs) / 1000)
        );
        totalSpeakingSecondsRef.current += spokenSeconds;
        setTotalSpeakingSeconds(totalSpeakingSecondsRef.current);

        const meta = {
          words: stt.words,
          speakingDurationMs: spokenSeconds * 1000,
        };

        if (mode === "part2") {
          part2TranscriptRef.current = text;
          part2MetaRef.current = meta;
          return;
        }

        await sendStudentMessageRef.current(text, meta);
      } catch (err) {
        console.error("[speaking] processRecordedAudio", err);
        recoverAfterFailure(
          err instanceof Error
            ? err.message
            : "Could not transcribe your answer. Tap Retry mic and try again."
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [transcribeBlob, setTranscript, sessionStatus, setPart2Phase, setPart2Timer]
  );

  processRecordedAudioRef.current = processRecordedAudio;

  const clearAnswerTimer = useCallback(() => {
    if (answerTimerRef.current) {
      clearInterval(answerTimerRef.current);
      answerTimerRef.current = null;
    }
    setAnswerSeconds(0);
  }, []);

  const stopRecording = useCallback((): Promise<void> => {
    clearRecordTimer();
    setRecordSeconds(0);

    const recorder = mediaRecorderRef.current;
    const mode = recordingModeRef.current ?? "manual";
    recordingModeRef.current = null;

    if (!recorder || recorder.state === "inactive") {
      setIsListening(false);
      releaseMicStream();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const durationMs = Date.now() - recordStartRef.current;

      recorder.onstop = () => {
        releaseMicStream();
        mediaRecorderRef.current = null;
        setIsListening(false);

        const mime = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mime });
        audioChunksRef.current = [];

        void processRecordedAudio(blob, durationMs, mode === "part2" ? "part2" : "manual").finally(
          resolve
        );
      };

      try {
        recorder.stop();
      } catch {
        releaseMicStream();
        setIsListening(false);
        resolve();
      }
    });
  }, [clearRecordTimer, releaseMicStream, processRecordedAudio, setIsListening]);

  /** Start MediaRecorder on an already-open stream (sync — no getUserMedia delay). */
  const startRecordingFromStream = useCallback(
    (stream: MediaStream, mode: "manual" | "part2"): boolean => {
      if (processingRef.current || sessionStatus !== "active") return false;
      if (mediaRecorderRef.current?.state === "recording") return true;

      audioChunksRef.current = [];
      try {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";

        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        recorder.onerror = () => {
          setMicError("Recording failed. Tap Retry mic, then speak.");
          setPart2MicStatus((s) => (s === "live" ? "error" : s));
          void stopRecording();
        };

        mediaRecorderRef.current = recorder;
        recordingModeRef.current = mode;
        recordStartRef.current = Date.now();
        recorder.start(300);
        setIsListening(true);
        setTranscript("");
        transcriptRef.current = "";
        setRecordSeconds(0);

        recordTimerRef.current = setInterval(() => {
          setRecordSeconds(Math.floor((Date.now() - recordStartRef.current) / 1000));
        }, 500);
        return true;
      } catch {
        setMicError("Recording failed. Tap Retry mic, then speak.");
        return false;
      }
    },
    [sessionStatus, stopRecording, setIsListening, setTranscript]
  );

  const startRecording = useCallback(
    async (mode: "manual" | "part2" = "manual"): Promise<boolean> => {
      if (processingRef.current || sessionStatus !== "active") {
        return false;
      }
      if (
        mode !== "part2" &&
        currentPartRef.current === 2 &&
        part2PhaseRef.current === "prep"
      ) {
        return false;
      }
      if (mediaRecorderRef.current?.state === "recording") return true;

      setMicError(null);
      if (mode !== "part2") {
        stopBrowserSpeech();
        isExaminerSpeakingRef.current = false;
        setIsExaminerSpeaking(false);
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: AUDIO_CONSTRAINTS,
        });
        micStreamRef.current = stream;
        setMicrophoneGranted(true);
        return startRecordingFromStream(stream, mode);
      } catch {
        releaseMicStream();
        setMicrophoneGranted(false);
        setIsListening(false);
        setMicError(
          "Microphone blocked. Click the lock icon in your browser address bar, allow microphone access, then tap Retry mic."
        );
        return false;
      }
    },
    [
      sessionStatus,
      releaseMicStream,
      setIsListening,
      setIsExaminerSpeaking,
      startRecordingFromStream,
    ]
  );

  const pendingArmRef = useRef(false);

  const shouldAutoArmTurn = useCallback(() => {
    if (sessionStatus !== "active") return false;
    if (processingRef.current || testEndedRef.current) return false;
    if (currentPartRef.current === 2 && part2PhaseRef.current !== "done") {
      return false;
    }
    return true;
  }, [sessionStatus]);

  const requestArmAfterExaminer = useCallback(() => {
    if (!shouldAutoArmTurn()) {
      console.info("[turnTaking] skip arm — not eligible");
      return;
    }
    const controller = turnControllerRef.current;
    if (!controller) {
      console.info("[turnTaking] controller not ready — queue arm");
      pendingArmRef.current = true;
      return;
    }
    pendingArmRef.current = false;
    controller.armAfterExaminer();
  }, [shouldAutoArmTurn]);

  const speakExaminer = useCallback(
    (text: string, onEnd?: () => void) => {
      // Cancel any previous arm while Sarah speaks — do not leave a stale timer.
      turnControllerRef.current?.cancelArm();
      pendingArmRef.current = false;
      clearAnswerTimer();
      setMicError(null);
      setDisplayedSpeech("");
      setExaminerSpeech(text);
      console.time("[speaking] TTS call");

      void speakSarahExaminer(text, {
        onStart: () => {
          isExaminerSpeakingRef.current = true;
          setIsExaminerSpeaking(true);
        },
        onBoundary: (charIndex, charLength) => {
          setDisplayedSpeech(text.slice(0, charIndex + charLength));
        },
        onEnd: () => {
          setDisplayedSpeech(text);
          setIsExaminerSpeaking(false);
          isExaminerSpeakingRef.current = false;
          console.timeEnd("[speaking] TTS call");
          onEnd?.();
          // Arm AFTER cancelArm from this speak cycle — fresh timer for this turn.
          requestArmAfterExaminer();
        },
      });
    },
    [setExaminerSpeech, setIsExaminerSpeaking, requestArmAfterExaminer, clearAnswerTimer]
  );

  useEffect(() => {
    testEndedRef.current = testEnded;
  }, [testEnded]);

  useEffect(() => {
    if (!sessionReady) return;

    const controller = createTurnTakingController({
      onStateChange: (state) => {
        setTurnState(state);
        setIsListening(state === "listening" || state === "speaking");
        if (state === "processing" || state === "idle" || state === "thinking") {
          clearAnswerTimer();
        }
      },
      onSpeechStart: () => {
        clearAnswerTimer();
        const started = Date.now();
        answerTimerRef.current = setInterval(() => {
          setAnswerSeconds(Math.floor((Date.now() - started) / 1000));
        }, 400);
      },
      onAnswerReady: (blob, durationMs) => {
        clearAnswerTimer();
        void processRecordedAudioRef.current(blob, durationMs, "manual");
      },
      onError: (message) => {
        clearAnswerTimer();
        setMicError(message);
      },
    });

    turnControllerRef.current = controller;
    console.info("[turnTaking] controller ready");

    if (pendingArmRef.current && shouldAutoArmTurn()) {
      pendingArmRef.current = false;
      controller.armAfterExaminer();
    }

    return () => {
      clearAnswerTimer();
      pendingArmRef.current = false;
      void turnControllerRef.current?.destroy();
      turnControllerRef.current = null;
    };
  }, [sessionReady, clearAnswerTimer, setIsListening, shouldAutoArmTurn]);
  const finishSession = useCallback(async () => {
    if (!sessionId || !studentId || processingRef.current) return;

    const clientValidation = hasValidSpeechInput({
      transcript: conversationHistory
        .filter((e) => e.role === "student")
        .map((e) => ({ role: "student", text: e.text, part: e.part ?? 1 })),
      speakingTimeSeconds: totalSpeakingSecondsRef.current,
      practiceMode: sessionType === "practice",
    });

    if (!microphoneGranted || !clientValidation.valid) {
      setMicError(
        clientValidation.reason ||
          "No valid student speech detected. Please speak your own answers before requesting a score."
      );
      return;
    }

    processingRef.current = true;
    setSessionStatus("scoring");

    try {
      const res = await fetch("/api/speaking/session/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          studentId,
          speakingTimeSeconds: totalSpeakingSecondsRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.insufficientSpeech) {
          setSessionStatus("active");
          processingRef.current = false;
          onComplete({ insufficientSpeech: true, message: data.error });
          return;
        }
        throw new Error(data.error || "Scoring failed");
      }
      setSessionStatus("complete");
      onComplete(data);
    } catch (err) {
      console.error(err);
      setMicError(
        err instanceof Error
          ? err.message
          : "Could not generate feedback. Please try again."
      );
      setSessionStatus("active");
      processingRef.current = false;
    }
  }, [
    sessionId,
    studentId,
    conversationHistory,
    microphoneGranted,
    setSessionStatus,
    sessionType,
    onComplete,
  ]);

  const ensurePart3Questions = useCallback(
    async (part2Transcript: string) => {
      if (!sessionId || !cueCard) return part3Questions;
      if (part3Questions.length >= 3) return part3Questions;

      setPart3Generating(true);
      try {
        const questions = await fetchPart3Questions({
          sessionId,
          cueCard: cueCardPayload(cueCard),
          part2Transcript,
          testType: "ielts_academic",
        });
        setPart3Questions(questions);
        return questions;
      } catch (err) {
        console.error("[ActiveSession] Part 3 generation failed:", err);
        return part3Questions;
      } finally {
        setPart3Generating(false);
      }
    },
    [sessionId, cueCard, part3Questions]
  );

  const switchToPracticePart = useCallback(
    async (part: Part) => {
      if (sessionType !== "practice" || processingRef.current) return;

      if (mediaRecorderRef.current?.state === "recording") {
        await stopRecording();
      }
      stopBrowserSpeech();
      setTranscript("");
      setMicError(null);
      setViewPart(part);
      setCurrentPart(part);

      if (part === 1) {
        setPart2Phase("done");
        setPart2Timer(null);
        const speech =
          "Let's practice Part 1. Could you tell me a little about where you live?";
        setExaminerSpeech(speech);
        setConversationHistory((history) => [
          ...history,
          { role: "examiner", text: speech, part: 1 },
        ]);
        speakExaminer(speech);
        return;
      }

      if (part === 2 && cueCard) {
        setPart2Phase("prep");
        setPart2Timer(60);
        setPart2MicStatus("idle");
        part2ArmingRef.current = false;
        setPrepNotes("");
        part2TranscriptRef.current = "";
        const speech = buildPart2PracticeIntro(cueCard);
        setExaminerSpeech(speech);
        setConversationHistory((history) => [
          ...history,
          { role: "examiner", text: speech, part: 2 },
        ]);
        speakExaminer(speech);
        return;
      }

      if (part === 3 && cueCard && sessionId) {
        setPart2Phase("done");
        setPart2Timer(null);
        const part2Text = conversationHistory
          .filter((entry) => entry.role === "student" && entry.part === 2)
          .map((entry) => entry.text)
          .join(" ")
          .trim();
        const questions = await ensurePart3Questions(part2Text);
        const card = cueCardPayload(cueCard);
        const speech =
          questions[0] != null
            ? buildPart3TransitionSpeech(card, questions[0])
            : `Thank you. That is the end of Part 2. We've been talking about ${String(cueCard.topic).charAt(0).toLowerCase()}${String(cueCard.topic).slice(1)}, and I'd now like to ask you some more general questions related to this. Let's begin Part 3.`;
        setExaminerSpeech(speech);
        setConversationHistory((history) => [
          ...history,
          { role: "examiner", text: speech, part: 3 },
        ]);
        speakExaminer(speech);
      }
    },
    [
      sessionType,
      sessionId,
      cueCard,
      conversationHistory,
      ensurePart3Questions,
      setCurrentPart,
      setPart2Phase,
      setPart2Timer,
      setConversationHistory,
      setExaminerSpeech,
      speakExaminer,
      stopRecording,
    ]
  );

  const handleExaminerAction = useCallback(
    (action: string, speech: string) => {
      if (action === "start_part2") {
        setCurrentPart(2);
        setPart2Phase("prep");
        setPart2Timer(60);
        setPart2MicStatus("idle");
        part2ArmingRef.current = false;
        speakExaminer(speech);
        return;
      }
      if (action === "start_part3") {
        setCurrentPart(3);
        setPart2Phase("done");
        setPart2Timer(null);
        setPart2MicStatus("idle");
        part2ArmingRef.current = false;
        speakExaminer(speech);
        return;
      }
      if (action === "end_test") {
        speakExaminer(speech, () => {
          setTestEnded(true);
        });
        return;
      }
      speakExaminer(speech);
    },
    [speakExaminer, setCurrentPart, setPart2Phase, setPart2Timer]
  );

  const sendStudentMessage = useCallback(
    async (
      text: string,
      meta?: {
        words?: { word: string; start: number; end: number; confidence?: number }[];
        speakingDurationMs?: number;
      }
    ) => {
      if (!sessionId || !text.trim() || processingRef.current) return;

      turnControllerRef.current?.cancelArm();
      setIsProcessing(true);
      setTranscript("");
      transcriptRef.current = "";

      const studentEntry: HistoryEntry = {
        role: "student",
        text: text.trim(),
        part: currentPart,
      };
      const historyForApi = [...conversationHistory, studentEntry];

      try {
        setSarahThinking(true);
        console.time("[speaking] LLM call");
        let res: Response | null = null;
        let data: {
          speech?: string;
          action?: string;
          error?: string;
          part3Questions?: string[];
        } = {};
        try {
          res = await fetch("/api/speaking/session/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              studentMessage: text.trim(),
              currentPart,
              conversationHistory: historyForApi,
              words: meta?.words ?? [],
              speakingDurationMs: meta?.speakingDurationMs,
            }),
          });
          data = await res.json();
        } finally {
          console.timeEnd("[speaking] LLM call");
        }
        if (!res.ok) {
          setSarahThinking(false);
          setMicError(data.error || "Could not send your response. Please try again.");
          turnControllerRef.current?.armAfterExaminer();
          return;
        }

        if (Array.isArray(data.part3Questions) && data.part3Questions.length >= 3) {
          setPart3Questions(data.part3Questions);
        }

        const examinerEntry: HistoryEntry = { role: "examiner", text: data.speech ?? "" };
        setConversationHistory([...historyForApi, examinerEntry]);
        setSarahThinking(false);
        handleExaminerAction(data.action ?? "follow_up", data.speech ?? "");
      } catch (err) {
        setSarahThinking(false);
        console.error(err);
        setMicError(
          err instanceof Error ? err.message : "Could not send your response. Please try again."
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [
      sessionId,
      currentPart,
      conversationHistory,
      setConversationHistory,
      setTranscript,
      handleExaminerAction,
    ]
  );

  sendStudentMessageRef.current = sendStudentMessage;

  // Microphone check then opening greeting
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;

    void (async () => {
      const mic = await checkMicrophoneAccess();
      if (!mic.ok) {
        setMicGateError(
          mic.error ||
            "Microphone not detected or not working. Please check your microphone settings and try again."
        );
        setSessionStatus("idle");
        return;
      }

      setMicrophoneGranted(true);
      setSessionReady(true);
      setSessionStatus("active");

      const opening =
        "Good morning. My name is Sarah, and I'll be conducting your IELTS Speaking test today. First, could you tell me your full name please?";
      setConversationHistory([{ role: "examiner", text: opening, part: 1 }]);
      speakExaminer(opening);
    })();
  }, [setSessionStatus, setConversationHistory, speakExaminer]);

  useEffect(() => () => {
    clearRecordTimer();
    if (mediaRecorderRef.current?.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    stopBrowserSpeech();
    releaseMicStream();
  }, [clearRecordTimer, releaseMicStream]);
  // Session elapsed timer
  useEffect(() => {
    if (sessionStatus !== "active") return;
    const id = setInterval(() => setSessionElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [sessionStatus]);

  const finishPart2Speaking = useCallback(async () => {
    if (part2PhaseRef.current !== "speaking") return;
    if (mediaRecorderRef.current?.state !== "recording" && !part2TranscriptRef.current) {
      setPart2MicStatus("error");
      setMicError(
        "Microphone was not recording. Tap Retry mic and wait for MIC LIVE before you speak."
      );
      return;
    }

    part2ArmingRef.current = false;
    turnControllerRef.current?.cancelArm();
    setPart2Timer(null);

    await stopRecording();

    const part2Text = part2TranscriptRef.current.trim();
    const authenticity = part2Text ? isLikelyRealStudentSpeech(part2Text) : { ok: false };

    if (part2Text && authenticity.ok) {
      part2PhaseRef.current = "done";
      setPart2Phase("done");
      setPart2MicStatus("idle");
      const thankYou = "Thank you.";
      const part2Meta = part2MetaRef.current;
      speakExaminer(thankYou, () => {
        void (async () => {
          await sendStudentMessage(part2Text, part2Meta);
          await ensurePart3Questions(part2Text);
        })();
      });
      return;
    }

    // Stay on Part 2 — do not advance to Part 3 with an empty/invalid answer.
    part2PhaseRef.current = "speaking";
    setPart2Phase("speaking");
    setPart2MicStatus("error");
    part2TranscriptRef.current = "";
    part2MetaRef.current = {};
    setMicError(
      authenticity && "reason" in authenticity && authenticity.reason
        ? authenticity.reason
        : "No clear Part 2 answer was heard. Tap Retry mic and speak again — do not continue until you see MIC LIVE."
    );
  }, [
    stopRecording,
    speakExaminer,
    sendStudentMessage,
    ensurePart3Questions,
    setPart2Phase,
    setPart2Timer,
  ]);

  const armPart2Microphone = useCallback(async () => {
    if (part2ArmingRef.current) return;
    part2ArmingRef.current = true;
    turnControllerRef.current?.cancelArm();
    part2PhaseRef.current = "speaking";
    setPart2Phase("speaking");
    setPart2Timer(null);
    setPart2MicStatus("arming");
    setMicError(null);
    part2TranscriptRef.current = "";
    part2MetaRef.current = {};

    // Pre-warm getUserMedia only — do not start MediaRecorder yet (avoids capturing Sarah's TTS).
    try {
      if (mediaRecorderRef.current?.state === "recording") {
        await stopRecording();
      }
      releaseMicStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
      });
      micStreamRef.current = stream;
      setMicrophoneGranted(true);
      setPart2MicStatus("ready");
      part2ArmingRef.current = false;

      // Stream is ready. Start MediaRecorder the instant Sarah finishes (no getUserMedia delay).
      speakExaminer("Right, please begin speaking now.", () => {
        const started = startRecordingFromStream(stream, "part2");
        if (!started || mediaRecorderRef.current?.state !== "recording") {
          setPart2MicStatus("error");
          setMicError(
            "Microphone is not recording yet. Tap Retry mic and wait for MIC LIVE before you speak."
          );
          return;
        }
        setPart2MicStatus("live");
        setPart2Timer(120);
      });
    } catch {
      part2ArmingRef.current = false;
      setPart2MicStatus("error");
      setMicrophoneGranted(false);
      setMicError(
        "Microphone blocked. Allow mic access, tap Retry mic, and wait for MIC LIVE before speaking."
      );
    }
  }, [
    speakExaminer,
    startRecordingFromStream,
    stopRecording,
    releaseMicStream,
    setPart2Phase,
    setPart2Timer,
  ]);

  // Part 2 prep / speaking countdown
  useEffect(() => {
    if (currentPart !== 2 || part2Phase === "done") return;

    // Prep finished → arm mic BEFORE Sarah says "begin speaking".
    if (part2Phase === "prep" && part2Timer != null && part2Timer <= 0) {
      void armPart2Microphone();
      return;
    }

    if (part2Timer == null) return;

    if (part2Timer <= 0) {
      if (part2Phase === "speaking" && part2MicStatus === "live") {
        void finishPart2Speaking();
      }
      return;
    }

    // Only tick the 2-minute clock while mic is confirmed live.
    if (part2Phase === "speaking" && part2MicStatus !== "live") return;

    const id = setTimeout(() => setPart2Timer(part2Timer - 1), 1000);
    return () => clearTimeout(id);
  }, [
    currentPart,
    part2Timer,
    part2Phase,
    part2MicStatus,
    armPart2Microphone,
    finishPart2Speaking,
  ]);

  // Pulse progress bar at 30s remaining in Part 2 speaking
  useEffect(() => {
    if (part2Phase === "speaking" && part2Timer != null && part2Timer <= 30) {
      setPart2Pulse(true);
    } else {
      setPart2Pulse(false);
    }
  }, [part2Phase, part2Timer]);

  const recentHistory = conversationHistory.slice(-6);
  const prepAmber = part2Phase === "prep" && part2Timer != null && part2Timer <= 20;
  const part2Progress =
    part2Phase === "speaking" && part2Timer != null
      ? ((120 - part2Timer) / 120) * 100
      : 0;

  const speechValidation = useMemo(
    () =>
      hasValidSpeechInput({
        transcript: conversationHistory
          .filter((e) => e.role === "student")
          .map((e) => ({ role: "student", text: e.text, part: e.part ?? 1 })),
        speakingTimeSeconds: totalSpeakingSeconds,
        practiceMode: sessionType === "practice",
      }),
    [conversationHistory, totalSpeakingSeconds, sessionType]
  );

  const canSubmit = useMemo(
    () => microphoneGranted && speechValidation.valid,
    [microphoneGranted, speechValidation.valid]
  );

  if (micGateError) {
    return (
      <div style={{ maxWidth: "560px" }}>
        <div
          style={{
            background: "#fef2f2",
            border: "2px solid #ef4444",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "24px", marginBottom: "8px" }}>🎤</p>
          <h3 style={{ color: "#991b1b", fontSize: "18px", marginBottom: "8px" }}>
            Microphone required
          </h3>
          <p style={{ color: "#666", lineHeight: 1.6 }}>{micGateError}</p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div style={{ maxWidth: "560px", padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#64748b" }}>Checking microphone…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#0d1b35", margin: 0 }}>
          Session #{sessionNumber} — Part {currentPart}: {PART_LABELS[currentPart]}
          {sessionType === "mock" ? " (Mock)" : ""}
        </p>

        <div style={{ display: "flex", gap: "6px" }}>
          {([1, 2, 3] as Part[]).map((p) => {
            const isActive = currentPart === p;
            const isViewing = viewPart === p;
            const isLocked = sessionType === "mock" && p > currentPart;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  if (isLocked) return;
                  if (sessionType === "practice") {
                    void switchToPracticePart(p);
                  } else {
                    setViewPart(p);
                  }
                }}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: isViewing ? "2px solid #c9972c" : "2px solid transparent",
                  background: isActive ? "#c9972c" : isLocked ? "#f8fafc" : "#f1f5f9",
                  color: isActive ? "white" : isLocked ? "#cbd5e1" : "#64748b",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.7 : 1,
                }}
              >
                Part {p}
                {isLocked ? " 🔒" : ""}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#64748b", margin: 0, fontVariantNumeric: "tabular-nums" }}>
          {formatElapsed(sessionElapsed)}
        </p>
      </div>

      {/* Part guide panel */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        {sessionType === "mock" && viewPart > currentPart ? (
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            <strong style={{ color: "#0d1b35" }}>Part {viewPart}</strong> unlocks when Sarah
            moves you on from Part {currentPart}. Focus on the current part for now.
          </p>
        ) : (
          <>
            {sessionType === "practice" ? (
              <p style={{ fontSize: "12px", color: "#0d9488", margin: "0 0 10px", fontWeight: 600 }}>
                Daily Practice — tap any part above to drill Part 1, 2, or 3 directly.
              </p>
            ) : null}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#0d1b35", margin: "0 0 6px" }}>
                {PART_GUIDES[viewPart].title}
                {viewPart === currentPart && (
                  <span style={{ color: "#0d9488", fontWeight: 600, fontSize: "11px", marginLeft: "8px" }}>
                    ● LIVE NOW
                  </span>
                )}
              </p>
              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                {PART_GUIDES[viewPart].duration}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 10px", lineHeight: 1.6 }}>
              {PART_GUIDES[viewPart].whatHappens}
            </p>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {PART_GUIDES[viewPart].tips.map((tip) => (
                <li key={tip} style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                  {tip}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Examiner speech */}      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          minHeight: "120px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "#0d1b35",
              color: "#c9972c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            S
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", margin: "0 0 6px" }}>
              Sarah {sarahThinking && !isExaminerSpeaking ? (
                <span style={{ color: "#c9972c" }}>
                  <span className="speaking-dot" style={{ animation: "pulse 1s infinite" }}>
                    ● thinking…
                  </span>
                </span>
              ) : null}
              {isExaminerSpeaking && (
                <span style={{ color: "#0d9488" }}>
                  <span className="speaking-dot" style={{ animation: "pulse 1s infinite" }}>
                    ● speaking
                  </span>
                </span>
              )}
            </p>
            <p style={{ fontSize: "16px", color: "#0d1b35", lineHeight: 1.6, margin: 0 }}>
              {sarahThinking && !isExaminerSpeaking
                ? "Sarah is thinking…"
                : displayedSpeech || examinerSpeech || "…"}
            </p>
          </div>
        </div>
      </div>

      {/* Part 2 cue card */}
      {currentPart === 2 && cueCard && part2Phase !== "done" && (
        <div
          style={{
            background: "#fffbeb",
            border: "2px solid #c9972c",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#c9972c", margin: "0 0 8px" }}>
            CUE CARD — Part 2
          </p>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0d1b35", margin: "0 0 8px" }}>
            {cueCard.topic}
          </h3>
          <p style={{ fontSize: "14px", color: "#0d1b35", margin: "0 0 12px" }}>
            {cueCard.prompt}
          </p>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 6px" }}>You should say:</p>
          <ul style={{ margin: "0 0 12px", paddingLeft: "1.25rem" }}>
            {cueCard.bullets.map((b) => (
              <li key={b} style={{ fontSize: "13px", color: "#0d1b35", marginBottom: "4px" }}>
                {b}
              </li>
            ))}
            <li style={{ fontSize: "13px", color: "#0d1b35" }}>{cueCard.closing}</li>
          </ul>

          {part2Phase === "prep" && part2Timer != null && (
            <>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: prepAmber ? "#d97706" : "#0d1b35",
                  margin: "0 0 8px",
                }}
              >
                {part2Timer} seconds to prepare
              </p>
              <p style={{ fontSize: "12px", color: "#888", margin: "0 0 8px" }}>
                You may make notes
              </p>
              <textarea
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                placeholder="Your notes (not submitted)…"
                rows={3}
                style={{
                  width: "100%",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px",
                  fontSize: "13px",
                  resize: "vertical",
                }}
              />
            </>
          )}

          {part2Phase === "speaking" && (
            <>
              <div
                style={{
                  marginBottom: "12px",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  background:
                    part2MicStatus === "live"
                      ? "#ecfdf5"
                      : part2MicStatus === "error"
                        ? "#fef2f2"
                        : "#fff7ed",
                  border: `2px solid ${
                    part2MicStatus === "live"
                      ? "#10b981"
                      : part2MicStatus === "error"
                        ? "#ef4444"
                        : "#f59e0b"
                  }`,
                  animation:
                    part2MicStatus === "live" || part2MicStatus === "ready"
                      ? "pulse 1.2s infinite"
                      : undefined,
                }}
              >
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    margin: 0,
                    color:
                      part2MicStatus === "live"
                        ? "#047857"
                        : part2MicStatus === "error"
                          ? "#b91c1c"
                          : "#b45309",
                  }}
                >
                  {part2MicStatus === "live"
                    ? "● MIC LIVE — Recording now. Start speaking."
                    : part2MicStatus === "ready"
                      ? "● MIC READY — Wait for Sarah, then speak."
                      : part2MicStatus === "error"
                        ? "● MIC NOT READY — Do not speak yet."
                        : "● Arming microphone… Please wait."}
                </p>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "6px 0 0" }}>
                  {part2MicStatus === "live"
                    ? "Your answer is being captured. Speak for up to 2 minutes."
                    : part2MicStatus === "ready"
                      ? "Do not start your answer until this banner turns green (MIC LIVE)."
                      : "Sarah will only prompt you after the microphone is ready."}
                </p>
              </div>

              {part2MicStatus === "live" ? (
                <>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#0d1b35", margin: "0 0 8px" }}>
                    Speaking… {part2Timer != null && `(${part2Timer}s remaining)`}
                  </p>
                  <div
                    style={{
                      height: "8px",
                      background: "#f1f5f9",
                      borderRadius: "4px",
                      overflow: "hidden",
                      marginBottom: "8px",
                      animation: part2Pulse ? "pulse 1.5s infinite" : undefined,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${part2Progress}%`,
                        background: "#c9972c",
                        borderRadius: "4px",
                        transition: "width 1s linear",
                      }}
                    />
                  </div>
                </>
              ) : null}

              {transcript && (
                <p style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic", margin: 0 }}>
                  {transcript}
                </p>
              )}

              {part2MicStatus === "error" || part2MicStatus === "arming" ? (
                <button
                  type="button"
                  onClick={() => void armPart2Microphone()}
                  disabled={part2MicStatus === "arming" || isProcessing}
                  style={{
                    marginTop: "12px",
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#0d9488",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: part2MicStatus === "arming" ? "wait" : "pointer",
                  }}
                >
                  {part2MicStatus === "arming" ? "Arming mic…" : "Retry mic"}
                </button>
              ) : part2MicStatus === "ready" ? (
                <p
                  style={{
                    marginTop: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#b45309",
                    textAlign: "center",
                  }}
                >
                  Wait for Sarah to finish — recording starts automatically.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => void finishPart2Speaking()}
                  disabled={isProcessing || part2MicStatus !== "live"}
                  style={{
                    marginTop: "12px",
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: part2MicStatus === "live" ? "#0d1b35" : "#94a3b8",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor:
                      isProcessing || part2MicStatus !== "live" ? "not-allowed" : "pointer",
                  }}
                >
                  I&apos;m finished speaking
                </button>
              )}
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: "8px 0 0", textAlign: "center" }}>
                Use headphones and mute other media so only your voice is recorded.
              </p>
            </>
          )}
        </div>
      )}

      {/* Conversational turn-taking (Parts 1 & 3) — hidden during Part 2 prep/speaking */}
      {!(currentPart === 2 && (part2Phase === "prep" || part2Phase === "speaking")) && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              background: "#0d1b35",
              border:
                turnState === "listening" || turnState === "speaking"
                  ? "4px solid #c9972c"
                  : "4px solid transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              position: "relative",
              opacity: isExaminerSpeaking || turnState === "thinking" ? 0.7 : 1,
              animation:
                turnState === "listening"
                  ? "pulse 1.2s infinite"
                  : turnState === "speaking"
                    ? "pulse 0.8s infinite"
                    : undefined,
            }}
          >
            {isProcessing || turnState === "processing" ? (
              <span style={{ color: "white", fontSize: "12px" }}>⏳</span>
            ) : (
              <span style={{ fontSize: "32px" }}>🎤</span>
            )}
            {(turnState === "listening" || turnState === "speaking") && (
              <span
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: turnState === "speaking" ? "#22c55e" : "#ef4444",
                }}
              />
            )}
          </div>

          <p style={{ fontSize: "14px", fontWeight: 600, color: "#0d1b35", marginTop: "12px" }}>
            {isProcessing || turnState === "processing"
              ? "Processing your answer…"
              : isExaminerSpeaking
                ? "Sarah is speaking…"
                : turnState === "thinking"
                  ? "Get ready — your mic arms in a few seconds…"
                  : turnState === "listening"
                    ? "Listening — start speaking when ready"
                    : turnState === "speaking"
                      ? `Speaking… ${answerSeconds}s`
                      : micError
                        ? "Mic not ready — see the message below"
                        : "Waiting for your turn…"}
          </p>

          {(turnState === "listening" || turnState === "speaking") && (
            <button
              type="button"
              onClick={() => void turnControllerRef.current?.stopManual()}
              disabled={isProcessing}
              style={{
                marginTop: "12px",
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                background: "#0d1b35",
                color: "white",
                fontSize: "14px",
                fontWeight: 700,
                cursor: isProcessing ? "wait" : "pointer",
              }}
            >
              I&apos;m done
            </button>
          )}

          {(turnState === "idle" || turnState === "thinking") &&
            !isExaminerSpeaking &&
            !isProcessing && (
              <button
                type="button"
                onClick={() => {
                  setMicError(null);
                  turnControllerRef.current?.forceListenNow();
                }}
                style={{
                  marginTop: "12px",
                  padding: "12px 20px",
                  borderRadius: "10px",
                  border: "1px solid #0d1b35",
                  background: "white",
                  color: "#0d1b35",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {turnState === "thinking" ? "Skip wait — start listening" : "Start listening now"}
              </button>
            )}

          {transcript && (
            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
                marginTop: "8px",
                fontStyle: "italic",
                maxWidth: "500px",
                margin: "8px auto 0",
              }}
            >
              {transcript}
            </p>
          )}
          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px", maxWidth: "420px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.45 }}>
            {isExaminerSpeaking
              ? "Wait for Sarah to finish — the mic arms automatically"
              : turnState === "listening" || turnState === "speaking"
                ? "Speak naturally. Tap I'm done, or pause ~3 seconds to send automatically. Use headphones."
                : "Natural conversation mode — no need to tap the mic to start"}
          </p>
          {micError && (
            <p
              style={{
                fontSize: "12px",
                color: "#dc2626",
                marginTop: "10px",
                maxWidth: "420px",
                margin: "10px auto 0",
                lineHeight: 1.5,
              }}
            >
              {micError}
            </p>
          )}
        </div>
      )}

      {sessionStatus === "scoring" && (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            background: "white",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35" }}>
            Generating your band score report…
          </p>
        </div>
      )}

      {/* Submit score — only when enough real speech recorded */}
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <button
          type="button"
          disabled={!canSubmit || isProcessing || isListening || sessionStatus === "scoring"}
          onClick={() => void finishSession()}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "14px 20px",
            borderRadius: "12px",
            border: "none",
            fontSize: "14px",
            fontWeight: 700,
            background: canSubmit ? "#c9972c" : "#e5e7eb",
            color: canSubmit ? "white" : "#999",
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {canSubmit
            ? "Get My Band Score →"
            : testEnded
              ? "Complete speaking to get your score"
              : `Record at least ${MIN_SPEAKING_SECONDS}s of your own speech to unlock scoring`}
        </button>
        {!canSubmit ? (
          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px", maxWidth: "420px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.45 }}>
            {speechValidation.reason ||
              `Valid speaking time: ${totalSpeakingSeconds}s / ${MIN_SPEAKING_SECONDS}s minimum. Background audio and examiner echo do not count.`}
          </p>
        ) : null}
      </div>

      {/* Conversation history */}
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "1rem",
          maxHeight: "240px",
          overflowY: "auto",
        }}
      >
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#888", margin: "0 0 12px" }}>
          Recent conversation
        </p>
        {recentHistory.map((entry, i) => {
          const isStudent = entry.role === "student";
          const opacity = 0.5 + (i / recentHistory.length) * 0.5;
          return (
            <div
              key={`${entry.role}-${i}-${entry.text.slice(0, 20)}`}
              style={{
                display: "flex",
                justifyContent: isStudent ? "flex-end" : "flex-start",
                marginBottom: "8px",
                opacity,
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  background: isStudent ? "#c9972c" : "#0d1b35",
                  color: "white",
                }}
              >
                {entry.text}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
