"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReadingTimer from "@/components/ReadingTimer";
import ScreenLock from "@/components/ScreenLock";
import {
  ExamHighlightQuestionText,
  ExamHighlightSection,
  HighlightableInlineText,
  HighlightableMcqOption,
  HighlightableTfngOptions,
} from "@/components/exam/ExamHighlightSection";
import type { TextHighlight } from "@/lib/examHighlight";
import { useReadingTimer } from "@/lib/readingTimer";
import {
  buildMockCorrectAnswers,
  FULL_MOCK_TEST,
} from "@/lib/readingMockTestContent";
import { buildTestResults, storeTestResults } from "@/lib/readingTestUtils";

const TFNG_OPTIONS = ["TRUE", "FALSE", "NOT GIVEN"];

type MockTestConfig = typeof FULL_MOCK_TEST;
type MockPassage = MockTestConfig["passages"][number];
type MockQuestion = MockPassage["questions"][number];

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

function isMcqQuestion(
  question: MockQuestion,
  typeSlug?: string
): question is MockQuestion & {
  options: NonNullable<MockQuestion["options"]>;
} {
  const kind = String(question.kind ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  return (
    (kind === "multiple-choice" || typeSlug === "multiple-choice") &&
    Array.isArray(question.options) &&
    question.options.length > 0
  );
}

function MockQuestionInput({
  question,
  value,
  onChange,
}: {
  question: MockQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  // Normalize as string so practice-only kinds aren't blocked by MockQuestion's narrower union.
  const kind = String(question.kind ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (isMcqQuestion(question, question.typeSlug)) {
    return (
      <div className="mt-3 space-y-2">
        {question.options.map((option) => (
          <HighlightableMcqOption
            key={option.key}
            blockId={`rq-${question.id}-opt-${option.key}`}
            letter={option.key}
            text={option.label}
            name={question.id}
            checked={value === option.key}
            onSelect={() => onChange(option.key)}
          />
        ))}
      </div>
    );
  }

  if (kind === "true-false-not-given") {
    return (
      <HighlightableTfngOptions
        blockIdPrefix={`rq-tfng-${question.id}`}
        name={question.id}
        options={TFNG_OPTIONS}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (kind === "matching-headings" && question.headings) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">Select a heading…</option>
        {question.headings.map((heading) => (
          <option key={heading.key} value={heading.key}>
            {heading.key}. {heading.label}
          </option>
        ))}
      </select>
    );
  }

  if (kind === "matching-information") {
    const letters =
      question.options?.map((o) => o.key) ??
      ["A", "B", "C", "D", "E", "F", "G"];
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">Select a paragraph…</option>
        {letters.map((letter) => (
          <option key={letter} value={letter}>
            {letter}
          </option>
        ))}
      </select>
    );
  }

  if (kind === "classification") {
    const categories = question.options?.length
      ? question.options
      : ["A", "B", "C", "D"].map((key) => ({ key, label: key }));
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">Select a category…</option>
        {categories.map((cat) => (
          <option key={cat.key} value={cat.key}>
            {cat.key}. {cat.label.replace(/^[A-D]\.\s*/, "")}
          </option>
        ))}
      </select>
    );
  }

  if (kind === "matching-sentence-endings") {
    const endings = question.options?.length
      ? question.options
      : ["A", "B", "C", "D", "E", "F"].map((key) => ({ key, label: key }));
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">Select an ending…</option>
        {endings.map((ending) => (
          <option key={ending.key} value={ending.key}>
            {ending.key}. {ending.label}
          </option>
        ))}
      </select>
    );
  }

  if (kind === "matching-features") {
    const features = question.options?.length
      ? question.options
      : ["A", "B", "C", "D", "E"].map((key) => ({ key, label: key }));
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">Select a feature…</option>
        {features.map((feature) => (
          <option key={feature.key} value={feature.key}>
            {feature.key}. {feature.label.replace(/^[A-F]\.\s*/, "")}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      placeholder="Your answer"
    />
  );
}

export type ReadingTestShellProps = {
  config: MockTestConfig;
  exitHref?: string;
  resultsQuery?: string;
  dailyTestsUsed?: number | null;
  dailyTestsMax?: number;
};

export default function ReadingTestShell({
  config,
  exitHref = "/dashboard/student/reading",
  resultsQuery = "testType=full",
  dailyTestsUsed = null,
  dailyTestsMax = 10,
}: ReadingTestShellProps) {
  const router = useRouter();
  const resultsHref = `${exitHref.replace(/\/$/, "")}/results?${resultsQuery}`;
  const correctAnswers = useMemo(
    () => buildMockCorrectAnswers(config),
    [config]
  );

  const [activePassageIndex, setActivePassageIndex] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showScreenLock, setShowScreenLock] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    score: number;
    total: number;
  } | null>(null);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);

  const answersRef = useRef(answers);
  const submittedRef = useRef(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const activePassage = config.passages[activePassageIndex];
  const allQuestions = useMemo(
    () => config.passages.flatMap((p) => p.questions),
    [config]
  );

  const answeredCount = useMemo(
    () =>
      allQuestions.filter((q) => Boolean(answers[q.id]?.trim())).length,
    [allQuestions, answers]
  );

  const isPassageComplete = useCallback(
    (passage: MockPassage) =>
      passage.questions.every((q) => Boolean(answers[q.id]?.trim())),
    [answers]
  );

  const submitTest = useCallback(
    async (timedOut = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);

      const timeTakenSeconds = Math.max(
        0,
        Math.round((Date.now() - startTimeRef.current) / 1000)
      );

      const results = buildTestResults(
        answersRef.current,
        correctAnswers,
        config
      );

      try {
        const res = await fetch("/api/reading/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testType: config.passages.length > 1 ? "full" : "passage",
            testId: config.testId,
            passageId: config.testId,
            questionType:
              config.passages.length > 1 ? "full-mock-test" : "passage-test",
            answers: answersRef.current,
            correctAnswers,
            timeTakenSeconds,
            timedOut,
            passageBreakdown: results.passageBreakdown,
            typeBreakdown: results.typeBreakdown,
          }),
        });

        const data = await res.json().catch(() => null);
        if (res.ok && data?.success) {
          const payload = {
            ...results,
            timeTakenSeconds,
            timedOut,
            score: data.score ?? results.score,
            total: data.total ?? results.total,
            accuracy: data.accuracy ?? results.accuracy,
            estimatedBand: data.estimatedBand ?? results.estimatedBand,
          };
          storeTestResults(payload);
          setSubmitResult({ score: payload.score, total: payload.total });
          if (timedOut) {
            setShowScreenLock(true);
          } else {
            router.push(resultsHref);
          }
        } else {
          submittedRef.current = false;
        }
      } catch {
        submittedRef.current = false;
      } finally {
        setSubmitting(false);
      }
    },
    [config, correctAnswers, resultsHref, router]
  );

  const handleTimeUp = useCallback(() => {
    submitTest(true);
  }, [submitTest]);

  const timer = useReadingTimer({
    durationSeconds: config.durationSeconds,
    onTimeUp: handleTimeUp,
    autoStart: true,
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      console.log(
        "[ReadingTimer]",
        "timeRemaining:",
        timer.timeRemaining,
        "formatted:",
        timer.formattedTime,
        "running:",
        timer.isRunning
      );
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [timer.timeRemaining, timer.formattedTime, timer.isRunning]);

  const scrollToQuestion = (globalNumber: number) => {
    setCurrentQuestionNumber(globalNumber);
    const passageIdx = config.passages.findIndex(
      (p) => globalNumber >= p.startNumber && globalNumber <= p.endNumber
    );
    if (passageIdx >= 0) setActivePassageIndex(passageIdx);
    const el = document.getElementById(`question-${globalNumber}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const groupedQuestions = useMemo(() => {
    /** @type {{ label: string, questions: MockQuestion[] }[]} */
    const groups = [];
    let currentLabel = "";
    for (const q of activePassage?.questions ?? []) {
      const label = q.groupLabel ?? q.typeLabel;
      if (label !== currentLabel) {
        groups.push({ label, questions: [q] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].questions.push(q);
      }
    }
    return groups;
  }, [activePassage]);

  const isLastPassage = activePassageIndex === config.passages.length - 1;
  const isFirstPassage = activePassageIndex === 0;

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <ScreenLock
        isVisible={showScreenLock}
        score={submitResult?.score ?? null}
        total={submitResult?.total ?? null}
        onViewResults={() => router.push(resultsHref)}
      />

      {/* Top bar — offset for IELTS sidebar (240px) so Settings/Logout stay reachable */}
      <header className="fixed left-0 right-0 top-0 z-50 bg-[#0d1b35] text-white shadow-lg md:left-[240px]">
        <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(9rem,auto)] sm:gap-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href={exitHref}
              className="hidden shrink-0 text-sm text-slate-300 hover:text-white sm:inline"
            >
              ← Exit
            </Link>
            <h1 className="truncate text-sm font-bold sm:text-base">
              {config.title}
            </h1>
            {dailyTestsUsed !== null ? (
              <span className="hidden shrink-0 rounded-full bg-[#c9972c]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#c9972c] lg:inline">
                {dailyTestsUsed}/{dailyTestsMax} tests today
              </span>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-center">
            <ReadingTimer
              embedded
              timeRemaining={timer.timeRemaining}
              formattedTime={timer.formattedTime}
              timerColor={timer.timerColor as "green" | "amber" | "red"}
              totalSeconds={config.durationSeconds}
            />
          </div>

          <div className="flex shrink-0 flex-col items-end justify-center whitespace-nowrap text-right text-[11px] leading-tight sm:text-sm sm:leading-snug">
            <span>
              Passage {activePassage?.index ?? 1} of {config.passages.length}
            </span>
            <span className="text-slate-300">
              {answeredCount}/{config.totalQuestions} answered
            </span>
          </div>
        </div>
        <p className="pb-1 text-center text-[10px] font-medium text-[#c9972c]">
          Do not close this tab
        </p>
      </header>

      {/* Passage tabs — free navigation (not sequentially locked); scroll on narrow widths */}
      {config.passages.length > 1 ? (
        <nav className="fixed left-0 right-0 top-[58px] z-40 flex overflow-x-auto border-b border-slate-200 bg-white px-2 sm:px-4 md:left-[240px]">
          {config.passages.map((passage, idx) => {
            const complete = isPassageComplete(passage);
            const active = idx === activePassageIndex;
            return (
              <button
                key={passage.id}
                type="button"
                onClick={() => {
                  setActivePassageIndex(idx);
                  setCurrentQuestionNumber(passage.startNumber);
                }}
                className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm transition-colors sm:px-5 ${
                  active
                    ? "font-bold text-[#0d1b35]"
                    : "text-slate-500 hover:text-[#0d1b35]"
                }`}
              >
                {complete ? (
                  <CheckIcon className="h-4 w-4 text-green-600" />
                ) : null}
                Passage {passage.index}
                {active ? (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c9972c]" />
                ) : null}
              </button>
            );
          })}
        </nav>
      ) : null}

      {/* Main split content */}
      <div
        className={`flex flex-1 flex-col overflow-hidden ${
          config.passages.length > 1 ? "pt-[106px]" : "pt-[58px]"
        } pb-[88px]`}
      >
        <ExamHighlightSection
          sectionId="reading-test"
          highlights={highlights}
          onHighlightsChange={setHighlights}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          toolbarClassName="mx-5 mb-2 mt-2 shrink-0"
        >
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* Passage panel — fixed scroll */}
            <div className="w-[55%] overflow-y-auto border-r border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-[#0d1b35]">
                {activePassage?.title}
              </h2>
              {activePassage ? (
                <div className="mt-5 space-y-5">
                  {activePassage.paragraphs.map((paragraph) => (
                    <div key={paragraph.id}>
                      {paragraph.label ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0d1b35] text-xs font-bold text-white">
                          {paragraph.label}
                        </span>
                      ) : null}
                      <p className="mt-2 text-base leading-relaxed text-slate-700">
                        <HighlightableInlineText
                          blockId={paragraph.id}
                          text={paragraph.text}
                        />
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Questions panel — scrollable */}
            <div className="w-[45%] select-text overflow-y-auto bg-slate-50 p-5">
              {activePassage
                ? groupedQuestions.map((group) => (
                    <div key={group.label} className="mb-8">
                      <span className="inline-block rounded-full bg-[#c9972c]/15 px-3 py-1 text-xs font-bold text-[#c9972c]">
                        {group.questions[0]?.typeLabel ?? group.label}
                      </span>
                      <div className="mt-4 space-y-4">
                        {group.questions.map((question) => {
                          const answered = Boolean(answers[question.id]?.trim());
                          const isCurrent =
                            question.globalNumber === currentQuestionNumber;
                          return (
                            <div
                              key={question.id}
                              id={`question-${question.globalNumber}`}
                              onFocus={() =>
                                setCurrentQuestionNumber(question.globalNumber)
                              }
                              className={`rounded-lg border bg-white p-4 transition-colors ${
                                isCurrent ? "border-[#c9972c]" : "border-slate-200"
                              } border-l-4 ${
                                answered
                                  ? "border-l-green-500"
                                  : "border-l-slate-300"
                              }`}
                            >
                              <p className="text-sm font-semibold text-[#0d1b35]">
                                <ExamHighlightQuestionText
                                  blockId={`rq-${question.id}`}
                                  number={question.globalNumber}
                                  text={question.text}
                                />
                              </p>
                              <MockQuestionInput
                                question={question}
                                value={answers[question.id] ?? ""}
                                onChange={(value) => {
                                  setAnswers((prev) => ({
                                    ...prev,
                                    [question.id]: value,
                                  }));
                                  setCurrentQuestionNumber(question.globalNumber);
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                : null}
            </div>
          </div>
        </ExamHighlightSection>
      </div>

      {/* Bottom bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-4 py-3 shadow-lg md:left-[240px]">
        <div className="mb-2 flex flex-wrap justify-center gap-1">
          {allQuestions.map((q) => {
            const answered = Boolean(answers[q.id]?.trim());
            const isCurrent = q.globalNumber === currentQuestionNumber;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => scrollToQuestion(q.globalNumber)}
                className={`h-7 w-7 rounded text-xs font-semibold transition-colors ${
                  isCurrent
                    ? "bg-[#c9972c] text-[#0d1b35]"
                    : answered
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {q.globalNumber}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isFirstPassage || config.passages.length === 1}
            onClick={() => {
              const next = Math.max(0, activePassageIndex - 1);
              setActivePassageIndex(next);
              setCurrentQuestionNumber(config.passages[next].startNumber);
            }}
            className="rounded-lg border border-[#0d1b35] px-4 py-2 text-sm font-semibold text-[#0d1b35] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous Passage
          </button>

          {!isLastPassage && config.passages.length > 1 ? (
            <button
              type="button"
              onClick={() => {
                const next = activePassageIndex + 1;
                setActivePassageIndex(next);
                setCurrentQuestionNumber(config.passages[next].startNumber);
              }}
              className="rounded-lg bg-[#0d1b35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152a4d]"
            >
              Next Passage
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            disabled={!isLastPassage || submitting || timer.isTimedOut}
            onClick={() => submitTest(false)}
            className="rounded-lg bg-[#c9972c] px-6 py-2 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Test"}
          </button>
        </div>
      </footer>
    </div>
  );
}
