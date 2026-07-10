"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageSpinner } from "@/components/StudentSidebar";
import PracticeListeningPanel, {
  countAnsweredQuestions,
  getListeningQuestionKeys,
} from "@/components/accelerator/PracticeListeningPanel";
import PracticeReadingPanel from "@/components/accelerator/PracticeReadingPanel";
import PracticeDebugPanel from "@/components/accelerator/PracticeDebugPanel";
import StickySubmitBar from "@/components/accelerator/StickySubmitBar";
import { isValidTrack, type AcceleratorTrackId } from "@/lib/accelerator/tracks";
import type { AcceleratorSectionId } from "@/lib/accelerator/practiceMeta";
import {
  normalizeListeningContent,
  normalizeReadingContent,
} from "@/lib/accelerator/normalizePracticeContent";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";
const SECTION_ORDER: AcceleratorSectionId[] = [
  "listening",
  "reading",
  "writing",
  "speaking",
];

type TestPayload = {
  id: string;
  track: string;
  test_type: string;
  section: string | null;
  topic: string | null;
  content: Record<string, unknown>;
  answer_key?: unknown;
  model_answers?: unknown;
};

export default function AcceleratorPracticeSessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const trackParam = String(params.track ?? "");
  const track = isValidTrack(trackParam) ? trackParam : null;
  const testId = searchParams.get("testId") ?? "";
  const testType = searchParams.get("type") ?? "section_practice";
  const sectionParam = searchParams.get("section") as AcceleratorSectionId | null;
  const userRole = String((session?.user as { role?: string })?.role ?? "").toLowerCase();
  const showDebugPanel =
    (userRole === "teacher" || userRole === "admin") &&
    searchParams.get("debug") === "1";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<TestPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fullMockStep, setFullMockStep] = useState(0);
  const [sectionResults, setSectionResults] = useState<
    Record<string, { band: number; feedback: unknown }>
  >({});
  const [allSectionAnswers, setAllSectionAnswers] = useState<
    Record<string, Record<string, string>>
  >({});

  const isFullMock = testType === "full_mock";
  const activeSection = isFullMock
    ? SECTION_ORDER[fullMockStep]
    : sectionParam;

  const sectionContent = useMemo(() => {
    if (!test?.content) return {};
    const content = test.content as Record<string, unknown>;

    if (isFullMock && activeSection) {
      return (content[activeSection] as Record<string, unknown>) ?? {};
    }

    // Section practice on a full_mock row — slice to the active section
    if (
      sectionParam &&
      content[sectionParam] &&
      typeof content[sectionParam] === "object"
    ) {
      return content[sectionParam] as Record<string, unknown>;
    }

    return content;
  }, [test, isFullMock, activeSection, sectionParam]);

  const listeningSections = useMemo(
    () =>
      activeSection === "listening"
        ? normalizeListeningContent(sectionContent)
        : [],
    [activeSection, sectionContent]
  );

  const readingPassages = useMemo(
    () =>
      activeSection === "reading" ? normalizeReadingContent(sectionContent) : [],
    [activeSection, sectionContent]
  );

  const objectiveQuestionKeys = useMemo(() => {
    if (activeSection === "listening") {
      return getListeningQuestionKeys(listeningSections);
    }
    if (activeSection === "reading") {
      return readingPassages.flatMap((p) => p.questions.map((q) => q.key));
    }
    return [];
  }, [activeSection, listeningSections, readingPassages]);

  const answeredCount = countAnsweredQuestions(objectiveQuestionKeys, answers);
  const totalObjectiveQuestions = objectiveQuestionKeys.length;

  useEffect(() => {
    if (!track || !testId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/accelerator/practice/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            track,
            testId,
            testType,
            section: testType === "section_practice" ? sectionParam : null,
            loadOnly: true,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(
            json.error ??
              "We couldn't load your practice session. Please go back and try again."
          );
        }
        if (!cancelled) setTest(json.test);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [track, testId, testType, sectionParam]);

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function submitCurrentSection() {
    if (!track || !test || !activeSection) return;
    setSubmitting(true);
    setError(null);

    const sectionAnswers =
      activeSection === "writing"
        ? { task1: answers.task1 ?? "", task2: answers.task2 ?? "" }
        : answers;

    try {
      const res = await fetch("/api/accelerator/practice/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track,
          testId: test.id,
          testType: isFullMock ? "full_mock" : "section_practice",
          section: activeSection,
          answers: sectionAnswers,
          recordHistory: !isFullMock,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submit failed");

      if (isFullMock) {
        const nextResults = {
          ...sectionResults,
          [activeSection]: { band: json.bandScore, feedback: json.feedback },
        };
        const nextAnswers = {
          ...allSectionAnswers,
          [activeSection]: sectionAnswers as Record<string, string>,
        };
        setSectionResults(nextResults);
        setAllSectionAnswers(nextAnswers);

        if (fullMockStep < SECTION_ORDER.length - 1) {
          setFullMockStep((s) => s + 1);
          setAnswers({});
          setSubmitting(false);
          return;
        }

        const finalRes = await fetch("/api/accelerator/practice/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            track,
            testId: test.id,
            testType: "full_mock",
            allSectionAnswers: nextAnswers,
            recordHistory: true,
          }),
        });
        const finalJson = await finalRes.json();
        if (!finalRes.ok) throw new Error(finalJson.error ?? "Final submit failed");

        sessionStorage.setItem(
          `accelerator_result_${test.id}`,
          JSON.stringify(finalJson)
        );
        router.push(
          `/dashboard/ielts/student/accelerator/${track}/practice/results?testId=${test.id}&type=full_mock`
        );
        return;
      }

      sessionStorage.setItem(
        `accelerator_result_${test.id}_${activeSection}`,
        JSON.stringify(json)
      );
      router.push(
        `/dashboard/ielts/student/accelerator/${track}/practice/results?testId=${test.id}&type=section_practice&section=${activeSection}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
      setSubmitting(false);
    }
  }

  if (!track) {
    return <main className="p-6">Invalid track.</main>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <PageSpinner />
        <p className="text-sm text-slate-500">Loading your practice test…</p>
      </div>
    );
  }

  if (error && !test) {
    return (
      <main className="p-6">
        <div className="max-w-lg rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-sm text-slate-700">{error}</p>
          <Link
            href={`/dashboard/ielts/student/accelerator/${track}/practice`}
            className="mt-4 inline-block text-sm font-semibold hover:underline"
            style={{ color: TEAL }}
          >
            ← Back to Practice
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex-1 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <nav className="text-sm text-slate-500">
            <Link
              href={`/dashboard/ielts/student/accelerator/${track}/practice`}
              className="font-semibold hover:underline"
              style={{ color: TEAL }}
            >
              Practice Hub
            </Link>
            <span className="mx-2">›</span>
            <span className="font-semibold capitalize text-slate-700">
              {isFullMock ? `Full Mock — ${activeSection}` : `${activeSection} Practice`}
            </span>
          </nav>
          {test?.topic ? (
            <p className="mt-1 text-sm text-slate-500">{test.topic}</p>
          ) : null}
        </div>
        {isFullMock ? (
          <div className="flex gap-1">
            {SECTION_ORDER.map((s, i) => (
              <span
                key={s}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  i === fullMockStep
                    ? "bg-[#c9972c] text-[#0d1b35]"
                    : i < fullMockStep
                      ? "bg-[#0d9488] text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {s.slice(0, 3)}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {showDebugPanel && test ? (
        <PracticeDebugPanel
          payload={{
            testId: test.id,
            track: test.track,
            section: activeSection ?? undefined,
            rawContent: sectionContent,
            listeningSections,
            readingPassages,
          }}
        />
      ) : null}

      <div className={activeSection === "listening" ? "p-2 sm:p-4" : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"}>
        {activeSection === "listening" ? (
          <PracticeListeningPanel
            sections={listeningSections}
            answers={answers}
            onChange={setAnswer}
          />
        ) : null}

        {activeSection === "reading" ? (
          <PracticeReadingPanel
            passages={readingPassages}
            answers={answers}
            onChange={setAnswer}
          />
        ) : null}

        {activeSection === "writing" ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold" style={{ color: NAVY }}>
                Task 1
              </h3>
              <p className="mt-2 text-sm text-slate-700">
                {String(
                  (sectionContent.task1 as Record<string, unknown>)?.prompt ??
                    "Describe the visual information in at least 150 words."
                )}
              </p>
              <textarea
                rows={8}
                value={answers.task1 ?? ""}
                onChange={(e) => setAnswer("task1", e.target.value)}
                className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm"
                placeholder="Write your Task 1 response…"
              />
            </div>
            <div>
              <h3 className="font-bold" style={{ color: NAVY }}>
                Task 2
              </h3>
              <p className="mt-2 text-sm text-slate-700">
                {String(
                  (sectionContent.task2 as Record<string, unknown>)?.prompt ??
                    "Write an essay of at least 250 words."
                )}
              </p>
              <textarea
                rows={10}
                value={answers.task2 ?? ""}
                onChange={(e) => setAnswer("task2", e.target.value)}
                className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm"
                placeholder="Write your Task 2 essay…"
              />
            </div>
          </div>
        ) : null}

        {activeSection === "speaking" ? (
          <div className="space-y-6">
            {(["part1", "part2", "part3"] as const).map((part) => {
              const partData = sectionContent[part] as Record<string, unknown> | undefined;
              if (!partData) return null;
              return (
                <div key={part} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <h3 className="font-bold uppercase text-slate-500">{part}</h3>
                  <p className="mt-2 text-sm text-slate-700">
                    {String(
                      partData.cue_card ??
                        partData.topic ??
                        (Array.isArray(partData.questions)
                          ? (partData.questions as string[]).join(" · ")
                          : "")
                    )}
                  </p>
                  <textarea
                    rows={4}
                    value={answers[part] ?? ""}
                    onChange={(e) => setAnswer(part, e.target.value)}
                    className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm"
                    placeholder="Notes or transcript of your spoken answer…"
                  />
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {(activeSection === "listening" || activeSection === "reading") &&
      totalObjectiveQuestions > 0 ? (
        <StickySubmitBar
          answeredCount={answeredCount}
          totalQuestions={totalObjectiveQuestions}
          onSubmit={submitCurrentSection}
          submitting={submitting}
          offsetSidebar
        />
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pb-8">
          <button
            type="button"
            disabled={submitting}
            onClick={submitCurrentSection}
            className="rounded-xl px-6 py-3 text-sm font-bold text-[#0d1b35] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: GOLD }}
          >
            {submitting
              ? "Submitting…"
              : isFullMock && fullMockStep < SECTION_ORDER.length - 1
                ? "Submit section & continue →"
                : "Submit Answers →"}
          </button>
        </div>
      )}
    </main>
  );
}
