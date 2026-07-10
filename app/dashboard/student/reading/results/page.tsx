"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import MidnightCountdown from "@/components/MidnightCountdown";
import { formatTimeTaken, loadTestResults } from "@/lib/readingTestUtils";
import { accuracyColorClass, bandColorClass } from "@/lib/readingScorer";
import DailyPracticeFinishBridge from "@/components/practice/DailyPracticeFinishBridge";

type TestResults = {
  testType?: string;
  title?: string;
  score?: number;
  total?: number;
  accuracy?: number;
  estimatedBand?: number;
  timeTakenSeconds?: number;
  timedOut?: boolean;
  passageBreakdown?: {
    passageIndex: number;
    title: string;
    score: number;
    total: number;
    estimatedBand: number;
  }[];
  typeBreakdown?: {
    questionType: string;
    label: string;
    score: number;
    total: number;
    accuracy: number;
  }[];
  weakestType?: string | null;
};

const ACCURACY_TEXT: Record<string, string> = {
  green: "text-green-600",
  amber: "text-amber-600",
  red: "text-red-600",
  gray: "text-slate-500",
};

const ACCURACY_BG: Record<string, string> = {
  green: "border-green-200 bg-green-50",
  amber: "border-amber-200 bg-amber-50",
  red: "border-red-200 bg-red-50",
  gray: "border-slate-200 bg-slate-50",
};

const BAND_TEXT: Record<string, string> = {
  green: "text-green-700",
  amber: "text-amber-700",
  red: "text-red-700",
  gray: "text-slate-600",
};

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { base, usesProgramShell } = usePathwayStudentContext();

  const testType = searchParams.get("testType");
  const legacyScore = searchParams.get("score");
  const legacyTotal = searchParams.get("total");
  const legacyType = searchParams.get("type");

  const [results, setResults] = useState<TestResults | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    const stored = loadTestResults() as TestResults | null;
    if (stored) {
      setResults(stored);
      return;
    }
    if (legacyScore && legacyTotal) {
      setResults({
        score: Number(legacyScore),
        total: Number(legacyTotal),
        testType: legacyType ? "practice" : testType ?? "practice",
      });
    }
  }, [legacyScore, legacyTotal, legacyType, testType]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  const isFullTest = testType === "full" || results?.testType === "full";
  const isMockOrPassage =
    isFullTest ||
    testType === "passage" ||
    results?.testType === "passage" ||
    Boolean(results?.passageBreakdown?.length);

  const score = results?.score ?? 0;
  const total = results?.total ?? 40;
  const band = results?.estimatedBand ?? null;
  const bandColor = bandColorClass(band);
  const weakestType = results?.weakestType;

  const typeRows = results?.typeBreakdown ?? [];
  const avgAccuracy =
    typeRows.length > 0
      ? typeRows.reduce((sum, row) => sum + row.accuracy, 0) / typeRows.length
      : null;

  return (
    <div className="flex min-h-screen bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="reading" /> : null}
      <main className={`flex-1 bg-slate-50 p-8 ${usesProgramShell ? "" : "ml-[200px]"}`}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-[#0d1b35]">
            {isFullTest
              ? "Full Mock Test Results"
              : testType === "passage"
                ? "Passage Test Results"
                : "Reading Results"}
          </h1>
          {results?.title ? (
            <p className="mt-1 text-sm text-slate-500">{results.title}</p>
          ) : null}

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Overall Score
              </p>
              <p className="mt-2 text-5xl font-extrabold text-[#c9972c]">
                {score}/{total}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0d1b35]">
                Band Score
              </p>
              <p
                className={`mt-2 text-5xl font-extrabold ${BAND_TEXT[bandColor]}`}
              >
                {band !== null ? band.toFixed(1) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Time Taken
              </p>
              <p className="mt-2 text-3xl font-bold text-[#0d1b35]">
                {results?.timeTakenSeconds != null
                  ? formatTimeTaken(results.timeTakenSeconds)
                  : "—"}
              </p>
              {results?.timedOut ? (
                <p className="mt-1 text-xs text-red-600">Timed out</p>
              ) : null}
            </div>
          </div>

          {isMockOrPassage && results?.passageBreakdown?.length ? (
            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#0d1b35]">
                Passage Breakdown
              </h2>
              <ul className="mt-4 space-y-3">
                {results.passageBreakdown.map((passage) => {
                  const pBandColor = bandColorClass(passage.estimatedBand);
                  return (
                    <li
                      key={passage.passageIndex}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <span className="font-semibold text-[#0d1b35]">
                        Passage {passage.passageIndex}: {passage.title}
                      </span>
                      <span className="text-sm">
                        <strong className="text-[#c9972c]">
                          {passage.score}/{passage.total}
                        </strong>
                        <span className="mx-2 text-slate-300">·</span>
                        <span className={`font-bold ${BAND_TEXT[pBandColor]}`}>
                          Band {passage.estimatedBand.toFixed(1)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {typeRows.length > 0 ? (
            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#0d1b35]">
                Question Type Performance
              </h2>
              <ul className="mt-4 space-y-3">
                {typeRows.map((row) => {
                  const color = accuracyColorClass(row.accuracy);
                  const isWeak =
                    avgAccuracy !== null && row.accuracy < avgAccuracy - 5;
                  const isStrong =
                    avgAccuracy !== null && row.accuracy > avgAccuracy + 5;
                  return (
                    <li
                      key={row.questionType}
                      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 ${
                        isWeak
                          ? ACCURACY_BG.red
                          : isStrong
                            ? ACCURACY_BG.green
                            : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <span className="font-semibold text-[#0d1b35]">
                        {row.label}
                      </span>
                      <span className={`text-sm font-bold ${ACCURACY_TEXT[color]}`}>
                        {row.score}/{row.total} ({row.accuracy}%)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {weakestType ? (
              <Link
                href={`${base}/reading/practice/${weakestType}`}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
              >
                Practice Weak Areas
              </Link>
            ) : null}
            <Link
              href={`${base}/reading`}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#0d1b35] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#0d1b35] hover:text-white"
            >
              Back to Reading Home
            </Link>
          </div>

          <DailyPracticeFinishBridge timeSpentMinutes={20} className="mt-8" />

          <DailyLimitSummary />
        </div>
      </main>
    </div>
  );
}

function DailyLimitSummary() {
  const { data: session, status } = useSession();
  const studentId = (session?.user as { id?: string })?.id ?? "";
  const [dailyLimit, setDailyLimit] = useState<{
    unlimited?: boolean;
    mockTestsUsed: number;
    mockTestsRemaining: number;
    mockTestsMax: number;
    passageTestsUsed: number;
    passageTestsRemaining: number;
    passageTestsMax: number;
    practiceTestsUsed: number;
    practiceTestsRemaining: number;
    practiceTestsMax: number;
  } | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !studentId) return;

    let cancelled = false;

    async function loadLimit() {
      try {
        const res = await fetch(
          `/api/reading/daily-limit?studentId=${encodeURIComponent(studentId)}`
        );
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok && data) {
          setDailyLimit(data);
        }
      } catch {
        if (!cancelled) setDailyLimit(null);
      }
    }

    loadLimit();
    return () => {
      cancelled = true;
    };
  }, [status, studentId]);

  if (!dailyLimit || dailyLimit.unlimited) return null;

  const allAtLimit =
    dailyLimit.mockTestsRemaining === 0 &&
    dailyLimit.passageTestsRemaining === 0 &&
    dailyLimit.practiceTestsRemaining === 0;

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-center text-sm font-semibold text-[#0d1b35]">
        Today&apos;s Reading Limits
      </p>
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        <li className="flex justify-between gap-4">
          <span>Mock tests</span>
          <span className="font-semibold text-[#0d1b35]">
            {dailyLimit.mockTestsUsed}/{dailyLimit.mockTestsMax} used
            {dailyLimit.mockTestsRemaining > 0
              ? ` · ${dailyLimit.mockTestsRemaining} left`
              : ""}
          </span>
        </li>
        <li className="flex justify-between gap-4">
          <span>Passage tests</span>
          <span className="font-semibold text-[#0d1b35]">
            {dailyLimit.passageTestsUsed}/{dailyLimit.passageTestsMax} used
            {dailyLimit.passageTestsRemaining > 0
              ? ` · ${dailyLimit.passageTestsRemaining} left`
              : ""}
          </span>
        </li>
        <li className="flex justify-between gap-4">
          <span>Practice sessions</span>
          <span className="font-semibold text-[#0d1b35]">
            {dailyLimit.practiceTestsUsed}/{dailyLimit.practiceTestsMax} used
            {dailyLimit.practiceTestsRemaining > 0
              ? ` · ${dailyLimit.practiceTestsRemaining} left`
              : ""}
          </span>
        </li>
      </ul>
      {allAtLimit ? (
        <MidnightCountdown
          prefix="All limits reset in:"
          className="mt-4 block text-center text-sm text-slate-500"
        />
      ) : null}
    </section>
  );
}

export default function ReadingResultsPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ResultsContent />
    </Suspense>
  );
}
