"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AudioRecorder from "@/components/AudioRecorder";
import DailyLimitReached from "@/components/DailyLimitReached";
import MockSpeakingFeedback from "@/components/speaking/MockSpeakingFeedback";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import {
  generateSpeakingMockFeedback,
  saveSpeakingMockFeedback,
} from "@/lib/speaking/speakingMockFeedback";
import {
  getRandomPart1Topic,
  getRandomPart1Questions,
  getRandomCueCard,
  getPart3Questions,
} from "@/lib/speakingQuestions";

type CueCard = {
  id: number;
  topic: string;
  prompt: string;
  bullets: string[];
};

type EvalResult = {
  bandFC: number;
  bandLR: number;
  bandGRA: number;
  bandP: number;
  bandOverall: number;
  question: string;
  part: 1 | 2 | 3;
};

type MockPhase =
  | "intro"
  | "part1"
  | "part1-transition"
  | "part2-cue"
  | "part2-prep"
  | "part2-speak"
  | "part2-transition"
  | "part3"
  | "evaluating"
  | "complete";

const PREP_TOTAL = 60;
const PART1_COUNT = 3;
const PART3_COUNT = 3;

function formatBand(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function average(nums: number[]) {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 2) / 2;
}

function formatPrepTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MockProgressBar({
  part,
  questionIndex,
  totalQuestions,
}: {
  part: 1 | 2 | 3;
  questionIndex: number;
  totalQuestions: number;
}) {
  const labels = ["Part 1", "Part 2", "Part 3"];
  return (
    <div className="mt-4">
      <div className="flex gap-2">
        {labels.map((label, i) => {
          const partNum = (i + 1) as 1 | 2 | 3;
          const active = part === partNum;
          const done = part > partNum;
          return (
            <div
              key={label}
              className={`flex-1 rounded-lg px-2 py-2 text-center text-xs font-bold ${
                done
                  ? "bg-[#c9972c] text-[#0d1b35]"
                  : active
                    ? "bg-[#0d1b35] text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>
      {totalQuestions > 0 && (
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < questionIndex
                  ? "bg-[#c9972c]"
                  : i === questionIndex
                    ? "animate-pulse bg-[#c9972c]"
                    : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CueCardView({ card }: { card: CueCard }) {
  return (
    <div className="rounded-xl border-2 border-[#0d1b35] bg-[#fafaf7] p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        IELTS Speaking — Part 2
      </p>
      <p className="mt-4 text-lg font-bold text-[#0d1b35]">{card.prompt}</p>
      <p className="mt-5 text-sm font-bold text-[#0d1b35]">You should say:</p>
      <ul className="mt-3 space-y-2">
        {card.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2 text-sm text-slate-700">
            <span className="text-[#0d1b35]">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SpeakingMockPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const studentId = (session?.user as { id?: string })?.id ?? "";

  const [phase, setPhase] = useState<MockPhase>("intro");
  const [part1Topic, setPart1Topic] = useState("");
  const [part1Questions, setPart1Questions] = useState<string[]>([]);
  const [part1Index, setPart1Index] = useState(0);
  const [cueCard, setCueCard] = useState<CueCard | null>(null);
  const [part3Questions, setPart3Questions] = useState<string[]>([]);
  const [part3Index, setPart3Index] = useState(0);
  const [results, setResults] = useState<EvalResult[]>([]);
  const [lastBand, setLastBand] = useState<number | null>(null);
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TOTAL);
  const [prepStarted, setPrepStarted] = useState(false);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [limitLoading, setLimitLoading] = useState(true);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [mockStarted, setMockStarted] = useState(false);

  const transcriptRef = useRef("");
  const recorderKeyRef = useRef(0);

  const initMock = useCallback(() => {
    const topic = getRandomPart1Topic();
    const card = getRandomCueCard() as CueCard;
    setPart1Topic(topic.topic);
    setPart1Questions(getRandomPart1Questions(topic.id, PART1_COUNT));
    setCueCard(card);
    setPart3Questions(getPart3Questions(card.id).slice(0, PART3_COUNT));
    setPart1Index(0);
    setPart3Index(0);
    setResults([]);
    setLastBand(null);
    setPrepTimeLeft(PREP_TOTAL);
    setPrepStarted(false);
    setEvalError(null);
    transcriptRef.current = "";
    recorderKeyRef.current += 1;
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !studentId) return;

    let cancelled = false;

    async function checkLimit() {
      setLimitLoading(true);
      try {
        const res = await fetch(
          `/api/speaking/daily-limit?studentId=${encodeURIComponent(studentId)}`
        );
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok && data) {
          setLimitBlocked(!data.unlimited && data.mock && !data.mock.canTake);
        }
      } finally {
        if (!cancelled) setLimitLoading(false);
      }
    }

    checkLimit();
    return () => {
      cancelled = true;
    };
  }, [status, studentId]);

  useEffect(() => {
    if (phase !== "part2-prep" || !prepStarted) return;

    const id = setInterval(() => {
      setPrepTimeLeft((t) => {
        if (t <= 1) {
          setPhase("part2-speak");
          recorderKeyRef.current += 1;
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [phase, prepStarted]);

  const evaluateAnswer = useCallback(
    async (params: {
      transcript: string;
      questionText: string;
      part: 1 | 2 | 3;
      taskType: string;
      expectedDuration: number;
      duration: number;
      topic: string;
      incrementMockLimit?: boolean;
    }) => {
      if (!studentId) throw new Error("Not signed in");

      const res = await fetch("/api/speaking/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...params,
          studentId,
          isMockSession: true,
          incrementMockLimit: params.incrementMockLimit ?? false,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? "Evaluation failed");
      }

      return data as EvalResult & { success: boolean };
    },
    [studentId]
  );

  const handlePart1Submit = useCallback(
    async (transcript: string, duration: number) => {
      if (!part1Questions.length) return;

      setPhase("evaluating");
      setEvalError(null);

      try {
        const questionText = part1Questions[part1Index];
        const data = await evaluateAnswer({
          transcript,
          questionText,
          part: 1,
          taskType: "mock-part1",
          expectedDuration: 45,
          duration,
          topic: part1Topic,
          incrementMockLimit: !mockStarted,
        });

        if (!mockStarted) setMockStarted(true);

        setResults((prev) => [
          ...prev,
          {
            bandFC: data.bandFC,
            bandLR: data.bandLR,
            bandGRA: data.bandGRA,
            bandP: data.bandP,
            bandOverall: data.bandOverall,
            question: questionText,
            part: 1,
          },
        ]);
        setLastBand(data.bandOverall);

        if (part1Index < part1Questions.length - 1) {
          setPart1Index((i) => i + 1);
          transcriptRef.current = "";
          recorderKeyRef.current += 1;
          setPhase("part1");
        } else {
          setPhase("part1-transition");
        }
      } catch (err) {
        setEvalError(err instanceof Error ? err.message : "Evaluation failed");
        setPhase("part1");
      }
    },
    [part1Questions, part1Index, part1Topic, evaluateAnswer, mockStarted]
  );

  const handlePart2Submit = useCallback(
    async (transcript: string, duration: number) => {
      if (!cueCard) return;

      setPhase("evaluating");
      setEvalError(null);

      const questionText = `${cueCard.prompt} Cover these points: ${cueCard.bullets.join(", ")}`;

      try {
        const data = await evaluateAnswer({
          transcript,
          questionText,
          part: 2,
          taskType: "mock-part2",
          expectedDuration: 120,
          duration,
          topic: cueCard.topic,
        });

        setResults((prev) => [
          ...prev,
          {
            bandFC: data.bandFC,
            bandLR: data.bandLR,
            bandGRA: data.bandGRA,
            bandP: data.bandP,
            bandOverall: data.bandOverall,
            question: cueCard.prompt,
            part: 2,
          },
        ]);
        setLastBand(data.bandOverall);
        setPhase("part2-transition");
      } catch (err) {
        setEvalError(err instanceof Error ? err.message : "Evaluation failed");
        setPhase("part2-speak");
      }
    },
    [cueCard, evaluateAnswer]
  );

  const handlePart3Submit = useCallback(
    async (transcript: string, duration: number) => {
      if (!part3Questions.length) return;

      setPhase("evaluating");
      setEvalError(null);

      try {
        const questionText = part3Questions[part3Index];
        const data = await evaluateAnswer({
          transcript,
          questionText,
          part: 3,
          taskType: "mock-part3",
          expectedDuration: 60,
          duration,
          topic: cueCard?.topic ?? "",
        });

        setResults((prev) => [
          ...prev,
          {
            bandFC: data.bandFC,
            bandLR: data.bandLR,
            bandGRA: data.bandGRA,
            bandP: data.bandP,
            bandOverall: data.bandOverall,
            question: questionText,
            part: 3,
          },
        ]);
        setLastBand(data.bandOverall);

        if (part3Index < part3Questions.length - 1) {
          setPart3Index((i) => i + 1);
          transcriptRef.current = "";
          recorderKeyRef.current += 1;
          setPhase("part3");
        } else {
          setPhase("complete");
        }
      } catch (err) {
        setEvalError(err instanceof Error ? err.message : "Evaluation failed");
        setPhase("part3");
      }
    },
    [part3Questions, part3Index, cueCard, evaluateAnswer]
  );

  const startMock = useCallback(() => {
    initMock();
    setMockStarted(false);
    setPhase("part1");
  }, [initMock]);

  const scoreSummary = useMemo(() => {
    const part1Results = results.filter((r) => r.part === 1);
    const part2Results = results.filter((r) => r.part === 2);
    const part3Results = results.filter((r) => r.part === 3);

    const part1Avg = {
      fc: average(part1Results.map((r) => r.bandFC)),
      lr: average(part1Results.map((r) => r.bandLR)),
      gra: average(part1Results.map((r) => r.bandGRA)),
      p: average(part1Results.map((r) => r.bandP)),
      overall: average(part1Results.map((r) => r.bandOverall)),
    };
    const part2Avg = part2Results[0]
      ? {
          fc: part2Results[0].bandFC,
          lr: part2Results[0].bandLR,
          gra: part2Results[0].bandGRA,
          p: part2Results[0].bandP,
          overall: part2Results[0].bandOverall,
        }
      : null;
    const part3Avg = {
      fc: average(part3Results.map((r) => r.bandFC)),
      lr: average(part3Results.map((r) => r.bandLR)),
      gra: average(part3Results.map((r) => r.bandGRA)),
      p: average(part3Results.map((r) => r.bandP)),
      overall: average(part3Results.map((r) => r.bandOverall)),
    };

    return {
      part1Avg,
      part2Avg,
      part3Avg,
      mockOverall: average(
        results.map((r) => r.bandOverall).filter((n) => Number.isFinite(n))
      ),
      mockFC: average(results.map((r) => r.bandFC)),
      mockLR: average(results.map((r) => r.bandLR)),
      mockGRA: average(results.map((r) => r.bandGRA)),
      mockP: average(results.map((r) => r.bandP)),
    };
  }, [results]);

  const personalizedFeedback = useMemo(() => {
    const { mockOverall, mockFC, mockLR, mockGRA, mockP, part1Avg, part2Avg, part3Avg } =
      scoreSummary;
    if (
      mockOverall === null ||
      mockFC === null ||
      mockLR === null ||
      mockGRA === null ||
      mockP === null
    ) {
      return null;
    }
    return generateSpeakingMockFeedback({
      overall: mockOverall,
      fc: mockFC,
      lr: mockLR,
      gra: mockGRA,
      p: mockP,
      part1: part1Avg.overall,
      part2: part2Avg?.overall ?? null,
      part3: part3Avg.overall,
    });
  }, [scoreSummary]);

  useEffect(() => {
    if (phase === "complete" && personalizedFeedback) {
      saveSpeakingMockFeedback(personalizedFeedback);
    }
  }, [phase, personalizedFeedback]);

  if (status === "loading" || status === "unauthenticated" || limitLoading) {
    return <PageSpinner />;
  }

  if (limitBlocked) {
    return <DailyLimitReached variant="speaking-mock" />;
  }

  const { part1Avg, part2Avg, part3Avg, mockOverall, mockFC, mockLR, mockGRA, mockP } =
    scoreSummary;

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="speaking" />

      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            href="/dashboard/student/speaking"
            className="text-sm font-semibold text-[#0d1b35] hover:text-[#c9972c]"
          >
            ← Back to Speaking
          </Link>

          {phase === "intro" && (
            <>
              <header className="mt-4">
                <span className="inline-block rounded-full bg-[#0d1b35] px-3 py-1 text-xs font-bold text-[#c9972c]">
                  Full Mock Test
                </span>
                <h1 className="mt-3 text-[28px] font-bold text-[#0d1b35]">
                  IELTS Speaking Mock Exam
                </h1>
                <p className="mt-2 text-slate-500">
                  Complete all 3 parts in sequence — just like the real test
                </p>
              </header>

              <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-bold text-[#0d1b35]">What to expect</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex gap-3">
                    <span className="font-bold text-[#c9972c]">Part 1</span>
                    <span>{PART1_COUNT} introduction questions (~4 min)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#0d9488]">Part 2</span>
                    <span>Cue card with 1 min prep + 2 min speaking (~3 min)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-[#7c3aed]">Part 3</span>
                    <span>{PART3_COUNT} discussion questions (~4 min)</span>
                  </li>
                </ul>
                <p className="mt-4 text-xs text-slate-400">
                  Allow ~12 minutes. You will receive a full band score report at the end.
                </p>
              </div>

              <button
                type="button"
                onClick={startMock}
                className="mt-8 w-full rounded-xl bg-[#c9972c] py-4 text-base font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
              >
                Start Full Mock Test →
              </button>
            </>
          )}

          {phase === "part1" && part1Questions.length > 0 && (
            <>
              <MockProgressBar part={1} questionIndex={part1Index} totalQuestions={PART1_COUNT} />
              <span className="mt-4 inline-block rounded-full bg-[#c9972c]/15 px-3 py-1 text-xs font-semibold text-[#0d1b35]">
                {part1Topic}
              </span>
              <div
                className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: "#c9972c" }}
              >
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Part 1 — Question {part1Index + 1} of {PART1_COUNT}
                </p>
                <p className="mt-3 text-xl font-bold text-[#0d1b35]">
                  {part1Questions[part1Index]}
                </p>
              </div>
              {evalError ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {evalError}
                </p>
              ) : null}
              <div className="mt-6">
                <AudioRecorder
                  key={`p1-${recorderKeyRef.current}`}
                  onTranscriptReady={(t) => {
                    transcriptRef.current = t;
                  }}
                  onRecordingComplete={(_blob, duration) => {
                    handlePart1Submit(transcriptRef.current, duration);
                  }}
                  maxDuration={90}
                  minDuration={10}
                  autoSubmit
                />
              </div>
            </>
          )}

          {phase === "part1-transition" && (
            <div className="mt-12 text-center">
              <p className="text-sm font-semibold text-[#c9972c]">Part 1 Complete</p>
              <p className="mt-2 text-4xl font-bold text-[#0d1b35]">
                {formatBand(part1Avg.overall)}
              </p>
              <p className="mt-1 text-sm text-slate-500">Part 1 average band</p>
              <button
                type="button"
                onClick={() => {
                  setPhase("part2-cue");
                  setPrepTimeLeft(PREP_TOTAL);
                  setPrepStarted(false);
                }}
                className="mt-8 w-full rounded-xl bg-[#0d9488] py-3 text-sm font-bold text-white hover:bg-[#0b7c72]"
              >
                Continue to Part 2 — Cue Card →
              </button>
            </div>
          )}

          {phase === "part2-cue" && cueCard && (
            <>
              <MockProgressBar part={2} questionIndex={0} totalQuestions={0} />
              <div className="mt-6">
                <CueCardView card={cueCard} />
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhase("part2-prep");
                  setPrepStarted(true);
                }}
                className="mt-8 w-full rounded-xl bg-[#0d9488] py-3 text-sm font-bold text-white hover:bg-[#0b7c72]"
              >
                Start 1-Minute Preparation →
              </button>
            </>
          )}

          {phase === "part2-prep" && cueCard && (
            <>
              <MockProgressBar part={2} questionIndex={0} totalQuestions={0} />
              <div className="mt-12 text-center">
                <p className="text-sm font-semibold text-slate-500">Preparation time</p>
                <p className="mt-4 text-6xl font-bold text-[#0d9488]">
                  {formatPrepTime(prepTimeLeft)}
                </p>
                <p className="mt-6 text-sm text-slate-500">
                  Make notes on your cue card. Recording starts automatically.
                </p>
              </div>
              <div className="mt-6">
                <CueCardView card={cueCard} />
              </div>
            </>
          )}

          {phase === "part2-speak" && cueCard && (
            <>
              <MockProgressBar part={2} questionIndex={0} totalQuestions={0} />
              <p className="mt-4 text-sm font-semibold text-[#0d9488]">
                Part 2 — Speak for 1–2 minutes
              </p>
              <div className="mt-4">
                <CueCardView card={cueCard} />
              </div>
              {evalError ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {evalError}
                </p>
              ) : null}
              <div className="mt-6">
                <AudioRecorder
                  key={`p2-${recorderKeyRef.current}`}
                  onTranscriptReady={(t) => {
                    transcriptRef.current = t;
                  }}
                  onRecordingComplete={(_blob, duration) => {
                    handlePart2Submit(transcriptRef.current, duration);
                  }}
                  maxDuration={150}
                  minDuration={30}
                  autoSubmit
                />
              </div>
            </>
          )}

          {phase === "part2-transition" && (
            <div className="mt-12 text-center">
              <p className="text-sm font-semibold text-[#0d9488]">Part 2 Complete</p>
              <p className="mt-2 text-4xl font-bold text-[#0d1b35]">
                {formatBand(part2Avg?.overall ?? lastBand)}
              </p>
              <p className="mt-1 text-sm text-slate-500">Part 2 band score</p>
              <button
                type="button"
                onClick={() => {
                  setPart3Index(0);
                  transcriptRef.current = "";
                  recorderKeyRef.current += 1;
                  setPhase("part3");
                }}
                className="mt-8 w-full rounded-xl bg-[#7c3aed] py-3 text-sm font-bold text-white hover:bg-[#6d28d9]"
              >
                Continue to Part 3 — Discussion →
              </button>
            </div>
          )}

          {phase === "part3" && part3Questions.length > 0 && (
            <>
              <MockProgressBar part={3} questionIndex={part3Index} totalQuestions={PART3_COUNT} />
              <div
                className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: "#7c3aed" }}
              >
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Part 3 — Question {part3Index + 1} of {PART3_COUNT}
                </p>
                <p className="mt-3 text-xl font-bold text-[#0d1b35]">
                  {part3Questions[part3Index]}
                </p>
              </div>
              {evalError ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {evalError}
                </p>
              ) : null}
              <div className="mt-6">
                <AudioRecorder
                  key={`p3-${recorderKeyRef.current}`}
                  onTranscriptReady={(t) => {
                    transcriptRef.current = t;
                  }}
                  onRecordingComplete={(_blob, duration) => {
                    handlePart3Submit(transcriptRef.current, duration);
                  }}
                  maxDuration={120}
                  minDuration={15}
                  autoSubmit
                />
              </div>
            </>
          )}

          {phase === "evaluating" && (
            <div className="mt-20 flex flex-col items-center text-center">
              <span className="h-14 w-14 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
              <h2 className="mt-6 text-xl font-bold text-[#0d1b35]">
                Evaluating your response…
              </h2>
              <p className="mt-2 text-slate-500">Official IELTS criteria applied</p>
              {lastBand !== null && (
                <p className="mt-4 text-sm text-slate-400">
                  Previous response: Band {formatBand(lastBand)}
                </p>
              )}
            </div>
          )}

          {phase === "complete" && (
            <>
              <header className="mt-4 text-center">
                <span className="text-4xl text-[#c9972c]" aria-hidden>
                  ★
                </span>
                <h1 className="mt-2 text-[28px] font-bold text-[#0d1b35]">
                  Mock Test Complete!
                </h1>
                <p className="mt-2 text-slate-500">Full speaking mock band report</p>
              </header>

              <div className="mt-8 text-center">
                <p className="text-6xl font-extrabold text-[#c9972c]">
                  {formatBand(mockOverall)}
                </p>
                <p className="mt-2 text-sm text-slate-500">Overall Speaking Band</p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "FC", value: mockFC },
                  { label: "LR", value: mockLR },
                  { label: "GRA", value: mockGRA },
                  { label: "P", value: mockP },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
                  >
                    <p className="text-xs font-bold text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-[#c9972c]">
                      {formatBand(item.value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Part 1", avg: part1Avg.overall, color: "#c9972c" },
                  { label: "Part 2", avg: part2Avg?.overall ?? null, color: "#0d9488" },
                  { label: "Part 3", avg: part3Avg.overall, color: "#7c3aed" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
                  >
                    <p className="text-sm font-bold" style={{ color: item.color }}>
                      {item.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#0d1b35]">
                      {formatBand(item.avg)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">Part</th>
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">Question</th>
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-[#0d1b35]">
                          Part {r.part}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                          {r.question}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#c9972c]">
                          {formatBand(r.bandOverall)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {personalizedFeedback ? (
                <MockSpeakingFeedback feedback={personalizedFeedback} />
              ) : null}

              <div className="mt-10 flex flex-col gap-3">
                <Link
                  href="/dashboard/student/speaking/improvement-plan"
                  className="w-full rounded-xl bg-[#0d1b35] py-3.5 text-center text-sm font-bold text-white hover:bg-[#1a2d4d]"
                >
                  View My Improvement Plan →
                </Link>
                <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    initMock();
                    setMockStarted(false);
                    setPhase("intro");
                  }}
                  className="flex-1 rounded-xl bg-[#c9972c] py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
                >
                  Take Another Mock
                </button>
                <Link
                  href="/dashboard/student/speaking"
                  className="flex-1 rounded-xl border border-[#0d1b35] py-3 text-center text-sm font-bold text-[#0d1b35] hover:bg-[#0d1b35] hover:text-white"
                >
                  Back to Speaking Hub
                </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
