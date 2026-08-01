"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageSpinner } from "@/components/StudentSidebar";
import { ACADEMIC_MOCK_CATALOG } from "@/lib/mock-test/academicMockCatalog";
import { ieltsMockExamHref } from "@/lib/mock-test/ieltsMockRoutes";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

const QUOTES = [
  "Every mock exam is a step closer to your target band.",
  "The student who practices consistently always outperforms the student who studies harder but less often.",
  "Your English is improving every single day. Keep going.",
  "Band 7 is not a dream — it is a plan executed daily.",
];

const MOCK_CHECKLIST = [
  "40 Listening questions — 30 minutes",
  "40 Reading questions — 60 minutes",
  "2 Writing tasks — 60 minutes",
  "3-part Speaking — 15 minutes",
  "AI + Human examiner scoring",
  "Full band prediction report",
];

const PRE_MOCK_TIPS = [
  "Find a quiet room",
  "Check your microphone works",
  "Have water nearby",
  "Allow 3 hours uninterrupted",
  "Treat it like the real exam",
];

type MockItem = {
  id: number | null;
  mockNumber: number;
  topic: string;
  generationDate: string | null;
  status: "available" | "completed";
  overallBand: number | null;
  attemptId: string | null;
  isCurrent: boolean;
  canStart?: boolean;
};

type PageData = {
  studentName: string;
  targetBand: number;
  readinessPercent: number;
  bandTrend: "none" | "baseline" | "improving" | "stable" | "needs_attention";
  currentMockNumber: number;
  lastMock: {
    mockNumber: number | null;
    overallBand: number | null;
    completedAt: string;
    confidencePercent: number | null;
  } | null;
  availableMocks: MockItem[];
  history: {
    id: string;
    mockNumber: number | null;
    date: string;
    overallBand: number | null;
    listening: number | null;
    reading: number | null;
    writing: number | null;
    speaking: number | null;
    reviewStatus: string;
  }[];
  access?: {
    hasAllMocks?: boolean;
    purchasedMockNumbers?: number[];
    accessibleMockNumbers?: number[];
  };
};

function formatMockNumber(n: number): string {
  return `#${String(n).padStart(2, "0")}`;
}

function dailyQuote(): string {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}

function trendLabel(trend: PageData["bandTrend"]): string {
  switch (trend) {
    case "improving":
      return "📈 Your band trend is improving — keep the momentum!";
    case "stable":
      return "➡️ Your band trend is stable — try a mock this week to push higher.";
    case "needs_attention":
      return "⚠️ Recent mocks suggest focused study may help — consider a full mock soon.";
    case "baseline":
      return "📊 Great start — your baseline is set. Compare after your next mock.";
    default:
      return "First mock is the most important — it sets your baseline.";
  }
}

function catalogFallbackMocks(highlightMock?: number): MockItem[] {
  return ACADEMIC_MOCK_CATALOG.map((item) => ({
    id: null,
    mockNumber: item.mockNumber,
    topic: "Full IELTS Academic Mock Exam",
    generationDate: null,
    status: "available" as const,
    overallBand: null,
    attemptId: null,
    isCurrent: highlightMock != null ? item.mockNumber === highlightMock : item.mockNumber === 1,
    canStart: false,
  }));
}

function buyHref(mockNumber: number) {
  return `/checkout/mock?product=single&mock=${mockNumber}`;
}

function pack5Href() {
  return `/checkout/mock?product=pack5`;
}

function TipsPanel({ className = "" }: { className?: string }) {
  return (
    <aside className={`rounded-2xl border border-slate-200 bg-slate-50 p-5 ${className}`}>
      <h3 className="text-sm font-bold" style={{ color: NAVY }}>
        Before your mock exam
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
        {PRE_MOCK_TIPS.map((tip) => (
          <li key={tip} className="flex gap-2">
            <span style={{ color: TEAL }}>✓</span>
            {tip}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function MockExamCard({
  mock,
  onStart,
  loadingMockId,
  showPack5Upgrade,
}: {
  mock: MockItem;
  onStart: (mock: MockItem) => void;
  loadingMockId: number | null;
  showPack5Upgrade: boolean;
}) {
  const isCompleted = mock.status === "completed";
  const isCurrent = mock.isCurrent && !isCompleted;
  // Fail closed: only start when the server explicitly grants access.
  const canStart = mock.canStart === true && !isCompleted;
  const borderColor = isCurrent ? GOLD : isCompleted ? "#e2e8f0" : canStart ? TEAL : "#cbd5e1";
  const bgColor = isCurrent ? NAVY : isCompleted ? "#f8fafc" : "#ffffff";
  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 p-4 shadow-md sm:p-6"
      style={{ borderColor, backgroundColor: bgColor }}
    >
      <span
        className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
        style={{
          backgroundColor: isCurrent
            ? GOLD
            : isCompleted
              ? "#e2e8f0"
              : canStart
                ? `${TEAL}20`
                : "#f1f5f9",
          color: isCurrent ? NAVY : isCompleted ? "#64748b" : canStart ? TEAL : "#64748b",
        }}
      >
        Mock Exam {formatMockNumber(mock.mockNumber)}
      </span>

      <h2
        className="text-lg font-bold sm:text-xl"
        style={{ color: isCurrent ? "#ffffff" : NAVY }}
      >
        Full IELTS Academic Mock Exam
      </h2>

      <p
        className="mt-1 text-sm"
        style={{ color: isCurrent ? "#cbd5e1" : "#64748b" }}
      >
        Timed, auto-submitted — full band report with AI + human review within 24 hours.
      </p>

      {isCurrent ? (
        <ul className="mt-4 space-y-1.5 text-sm text-slate-200">
          {MOCK_CHECKLIST.map((item) => (
            <li key={item} className="flex gap-2">
              <span style={{ color: TEAL }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {isCompleted && mock.overallBand != null ? (
          <div>
            <p className="text-xs text-slate-500">Band score</p>
            <p className="text-2xl font-bold" style={{ color: GOLD }}>
              {Number(mock.overallBand).toFixed(1)}
            </p>
          </div>
        ) : isCompleted ? (
          <span className="text-sm text-slate-500">Completed</span>
        ) : canStart ? (
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase"
            style={{ backgroundColor: `${TEAL}20`, color: TEAL }}
          >
            Available
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-500">
            Locked
          </span>
        )}

        {isCurrent ? (
          <p className="text-sm font-semibold" style={{ color: GOLD }}>
            Total: 2 hours 45 minutes
          </p>
        ) : null}
      </div>

      {isCurrent ? (
        <p className="mt-3 text-xs text-slate-400">
          <span style={{ color: GOLD }}>⏱</span> Timed — cannot pause — submit all at once
        </p>
      ) : null}

      {isCompleted && mock.attemptId ? (
        <Link
          href={`/mock-test/results/${mock.attemptId}`}
          className="mt-4 inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ borderColor: TEAL, color: TEAL }}
        >
          View Report
        </Link>
      ) : canStart ? (
        <button
          type="button"
          disabled={loadingMockId !== null}
          onClick={() => onStart(mock)}
          className="mt-4 flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 sm:inline-flex sm:w-auto"
          style={{
            backgroundColor: isCurrent ? GOLD : TEAL,
            color: isCurrent ? NAVY : "#ffffff",
          }}
        >
          {loadingMockId === mock.mockNumber ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Starting…
            </span>
          ) : (
            `Start Mock Exam ${formatMockNumber(mock.mockNumber)}`
          )}
        </button>
      ) : !isCompleted ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={buyHref(mock.mockNumber)}
            className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-white hover:opacity-95 sm:w-auto"
            style={{ backgroundColor: TEAL }}
          >
            Buy this mock — 169 SAR
          </Link>
          {showPack5Upgrade ? (
            <Link
              href={pack5Href()}
              className="inline-flex w-full items-center justify-center rounded-xl border-2 px-6 py-3 text-sm font-bold hover:opacity-95 sm:w-auto"
              style={{ borderColor: GOLD, color: NAVY }}
            >
              Upgrade to 5-Mock Pack
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function IeltsMockExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMockNumber = Number(searchParams.get("mock"));
  const autoStartAttempted = useRef(false);

  const [loading, setLoading] = useState(true);
  const [loadingMockId, setLoadingMockId] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PageData | null>(null);

  const quote = useMemo(() => dailyQuote(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/student/mock-exam/page-data");
        const dataRes = await res.json();
        if (cancelled) return;

        if (dataRes.error && !Array.isArray(dataRes.availableMocks)) {
          setLoadError(dataRes.error);
          setPageData({
            studentName: "Student",
            targetBand: 7,
            readinessPercent: 0,
            bandTrend: "none",
            currentMockNumber: Number.isInteger(requestedMockNumber) ? requestedMockNumber : 1,
            lastMock: null,
            history: [],
            availableMocks: catalogFallbackMocks(
              Number.isInteger(requestedMockNumber) ? requestedMockNumber : undefined
            ),
          });
          return;
        }

        setLoadError(null);
        setPageData(dataRes);
      } catch {
        if (cancelled) return;
        setLoadError("Could not load mock exams. Showing catalog.");
        setPageData({
          studentName: "Student",
          targetBand: 7,
          readinessPercent: 0,
          bandTrend: "none",
          currentMockNumber: 1,
          lastMock: null,
          history: [],
          availableMocks: catalogFallbackMocks(
            Number.isInteger(requestedMockNumber) ? requestedMockNumber : undefined
          ),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [requestedMockNumber]);

  async function handleStartMock(mock: MockItem) {
    setLoadingMockId(mock.mockNumber);
    setStartError(null);

    try {
      const res = await fetch("/api/mock-test/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockNumber: mock.mockNumber,
          generatedMockTestId: mock.id,
          examVariant: "academic",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to start mock exam");
      }

      const attemptId = data.attemptId;
      if (!attemptId) {
        throw new Error("No exam session was created. Please try again.");
      }

      sessionStorage.setItem("mock_test_attempt_id", String(attemptId));
      sessionStorage.setItem("mock_test_number", String(mock.mockNumber));
      if (mock.id != null) {
        sessionStorage.setItem("mock_test_generated_id", String(mock.id));
      }

      const testId = mock.id != null ? String(mock.id) : String(mock.mockNumber);
      const examUrl = ieltsMockExamHref({ mockNumber: mock.mockNumber, testId });
      router.push(examUrl);
    } catch (err) {
      console.error("[mock-exam] start failed:", err);
      setStartError(err instanceof Error ? err.message : "Could not start mock exam");
      setLoadingMockId(null);
    }
  }

  useEffect(() => {
    if (loading || !pageData || autoStartAttempted.current) return;
    if (!Number.isInteger(requestedMockNumber) || requestedMockNumber < 1 || requestedMockNumber > 5) {
      return;
    }
    const mock = pageData.availableMocks.find((m) => m.mockNumber === requestedMockNumber);
    if (!mock || mock.status === "completed") return;
    if (mock.canStart !== true) return;
    autoStartAttempted.current = true;
    void handleStartMock(mock);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot deep link from public landing
  }, [loading, pageData, requestedMockNumber]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  const mocks =
    pageData?.availableMocks?.length
      ? pageData.availableMocks
      : catalogFallbackMocks(
          Number.isInteger(requestedMockNumber) ? requestedMockNumber : undefined
        );
  const currentMock = mocks.find((m) => m.isCurrent) ?? mocks.find((m) => m.status === "available");
  const ownedCount = pageData?.access?.purchasedMockNumbers?.length ?? 0;
  const hasAllMocks = pageData?.access?.hasAllMocks === true;
  const showPack5Upgrade = !hasAllMocks && ownedCount > 0 && ownedCount < 5;
  const startableCount = mocks.filter((m) => m.canStart === true && m.status !== "completed").length;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <div
        className="mb-8 rounded-2xl px-4 py-6 sm:px-6"
        style={{ backgroundColor: NAVY }}
      >
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
          IELTS Academic · Full mock exams
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
          Your mock exam lobby
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
          Full 4-skill Academic simulations — real timing, AI scoring, and human Writing/Speaking review.
          Choose a mock below to start or view a past report.
        </p>
      </div>

      <div className="lg:flex lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <header className="mb-6">
            <h2 className="text-lg font-bold sm:text-xl" style={{ color: NAVY }}>
              Your mocks
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {hasAllMocks
                ? "All five Academic mocks are unlocked on your plan."
                : startableCount > 0
                  ? `${startableCount} of 5 mocks unlocked on your account — purchase to unlock the rest.`
                  : "Purchase a mock or pack to unlock exams below."}
            </p>
          </header>

          <p
            className="mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: TEAL }}
          >
            Exam simulation
          </p>

          <div className="space-y-4">
            {loadError ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {loadError}
              </p>
            ) : null}
            {startError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {startError}
              </p>
            ) : null}

            {mocks.map((mock) => (
              <MockExamCard
                key={mock.mockNumber}
                mock={mock}
                onStart={handleStartMock}
                loadingMockId={loadingMockId}
                showPack5Upgrade={showPack5Upgrade}
              />
            ))}
          </div>

          {currentMock ? (
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {trendLabel(pageData?.bandTrend ?? "none")}
            </p>
          ) : null}

          {pageData?.lastMock?.overallBand != null ? (
            <div className="mt-4 inline-flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-xs text-slate-500">
                  Last mock
                  {pageData.lastMock.mockNumber
                    ? ` ${formatMockNumber(pageData.lastMock.mockNumber)}`
                    : ""}
                </p>
                <p className="text-2xl font-bold" style={{ color: GOLD }}>
                  {Number(pageData.lastMock.overallBand).toFixed(1)}
                </p>
              </div>
              {pageData.lastMock.confidencePercent != null ? (
                <div className="border-l border-slate-200 pl-4">
                  <p className="text-xs text-slate-500">Confidence</p>
                  <p className="text-lg font-semibold" style={{ color: NAVY }}>
                    {pageData.lastMock.confidencePercent}%
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {pageData?.history && pageData.history.length > 0 ? (
            <section className="mt-10 overflow-x-auto">
              <h2 className="mb-4 text-base font-bold" style={{ color: NAVY }}>
                Mock exam history
              </h2>
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="pb-2 pr-4">Mock</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Overall</th>
                    <th className="pb-2 pr-4">L / R / W / S</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.history.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-bold" style={{ color: GOLD }}>
                        {row.mockNumber != null ? formatMockNumber(row.mockNumber) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {new Date(row.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-4 font-bold" style={{ color: GOLD }}>
                        {row.overallBand != null ? Number(row.overallBand).toFixed(1) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {[row.listening, row.reading, row.writing, row.speaking]
                          .map((b) => (b != null ? b.toFixed(1) : "—"))
                          .join(" / ")}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            backgroundColor:
                              row.reviewStatus === "Human reviewed"
                                ? `${TEAL}20`
                                : row.reviewStatus === "AI reviewed"
                                  ? `${GOLD}25`
                                  : "#f1f5f9",
                            color: NAVY,
                          }}
                        >
                          {row.reviewStatus}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/mock-test/results/${row.id}`}
                          className="text-xs font-semibold hover:underline"
                          style={{ color: TEAL }}
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          <blockquote
            className="mt-10 border-l-4 py-2 pl-4 text-sm italic text-slate-600"
            style={{ borderColor: GOLD }}
          >
            {quote}
          </blockquote>

          <TipsPanel className="mt-8 lg:hidden" />
        </div>

        <TipsPanel className="sticky top-6 hidden w-72 shrink-0 lg:block" />
      </div>
    </main>
  );
}
