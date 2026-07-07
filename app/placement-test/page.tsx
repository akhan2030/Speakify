"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateFinalResult,
  completeSpeaking,
  gradeObjectiveAnswer,
  initTestState,
  processAnswer,
  selectNextValidQuestion,
  shouldEndTest,
  shouldShowSpeaking,
  skipInvalidQuestion,
} from "@/lib/placement/adaptiveEngine";
import { isValidQuestion, mcqOptionsRecord } from "@/lib/placement/isValidQuestion";
import { countWords, formatMmSs, sectionLabel } from "@/lib/placement/format";
import { generateStudyPlan, roundToHalfBand } from "@/lib/placement/scoring";
import type { PlacementOnboarding } from "@/lib/placement/onboarding";
import type { Answer, Question, SpeakingScore, TestState } from "@/lib/placement/types";
import PlacementListeningAudio from "./PlacementListeningAudio";
import PlacementOnboardingForm from "./PlacementOnboarding";
import SpeakingSection from "./SpeakingSection";
import { getWritingTaskLabel } from "@/lib/placement/bank/writing";

const GUEST_KEY = "speakify_placement_guest_id";
const RESULT_KEY = "speakify_placement_result";

type Phase = "onboarding" | "test" | "speaking" | "finishing" | "locked";

type RetakeLockInfo = {
  completedAtLabel: string;
  retakeAvailableAtLabel: string;
  retakeAvailableAt: string;
  msRemaining: number;
  overallBand: number | null;
};

const FINISHING_MESSAGES = [
  "Analysing your grammar patterns...",
  "Measuring your vocabulary range...",
  "Calculating your IELTS band score...",
];

const ADVANCE_MS = 450;

function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = `guest_${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

function TourismBarChart() {
  const bars = [
    { year: "2019", value: 18 },
    { year: "2020", value: 19 },
    { year: "2021", value: 21 },
    { year: "2022", value: 24 },
    { year: "2023", value: 27 },
  ];
  const max = 30;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        Tourists visiting Saudi Arabia (millions)
      </p>
      <div className="mt-4 flex items-end justify-center gap-3 sm:gap-5">
        {bars.map((bar) => (
          <div key={bar.year} className="flex flex-col items-center gap-1">
            <span className="text-[0.65rem] font-bold text-[#c9972c] sm:text-xs">
              {bar.value}M
            </span>
            <div
              className="w-8 rounded-t-md bg-[#c9972c] sm:w-10"
              style={{ height: `${(bar.value / max) * 96}px` }}
            />
            <span className="text-[0.65rem] font-medium text-slate-600 sm:text-xs">
              {bar.year}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RetakeLockScreen({
  lock,
  whatsappHref,
  onViewResults,
}: {
  lock: RetakeLockInfo;
  whatsappHref: string;
  onViewResults: () => void;
}) {
  const [remaining, setRemaining] = useState(lock.msRemaining);

  useEffect(() => {
    setRemaining(lock.msRemaining);
    const tick = setInterval(() => {
      const target = new Date(lock.retakeAvailableAt).getTime();
      setRemaining(Math.max(0, target - Date.now()));
    }, 1000);
    return () => clearInterval(tick);
  }, [lock.msRemaining, lock.retakeAvailableAt]);

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor(
    (remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b35] px-6 text-center text-white">
      <p className="text-2xl font-extrabold text-[#c9972c]">Speakify</p>
      <div className="mt-10 max-w-md rounded-2xl border border-[#c9972c]/30 bg-white/5 p-8">
        <h1 className="text-xl font-bold">Placement test completed</h1>
        <p className="mt-4 text-sm text-slate-300">
          You completed your placement test on{" "}
          <strong className="text-white">{lock.completedAtLabel}</strong>
        </p>
        <p className="mt-3 text-sm text-slate-300">
          You can retake on{" "}
          <strong className="text-[#c9972c]">{lock.retakeAvailableAtLabel}</strong>
        </p>
        <div className="mt-6 rounded-xl bg-[#0d1b35] px-6 py-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Time remaining
          </p>
          <p className="mt-2 text-3xl font-bold text-[#c9972c]">
            {days}d {hours}h
          </p>
        </div>
        {lock.overallBand != null ? (
          <p className="mt-4 text-sm text-slate-400">
            Last score: Band {lock.overallBand.toFixed(1)}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onViewResults}
            className="rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35]"
          >
            View your results
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[#25D366] bg-[#25D366]/20 px-6 py-3 text-sm font-bold text-[#25D366]"
          >
            Chat with advisor
          </a>
        </div>
      </div>
    </div>
  );
}

function FinishingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setMsgIndex((i) => (i + 1) % FINISHING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b35] px-6 text-center text-white">
      <p className="text-3xl font-extrabold text-[#c9972c]">Speakify</p>
      <div className="mt-10 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-3 w-3 animate-bounce rounded-full bg-[#c9972c]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="mt-8 min-h-[3rem] max-w-md text-lg font-medium text-slate-200 transition-opacity duration-500">
        {FINISHING_MESSAGES[msgIndex]}
      </p>
      <p className="mt-4 text-sm text-slate-400">
        Preparing your personalised results
        <span className="inline-block w-8 animate-pulse text-left">...</span>
      </p>
    </div>
  );
}

export default function PlacementTestPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const [phase, setPhase] = useState<Phase>("onboarding");
  const [placementProfile, setPlacementProfile] =
    useState<PlacementOnboarding | null>(null);
  const [retakeLock, setRetakeLock] = useState<RetakeLockInfo | null>(null);
  const [checkingRetake, setCheckingRetake] = useState(true);
  const [testState, setTestState] = useState<TestState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [displayBand, setDisplayBand] = useState(5.0);
  const [elapsed, setElapsed] = useState(0);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const questionStart = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progressPct = testState
    ? Math.round((testState.questionsAsked / testState.maxQuestions) * 100)
    : 0;

  const questionNumber = (testState?.questionsAsked ?? 0) + 1;

  const whatsappRaw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "966500000000";
  const whatsappHref = `https://wa.me/${whatsappRaw.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi Speakify, I completed my placement test and would like help with my study plan."
  )}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setCheckingRetake(true);
      try {
        const studentId = sessionUserId?.trim() || getGuestId();
        const res = await fetch(
          `/api/placement/session?check=true&studentId=${encodeURIComponent(studentId)}`
        );
        const data = await res.json();
        if (!cancelled && res.ok && data.locked) {
          setRetakeLock({
            completedAtLabel: data.completedAtLabel ?? "",
            retakeAvailableAtLabel: data.retakeAvailableAtLabel ?? "",
            retakeAvailableAt: data.retakeAvailableAt ?? "",
            msRemaining: data.msRemaining ?? 0,
            overallBand: data.overallBand ?? null,
          });
          setPhase("locked");
        }
      } finally {
        if (!cancelled) setCheckingRetake(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  useEffect(() => {
    if (phase !== "test") return;
    questionStart.current = Date.now();
    setAnswerInput("");
    setSelectedOption(null);
    setAdvancing(false);
  }, [currentQuestion?.id, phase]);

  useEffect(() => {
    if (phase !== "test" && phase !== "speaking") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (!testState) return;
    if (testState.questionsAsked > 0 && testState.questionsAsked % 3 === 0) {
      setDisplayBand(roundToHalfBand(testState.currentBand));
      setMilestone(
        `You're performing at Band ${roundToHalfBand(testState.currentBand).toFixed(1)} — keep going!`
      );
      const t = setTimeout(() => setMilestone(null), 4000);
      return () => clearTimeout(t);
    }
  }, [testState?.questionsAsked, testState?.currentBand]);

  const saveAnswer = async (answer: Answer, studentAnswer: string) => {
    if (!attemptId) return;
    await fetch("/api/placement/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        questionId: answer.questionId,
        section: answer.section,
        band: answer.band,
        studentAnswer,
        correct: answer.correct,
        timeTaken: answer.timeTaken,
      }),
    });
  };

  const finishTest = useCallback(
    async (state: TestState) => {
      setPhase("finishing");
      const result = calculateFinalResult(state);
      const studyPlan = generateStudyPlan(result);

      if (attemptId) {
        await fetch("/api/placement/session", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            overallBand: result.overallBand,
            cefr: result.cefr,
            skillBands: result.skillBands,
            weakAreas: result.weakAreas,
            strongAreas: result.strongAreas,
            totalQuestions: result.totalQuestions,
            confidenceScore: result.confidenceScore,
          }),
        });
      }

      sessionStorage.setItem(
        RESULT_KEY,
        JSON.stringify({
          result,
          studyPlan,
          completedAt: new Date().toISOString(),
          onboarding: placementProfile,
        })
      );
      router.push("/placement-test/results");
    },
    [attemptId, placementProfile, router]
  );

  const continueAfterState = useCallback(
    (nextState: TestState) => {
      if (shouldShowSpeaking(nextState)) {
        setTestState(nextState);
        setCurrentQuestion(null);
        setPhase("speaking");
        return;
      }
      if (shouldEndTest(nextState)) {
        finishTest(nextState);
        return;
      }
      const nextQ = selectNextValidQuestion(nextState);
      if (!nextQ) {
        finishTest(nextState);
        return;
      }
      setTestState(nextState);
      setCurrentQuestion(nextQ);
      setPhase("test");
    },
    [finishTest]
  );

  useEffect(() => {
    if (phase !== "test" || !testState || !currentQuestion) return;
    if (currentQuestion.type === "mcq" && !isValidQuestion(currentQuestion)) {
      const skipped = skipInvalidQuestion(testState, currentQuestion.id);
      continueAfterState(skipped);
    }
  }, [phase, testState, currentQuestion, continueAfterState]);

  const handleSpeakingComplete = useCallback(
    async (score: SpeakingScore, timeTaken: number) => {
      if (!testState) return;
      const nextState = completeSpeaking(testState, score.overallBand, timeTaken);
      const answer: Answer = {
        questionId: "speaking-placement",
        section: "speaking",
        band: score.overallBand,
        correct: score.overallBand >= testState.currentBand - 0.5,
        timeTaken,
      };
      await saveAnswer(
        answer,
        `Fluency ${score.fluency}, Vocabulary ${score.lexicalResource}, Grammar ${score.grammaticalRange}, Overall ${score.overallBand}. ${score.feedback}`
      );
      setDisplayBand(roundToHalfBand(nextState.currentBand));
      continueAfterState(nextState);
    },
    [testState, continueAfterState]
  );

  const showEncouragement = (n: number, band: number) => {
    if (n === 5) {
      setEncouragement("Great start! The test is adapting to your level.");
    } else if (n === 15) {
      setEncouragement(
        band > 6
          ? "Impressive! You're in advanced territory."
          : "Good effort! Let's find your exact level."
      );
    } else if (n === 23) {
      setEncouragement("Almost there — final stretch!");
    } else {
      return;
    }
    setTimeout(() => setEncouragement(null), 5000);
  };

  const submitAnswer = async (studentAnswer: string, correct: boolean) => {
    if (!testState || !currentQuestion || advancing) return;

    const timeTaken = Math.max(
      1,
      Math.round((Date.now() - questionStart.current) / 1000)
    );

    const answer: Answer = {
      questionId: currentQuestion.id,
      section: currentQuestion.section,
      band: currentQuestion.band,
      correct,
      timeTaken,
    };

    const nextState = processAnswer(testState, answer);
    await saveAnswer(answer, studentAnswer);

    showEncouragement(nextState.questionsAsked, nextState.currentBand);
    setDisplayBand(roundToHalfBand(nextState.currentBand));
    setAdvancing(true);

    window.setTimeout(() => {
      setSelectedOption(null);
      setAnswerInput("");
      setAdvancing(false);
      continueAfterState(nextState);
    }, ADVANCE_MS);
  };

  const handleMcq = (option: string) => {
    if (advancing || checking) return;
    setSelectedOption(option);
    const correct = gradeObjectiveAnswer(currentQuestion!, option);
    void submitAnswer(option, correct);
  };

  const handleFillBlank = async () => {
    if (!currentQuestion || checking) return;
    setChecking(true);
    const correct = gradeObjectiveAnswer(currentQuestion, answerInput);
    setChecking(false);
    await submitAnswer(answerInput, correct);
  };

  const handleErrorCorrection = async () => {
    if (!currentQuestion || checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/placement/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          studentAnswer: answerInput,
        }),
      });
      const json = await res.json();
      await submitAnswer(
        answerInput,
        Boolean(json.correct)
      );
    } finally {
      setChecking(false);
    }
  };

  const handleWriting = async () => {
    if (!currentQuestion || checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/placement/score-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentQuestion.question,
          studentAnswer: answerInput,
          targetBand: currentQuestion.band,
        }),
      });
      const json = await res.json();
      const correct = Number(json.overallBand) >= currentQuestion.band - 0.5;
      await submitAnswer(answerInput, correct);
    } finally {
      setChecking(false);
    }
  };

  const onboardingInitial = useMemo(
    (): Partial<PlacementOnboarding> => ({
      fullName: session?.user?.name?.trim() ?? "",
      email: session?.user?.email?.trim() ?? "",
    }),
    [session?.user?.name, session?.user?.email]
  );

  const startTest = async (profile: PlacementOnboarding) => {
    setPlacementProfile(profile);
    const guestId = getGuestId();
    const res = await fetch("/api/placement/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: guestId, onboarding: profile }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error ?? "Could not start the test. Please try again.");
      return;
    }
    setAttemptId(json.attemptId);

    const state = initTestState(35);
    const first = selectNextValidQuestion(state);
    if (!first) return;

    setTestState(state);
    setCurrentQuestion(first);
    setDisplayBand(5.0);
    setElapsed(0);
    setPhase("test");
  };

  const questionCard = useMemo(() => {
    if (!currentQuestion) return null;
    const q = currentQuestion;

    if (q.type === "mcq") {
      if (!isValidQuestion(q)) {
        return (
          <p className="mt-6 text-center text-sm text-slate-500">Loading next question…</p>
        );
      }
      const opts = mcqOptionsRecord(q.options);
      const letters = ["A", "B", "C", "D"] as const;
      return (
        <div className="mt-6 grid gap-3">
          {letters.map((letter) => {
            const optionText = opts[letter];
            if (!optionText || optionText.trim().length === 0) return null;
            const selected = selectedOption === optionText;
            return (
              <button
                key={`${q.id}-${letter}`}
                type="button"
                disabled={advancing || checking}
                onClick={() => handleMcq(optionText)}
                className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                  selected
                    ? "border-[#c9972c] bg-[#c9972c]/10 text-[#0d1b35]"
                    : advancing
                      ? "border-slate-200 opacity-60"
                      : "border-slate-200 bg-white text-[#0d1b35] hover:border-[#c9972c]/50"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#c9972c] text-sm font-bold text-[#0d1b35]">
                  {letter}
                </span>
                <span className="flex-1 pt-0.5">{optionText}</span>
                {selected ? (
                  <span className="pt-0.5 text-sm font-bold text-[#c9972c]" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      );
    }

    if (q.type === "fill_blank") {
      return (
        <div className="mt-6">
          <input
            type="text"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            disabled={advancing || checking}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[#0d1b35] focus:border-[#c9972c] focus:outline-none focus:ring-1 focus:ring-[#c9972c]"
            placeholder="Type your answer…"
          />
          <button
            type="button"
            onClick={handleFillBlank}
            disabled={!answerInput.trim() || advancing || checking}
            className="mt-4 rounded-xl bg-[#0d1b35] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {checking ? "Checking…" : "Submit"}
          </button>
        </div>
      );
    }

    if (q.type === "error_correction") {
      return (
        <div className="mt-6">
          <textarea
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            rows={4}
            disabled={advancing || checking}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[#0d1b35] focus:border-[#c9972c] focus:outline-none"
            placeholder="Write the corrected sentence…"
          />
          <button
            type="button"
            onClick={handleErrorCorrection}
            disabled={!answerInput.trim() || advancing || checking}
            className="mt-4 rounded-xl bg-[#c9972c] px-6 py-2.5 text-sm font-bold text-[#0d1b35] disabled:opacity-50"
          >
            {checking ? "AI checking…" : "Submit for AI check"}
          </button>
        </div>
      );
    }

    if (q.type === "open_writing") {
      const words = countWords(answerInput);
      const minWords = 30;
      return (
        <div className="mt-6">
          <textarea
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            rows={5}
            disabled={advancing || checking}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[#0d1b35] focus:border-[#c9972c] focus:outline-none"
            placeholder="Write 2–3 sentences (40–50 words)…"
          />
          <p className="mt-2 text-xs text-slate-500">
            {words} words · aim for 40–50 words
          </p>
          <button
            type="button"
            onClick={handleWriting}
            disabled={words < minWords || advancing || checking}
            className="mt-4 rounded-xl bg-[#c9972c] px-6 py-2.5 text-sm font-bold text-[#0d1b35] disabled:opacity-50"
          >
            {checking ? "Scoring with AI…" : "Submit for AI Scoring"}
          </button>
        </div>
      );
    }

    return null;
  }, [
    currentQuestion,
    answerInput,
    advancing,
    checking,
    selectedOption,
    handleMcq,
    handleFillBlank,
    handleErrorCorrection,
    handleWriting,
  ]);

  if (checkingRetake) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b35] text-white">
        <p className="text-sm text-slate-300">Loading…</p>
      </div>
    );
  }

  if (phase === "locked" && retakeLock) {
    return (
      <RetakeLockScreen
        lock={retakeLock}
        whatsappHref={whatsappHref}
        onViewResults={() => router.push("/placement-test/results")}
      />
    );
  }

  if (phase === "onboarding") {
    return (
      <PlacementOnboardingForm
        initial={onboardingInitial}
        onStart={startTest}
      />
    );
  }

  if (phase === "finishing") {
    return <FinishingScreen />;
  }

  if (phase === "speaking" && testState) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-[#0d1b35]">
                Question {testState.questionsAsked + 1} of ~{testState.maxQuestions}
              </span>
              <span>{formatMmSs(elapsed)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#c9972c] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-bold text-[#0d1b35]">
              Estimated Band:{" "}
              <span className="text-[#c9972c]">{displayBand.toFixed(1)}</span>
            </p>
          </div>
        </header>
        <SpeakingSection
          currentBand={testState.currentBand}
          onComplete={handleSpeakingComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-[#0d1b35]">
              Question {questionNumber} of ~{testState?.maxQuestions ?? 35}
            </span>
            <span>{formatMmSs(elapsed)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#c9972c] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-[#0d9488]/15 px-3 py-1 text-xs font-bold text-[#0d9488]">
              {currentQuestion ? sectionLabel(currentQuestion.section) : "—"}
            </span>
            <p
              className="text-sm font-bold text-[#0d1b35] transition-all duration-500"
              style={{ opacity: 1 }}
            >
              Estimated Band:{" "}
              <span className="text-[#c9972c]">{displayBand.toFixed(1)}</span>
            </p>
          </div>
        </div>
      </header>

      {(milestone || encouragement) && (
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <p className="rounded-lg bg-[#0d9488]/10 px-4 py-2 text-center text-sm font-medium text-[#0d9488]">
            {milestone || encouragement}
          </p>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-8">
        {currentQuestion?.section === "listening" ? (
          <PlacementListeningAudio
            key={currentQuestion.id}
            question={currentQuestion}
          />
        ) : null}

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {currentQuestion?.type === "open_writing" &&
          getWritingTaskLabel(currentQuestion.id) ? (
            <p className="mb-4 inline-block rounded-full bg-[#0d1b35] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#c9972c]">
              {getWritingTaskLabel(currentQuestion.id)}
            </p>
          ) : null}
          {currentQuestion?.id === "write-task1-data" ? <TourismBarChart /> : null}
          <p
            className={`whitespace-pre-wrap text-base leading-relaxed text-[#0d1b35] ${
              currentQuestion?.id === "write-task1-data" ? "mt-4" : ""
            }`}
          >
            {currentQuestion?.question}
          </p>
          {questionCard}
          {advancing ? (
            <p className="mt-4 text-center text-xs text-slate-500">Loading next question…</p>
          ) : null}
        </article>
      </main>
    </div>
  );
}
