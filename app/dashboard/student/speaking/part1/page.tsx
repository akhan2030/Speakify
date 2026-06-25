"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AudioRecorder from "@/components/AudioRecorder";
import SpeakingEvaluationCard, {
  type SpeakingEvaluationData,
} from "@/components/SpeakingEvaluationCard";
import DailyLimitReached from "@/components/DailyLimitReached";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import {
  PART1_TOPICS,
  getRandomPart1Topic,
  getRandomPart1Questions,
} from "@/lib/speakingQuestions";

type PageState =
  | "topic-select"
  | "question-active"
  | "evaluating"
  | "question-result"
  | "part-complete";

type Part1Topic = (typeof PART1_TOPICS)[number];

type QuestionResult = SpeakingEvaluationData & {
  question: string;
  transcript: string;
  duration: number;
  topic: string;
};

function formatBand(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function average(nums: (number | null | undefined)[]) {
  const valid = nums.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 2) / 2;
}

function TopicIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className ?? "h-8 w-8 text-[#c9972c]";
  if (icon.includes("home")) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls} aria-hidden>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" />
      </svg>
    );
  }
  if (icon.includes("briefcase")) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls} aria-hidden>
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    );
  }
  if (icon.includes("plane")) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls} aria-hidden>
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 20 3c-1.5-1-3 0-4.5 1.5L12 8 3.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.7 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    );
  }
  if (icon.includes("music")) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls} aria-hidden>
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    );
  }
  if (icon.includes("book")) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls} aria-hidden>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  }
  if (icon.includes("heart")) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls} aria-hidden>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls} aria-hidden>
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

export default function SpeakingPart1Page() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isPathway, base, usesProgramShell } = usePathwayStudentContext();
  const studentId = (session?.user as { id?: string })?.id ?? "";

  const [state, setState] = useState<PageState>("topic-select");
  const [selectedTopic, setSelectedTopic] = useState<Part1Topic | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [limitLoading, setLimitLoading] = useState(true);
  const [evalError, setEvalError] = useState<string | null>(null);

  const transcriptRef = useRef("");
  const recorderKeyRef = useRef(0);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (!studentId) {
      setLimitLoading(false);
      return;
    }

    let cancelled = false;

    async function checkLimit() {
      setLimitLoading(true);
      try {
        const res = await fetch(
          `/api/speaking/daily-limit?studentId=${encodeURIComponent(studentId)}`
        );
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok && data) {
          const blocked = !data.unlimited && data.part1 && !data.part1.canTake;
          setLimitBlocked(blocked);
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

  const selectTopic = useCallback((topic: Part1Topic) => {
    setSelectedTopic(topic);
    setQuestions(getRandomPart1Questions(topic.id, 4));
    setCurrentQuestionIndex(0);
    setResults([]);
    transcriptRef.current = "";
    recorderKeyRef.current += 1;
    setEvalError(null);
    setState("question-active");
  }, []);

  const selectRandomTopic = useCallback(() => {
    const topic = getRandomPart1Topic();
    selectTopic(topic);
  }, [selectTopic]);

  const handleSubmitAnswer = useCallback(
    async (transcript: string, duration: number) => {
      if (!studentId || questions.length === 0) return;

      setState("evaluating");
      setEvalError(null);

      const questionText = questions[currentQuestionIndex];

      try {
        const res = await fetch("/api/speaking/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            questionText,
            part: 1,
            taskType: "part1-question",
            studentId,
            expectedDuration: 45,
            duration,
            topic: selectedTopic?.topic ?? "",
            isFirstQuestion: currentQuestionIndex === 0,
          }),
        });

        const evaluation = await res.json().catch(() => null);

        if (!res.ok || !evaluation?.success) {
          throw new Error(evaluation?.error ?? "Evaluation failed");
        }

        setResults((prev) => [
          ...prev,
          {
            question: questionText,
            transcript,
            duration,
            topic: selectedTopic?.topic ?? "",
            bandFC: evaluation.bandFC,
            bandLR: evaluation.bandLR,
            bandGRA: evaluation.bandGRA,
            bandP: evaluation.bandP,
            bandOverall: evaluation.bandOverall,
            feedback: evaluation.feedback,
          },
        ]);

        setState("question-result");
      } catch (err) {
        setEvalError(err instanceof Error ? err.message : "Evaluation failed");
        setState("question-active");
      }
    },
    [studentId, questions, currentQuestionIndex, selectedTopic]
  );

  const goNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
      transcriptRef.current = "";
      recorderKeyRef.current += 1;
      setState("question-active");
    } else {
      setState("part-complete");
    }
  }, [currentQuestionIndex, questions.length]);

  const resetPart = useCallback(() => {
    setState("topic-select");
    setSelectedTopic(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setResults([]);
    transcriptRef.current = "";
    recorderKeyRef.current += 1;
    setEvalError(null);
  }, []);

  if (status === "loading" || status === "unauthenticated" || limitLoading) {
    return <PageSpinner />;
  }

  if (limitBlocked) {
    return <DailyLimitReached variant="part1" />;
  }

  const currentResult = results[results.length - 1];
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  const partAverages = {
    fc: average(results.map((r) => r.bandFC)),
    lr: average(results.map((r) => r.bandLR)),
    gra: average(results.map((r) => r.bandGRA)),
    p: average(results.map((r) => r.bandP)),
    overall: average(results.map((r) => r.bandOverall)),
  };

  return (
    <div className="flex min-h-screen bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="speaking" /> : null}

      <main
        className={`min-h-screen flex-1 bg-slate-50 ${usesProgramShell ? "" : "ml-[200px]"}`}
      >
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            href={`${base}/speaking`}
            className="text-sm font-semibold text-[#0d1b35] hover:text-[#c9972c]"
          >
            ← Back to Speaking
          </Link>

          {state === "topic-select" && (
            <>
              <header className="mt-4">
                <h1 className="text-2xl font-bold text-[#0d1b35]">
                  Part 1 — Introduction
                </h1>
                <p className="mt-2 text-slate-500">Choose a topic to practice</p>
              </header>

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {PART1_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => selectTopic(topic)}
                    className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:border-[#c9972c] hover:shadow-md"
                  >
                    <TopicIcon icon={topic.icon} />
                    <p className="mt-3 text-sm font-bold text-[#0d1b35]">
                      {topic.topic}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">5 questions</p>
                  </button>
                ))}
              </div>

              <div className="mt-10 text-center">
                <p className="text-sm text-slate-500">Or pick a random topic</p>
                <button
                  type="button"
                  onClick={selectRandomTopic}
                  className="mt-3 rounded-xl bg-[#c9972c] px-8 py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
                >
                  Random Topic
                </button>
              </div>
            </>
          )}

          {state === "question-active" && selectedTopic && (
            <>
              <div className="mt-4">
                <p className="text-sm font-semibold text-[#0d1b35]">
                  Part 1 — Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <div className="mt-3 flex gap-2">
                  {questions.map((_, i) => (
                    <span
                      key={i}
                      className={`h-2.5 flex-1 rounded-full ${
                        i < currentQuestionIndex
                          ? "bg-[#c9972c]"
                          : i === currentQuestionIndex
                            ? "animate-pulse bg-[#c9972c]"
                            : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <span className="mt-4 inline-block rounded-full bg-[#c9972c]/15 px-3 py-1 text-xs font-semibold text-[#0d1b35]">
                {selectedTopic.topic}
              </span>

              <div
                className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: "#c9972c" }}
              >
                <p className="text-xl font-bold text-[#0d1b35]">
                  {questions[currentQuestionIndex]}
                </p>
              </div>

              {evalError ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {evalError}
                </p>
              ) : null}

              <div className="mt-6">
                <AudioRecorder
                  key={recorderKeyRef.current}
                  onTranscriptReady={(transcript) => {
                    transcriptRef.current = transcript;
                  }}
                  onRecordingComplete={(_blob, duration) => {
                    handleSubmitAnswer(transcriptRef.current, duration);
                  }}
                  maxDuration={90}
                  minDuration={15}
                  autoSubmit
                />
              </div>

              <p className="mt-4 text-center text-sm text-slate-500">
                Speak naturally for 30-60 seconds
                <br />
                Try to extend your answer with reasons and examples
              </p>
            </>
          )}

          {state === "evaluating" && (
            <div className="mt-20 flex flex-col items-center text-center">
              <span className="h-14 w-14 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
              <h2 className="mt-6 text-xl font-bold text-[#0d1b35]">
                Evaluating your response…
              </h2>
              <p className="mt-2 text-slate-500">
                Our AI examiner is assessing your answer
              </p>
              <p className="mt-2 text-xs text-slate-400">
                This usually takes 5-10 seconds
              </p>
            </div>
          )}

          {state === "question-result" && currentResult && (
            <>
              <header className="mt-4">
                <h1 className="text-xl font-bold text-[#0d1b35]">
                  Question {currentQuestionIndex + 1} Results
                </h1>
              </header>

              <div className="mt-6">
                <SpeakingEvaluationCard
                  evaluation={currentResult}
                  showTranscript
                  hideBandScores={isPathway}
                />
              </div>

              <div className="mt-8">
                {isLastQuestion ? (
                  <button
                    type="button"
                    onClick={() => setState("part-complete")}
                    className="w-full rounded-xl bg-[#c9972c] py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
                  >
                    View Part 1 Results →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNextQuestion}
                    className="w-full rounded-xl bg-[#c9972c] py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
                  >
                    Next Question →
                  </button>
                )}
              </div>
            </>
          )}

          {state === "part-complete" && results.length > 0 && (
            <>
              <header className="mt-4 text-center">
                <span className="text-4xl text-[#c9972c]" aria-hidden>
                  ★
                </span>
                <h1 className="mt-2 text-[28px] font-bold text-[#0d1b35]">
                  Part 1 Complete!
                </h1>
              </header>

              {!isPathway ? (
              <div className="mt-8 text-center">
                <p className="text-6xl font-extrabold text-[#c9972c]">
                  {formatBand(partAverages.overall)}
                </p>
                <p className="mt-2 text-sm text-slate-500">Part 1 Band Score</p>
              </div>
              ) : (
              <div className="mt-8 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/5 p-6 text-center">
                <p className="text-lg font-semibold text-[#0d1b35]">
                  Great work — you completed all Part 1 questions!
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Review your feedback above to keep improving.
                </p>
              </div>
              )}

              {!isPathway ? (
              <>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "FC", value: partAverages.fc },
                  { label: "LR", value: partAverages.lr },
                  { label: "GRA", value: partAverages.gra },
                  { label: "P", value: partAverages.p },
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

              <div className="mt-10 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">#</th>
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">Topic</th>
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">Band</th>
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                        Key Improvement
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 text-slate-600">{i + 1}</td>
                        <td className="px-4 py-3 text-slate-600">{r.topic}</td>
                        <td className="px-4 py-3 font-bold text-[#c9972c]">
                          {formatBand(r.bandOverall)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.feedback.improvements?.[0]?.title ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
              ) : (
              <div className="mt-10 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">#</th>
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">Topic</th>
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                        Key Improvement
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 text-slate-600">{i + 1}</td>
                        <td className="px-4 py-3 text-slate-600">{r.topic}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.feedback.improvements?.[0]?.title ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetPart}
                  className="flex-1 rounded-xl border-2 border-[#0d1b35] py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#0d1b35] hover:text-white"
                >
                  Practice Part 1 Again
                </button>
                <Link
                  href={`${base}/speaking/part2`}
                  className="flex-1 rounded-xl bg-[#c9972c] py-3 text-center text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
                >
                  Go to Part 2 →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
