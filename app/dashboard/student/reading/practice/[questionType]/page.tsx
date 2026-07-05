"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ReadingTimer from "@/components/ReadingTimer";
import ScreenLock from "@/components/ScreenLock";
import DailyLimitReached from "@/components/DailyLimitReached";
import { useReadingTimer } from "@/lib/readingTimer";
import { isValidQuestionType, normalizeQuestionType } from "@/lib/readingPassageTypes";
import { READING_INCOMPLETE_UI_TYPES } from "@/lib/readingQuestionContent.js";
import { initDailyLimit, fetchPassage } from "@/lib/useDailyLimitGate";
import type { DailyLimitState } from "@/lib/useDailyLimitGate";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import MatchingHeadingsPanel from "@/components/reading/MatchingHeadingsPanel";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";

const PRACTICE_DURATION_SECONDS = 1200;

type Difficulty = "Easy" | "Medium" | "Hard";

type PracticeQuestion = {
  id: string;
  kind: string;
  text: string;
  options?: { key: string; label: string }[];
  headings?: { key: string; label: string }[];
};

type PracticeContent = {
  passageId: string;
  slug: string;
  name: string;
  difficulty: Difficulty;
  instructions: string;
  title: string;
  paragraphs: { id: string; label: string; text: string }[];
  questions: PracticeQuestion[];
  headings?: { key: string; label: string }[];
};

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

const TFNG_OPTIONS = ["TRUE", "FALSE", "NOT GIVEN"];

function QuestionInputs({
  content,
  answers,
  onChange,
}: {
  content: PracticeContent;
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  const sharedHeadings =
    content.headings ??
    content.questions.find((q) => q.headings?.length)?.headings ??
    [];

  if (content.slug === "matching-headings" && sharedHeadings.length > 0) {
    return (
      <MatchingHeadingsPanel
        headings={sharedHeadings}
        questions={content.questions}
        answers={answers}
        onChange={onChange}
      />
    );
  }

  return (
    <div className="space-y-6">
      {content.questions.map((question, index) => (
        <div
          key={question.id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <p className="text-sm font-semibold text-[#0d1b35]">
            {index + 1}. {question.text}
          </p>

          {question.kind === "multiple-choice" && question.options ? (
            <div className="mt-3 space-y-2">
              {question.options.map((option) => (
                <label
                  key={option.key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.key}
                    checked={answers[question.id] === option.key}
                    onChange={() => onChange(question.id, option.key)}
                    className="text-[#0d1b35]"
                  />
                  <span className="text-slate-700">
                    <strong className="text-[#0d1b35]">{option.key}.</strong>{" "}
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          ) : null}

          {question.kind === "true-false-not-given" ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {TFNG_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={() => onChange(question.id, option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          ) : null}

          {question.kind === "matching-headings" && question.headings ? (
            <select
              value={answers[question.id] ?? ""}
              onChange={(e) => onChange(question.id, e.target.value)}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select a heading…</option>
              {question.headings.map((heading) => (
                <option key={heading.key} value={heading.key}>
                  {heading.key}. {heading.label}
                </option>
              ))}
            </select>
          ) : null}

          {question.kind === "sentence-completion" ||
          question.kind === "short-answer" ? (
            <input
              type="text"
              value={answers[question.id] ?? ""}
              onChange={(e) => onChange(question.id, e.target.value)}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Your answer"
            />
          ) : null}

          {question.kind !== "multiple-choice" &&
          question.kind !== "true-false-not-given" &&
          question.kind !== "matching-headings" &&
          question.kind !== "sentence-completion" &&
          question.kind !== "short-answer" ? (
            <input
              type="text"
              value={answers[question.id] ?? ""}
              onChange={(e) => onChange(question.id, e.target.value)}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Your answer"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function ReadingPracticePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { base, usesProgramShell } = usePathwayStudentContext();

  const slug = normalizeQuestionType(String(params?.questionType ?? ""));
  const studentId = (session?.user as { id?: string })?.id ?? "";

  const [limits, setLimits] = useState<DailyLimitState | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [limitLoading, setLimitLoading] = useState(true);
  const [passageLoading, setPassageLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [content, setContent] = useState<PracticeContent | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, string>>({});

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hoveredParagraph, setHoveredParagraph] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    accuracy: number;
    estimatedBand: number;
  } | null>(null);
  const [showScreenLock, setShowScreenLock] = useState(false);

  const answersRef = useRef(answers);
  const submittedRef = useRef(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !studentId || !isValidQuestionType(slug)) {
      return;
    }

    let cancelled = false;

    async function loadPassage() {
      setLimitLoading(true);
      setPassageLoading(false);
      setLoadError(null);
      setContent(null);
      setAnswers({});
      setResult(null);
      setShowScreenLock(false);
      submittedRef.current = false;
      startTimeRef.current = Date.now();

      try {
        const { limits: limitData, allowed: canStart } =
          await initDailyLimit(studentId, "practice");

        if (cancelled) return;

        setLimits(limitData);
        if (!canStart) {
          setAllowed(false);
          return;
        }

        setAllowed(true);
        setLimitLoading(false);
        setPassageLoading(true);

        const { passage, correctAnswers: correct } = await fetchPassage(
          studentId,
          slug,
          "practice"
        );

        if (cancelled) return;

        setContent(passage as PracticeContent);
        setCorrectAnswers(correct);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load passage"
          );
        }
      } finally {
        if (!cancelled) {
          setLimitLoading(false);
          setPassageLoading(false);
        }
      }
    }

    loadPassage();
    return () => {
      cancelled = true;
    };
  }, [status, studentId, slug]);

  const submitAnswers = useCallback(
    async (timedOut = false) => {
      if (!content || submittedRef.current) return;
      submittedRef.current = true;

      setSubmitting(true);
      const timeTakenSeconds = Math.max(
        0,
        Math.round((Date.now() - startTimeRef.current) / 1000)
      );

      try {
        const res = await fetch("/api/reading/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passageId: content.passageId,
            questionType: slug,
            answers: answersRef.current,
            correctAnswers,
            timeTakenSeconds,
            timedOut,
          }),
        });

        const data = await res.json().catch(() => null);
        if (res.ok && data?.success) {
          setResult({
            score: data.score,
            total: data.total,
            accuracy: data.accuracy,
            estimatedBand: data.estimatedBand,
          });
          if (timedOut) setShowScreenLock(true);
        }
      } catch {
        submittedRef.current = false;
      } finally {
        setSubmitting(false);
      }
    },
    [content, slug, correctAnswers]
  );

  const handleTimeUp = useCallback(() => {
    submitAnswers(true);
  }, [submitAnswers]);

  const timer = useReadingTimer({
    durationSeconds: PRACTICE_DURATION_SECONDS,
    onTimeUp: handleTimeUp,
    autoStart: Boolean(content),
  });

  const allAnswered = useMemo(() => {
    if (!content) return false;
    return content.questions.every((q) => Boolean(answers[q.id]?.trim()));
  }, [content, answers]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  if (!isValidQuestionType(slug)) {
    return (
      <div className="min-h-screen flex bg-white">
        {!usesProgramShell ? <StudentSidebar activePage="reading" /> : null}
        <main className={`flex-1 bg-slate-50 p-8 ${usesProgramShell ? "" : "ml-[200px]"}`}>
          <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-[#0d1b35]">Question type not found</h1>
            <Link
              href={`${base}/reading/practice`}
              className="mt-6 inline-flex rounded-xl bg-[#0d1b35] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#152a4d]"
            >
              Choose a Question Type
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (READING_INCOMPLETE_UI_TYPES.has(slug)) {
    return (
      <div className="min-h-screen flex bg-white">
        {!usesProgramShell ? <StudentSidebar activePage="reading" /> : null}
        <main className={`flex-1 bg-slate-50 p-8 ${usesProgramShell ? "" : "ml-[200px]"}`}>
          <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-[#0d1b35]">Coming soon</h1>
            <p className="mt-3 text-sm text-slate-600">
              Exam-style practice for{" "}
              <span className="font-medium">{slug.replace(/-/g, " ")}</span> is in development.
              Choose another question type for now.
            </p>
            <Link
              href={`${base}/reading/practice`}
              className="mt-6 inline-flex rounded-xl bg-[#0d1b35] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#152a4d]"
            >
              Back to question types
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (limitLoading) {
    return <PageSpinner />;
  }

  if (limits && !allowed && !limits.unlimited) {
    return <DailyLimitReached variant="practice" />;
  }

  if (passageLoading || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b35] text-white">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
        <p className="mt-6 text-lg font-semibold">Preparing your unique passage…</p>
        <p className="mt-2 text-sm text-slate-400">Loading a passage you have never seen before</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex bg-white">
        {!usesProgramShell ? <StudentSidebar activePage="reading" /> : null}
        <main className={`flex-1 bg-slate-50 p-8 ${usesProgramShell ? "" : "ml-[200px]"}`}>
          <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-white p-8 text-center">
            <p className="text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-[#0d1b35] px-6 py-2.5 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="reading" /> : null}

      <ReadingTimer
        timeRemaining={timer.timeRemaining}
        formattedTime={timer.formattedTime}
        timerColor={timer.timerColor as "green" | "amber" | "red"}
        totalSeconds={PRACTICE_DURATION_SECONDS}
      />

      <ScreenLock
        isVisible={showScreenLock}
        score={result?.score ?? null}
        total={result?.total ?? null}
        onViewResults={() =>
          router.push(
            `${base}/reading/results?score=${result?.score ?? 0}&total=${result?.total ?? 0}&type=${slug}`
          )
        }
      />

      <main className={`min-h-screen flex-1 bg-slate-50 ${usesProgramShell ? "" : "ml-[200px]"}`}>
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 pr-[180px]">
            <Link
              href={`${base}/reading`}
              className="text-sm font-semibold text-[#0d1b35] hover:text-[#c9972c]"
            >
              ← Exit Practice
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-lg font-bold text-[#0d1b35]">{content.name}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_CLASS[content.difficulty]}`}
              >
                {content.difficulty}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#0d1b35]">{content.title}</h2>
              <div className="mt-4 space-y-4">
                {content.paragraphs.map((paragraph) => (
                  <div
                    key={paragraph.id}
                    onMouseEnter={() => setHoveredParagraph(paragraph.id)}
                    onMouseLeave={() => setHoveredParagraph(null)}
                    className={`rounded-lg border px-4 py-3 transition-colors ${
                      hoveredParagraph === paragraph.id
                        ? "border-[#c9972c] bg-[#c9972c]/5"
                        : "border-transparent bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {paragraph.label}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {paragraph.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
                {content.instructions}
              </div>

              <QuestionInputs
                content={content}
                answers={answers}
                onChange={(id, value) =>
                  setAnswers((prev) => ({ ...prev, [id]: value }))
                }
              />

              {result && !showScreenLock ? (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
                  <p className="font-bold text-green-800">
                    Score: {result.score} / {result.total}
                  </p>
                  <p className="mt-1 text-green-700">
                    Accuracy: {result.accuracy}% · Est. Band: {result.estimatedBand}
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                disabled={!allAnswered || submitting || timer.isTimedOut}
                onClick={() => submitAnswers(false)}
                className="mt-4 w-full rounded-xl bg-[#0d1b35] py-3 text-sm font-bold text-white transition-colors hover:bg-[#152a4d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Answers"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
