"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";

type TrackerRow = {
  question_type: string;
  attempts: number;
  accuracy: number | null;
  estimated_band: number | null;
};

type ReadingStats = {
  passagesCompleted: number;
  questionsAnswered: number;
  averageAccuracy: number | null;
  readingBand: number | null;
  typesPracticed: number;
  lastPracticedType: string | null;
};

type DailyLimitInfo = {
  unlimited?: boolean;
  mockTestsUsed: number;
  mockTestsRemaining: number;
  mockTestsMax: number;
  canTakeMockTest: boolean;
  passageTestsUsed: number;
  passageTestsRemaining: number;
  passageTestsMax: number;
  canTakePassageTest: boolean;
  practiceTestsUsed: number;
  practiceTestsRemaining: number;
  practiceTestsMax: number;
  canTakePracticeTest: boolean;
};

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
    </svg>
  );
}

function formatQuestionType(slug: string): string {
  const labels: Record<string, string> = {
    "matching-headings": "Matching Headings",
    "matching-information": "Matching Information",
    "true-false-not-given": "True / False / Not Given",
    "yes-no-not-given": "Yes / No / Not Given",
    "multiple-choice": "Multiple Choice",
    "sentence-completion": "Sentence Completion",
    "summary-completion": "Summary Completion",
    "matching-features": "Matching Features",
    "matching-sentence-endings": "Matching Sentence Endings",
    "short-answer": "Short Answer",
    "diagram-completion": "Diagram Completion",
    classification: "Classification",
  };
  if (labels[slug]) return labels[slug];
  return slug.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-");
}

function formatAccuracy(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct * 10) / 10}%`;
}

function formatBand(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

function bandTone(band: number | null): "red" | "amber" | "gold" {
  if (band === null || !Number.isFinite(band)) return "amber";
  if (band >= 7.5) return "gold";
  if (band >= 4.5) return "amber";
  return "red";
}

const BAND_TONE_CLASS = {
  red: "text-red-600",
  amber: "text-amber-600",
  gold: "text-[#c9972c]",
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#0d1b35]">{value}</p>
    </div>
  );
}

function LimitProgressBar({
  used,
  max,
  atLimit,
  label,
}: {
  used: number;
  max: number;
  atLimit: boolean;
  label: string;
}) {
  const progressPercent = Math.min(100, Math.round((used / max) * 100));
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {used} of {max} {label}
        </span>
        {atLimit ? (
          <span className="font-semibold text-red-600">Limit Reached — Resets at Midnight</span>
        ) : null}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? "bg-red-500" : "bg-[#c9972c]"}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

function MockTestModeCard({ dailyLimit }: { dailyLimit: DailyLimitInfo | null }) {
  const maxTests = dailyLimit?.mockTestsMax ?? 10;
  const testsUsed = dailyLimit?.unlimited ? 0 : (dailyLimit?.mockTestsUsed ?? 0);
  const atLimit = Boolean(dailyLimit && !dailyLimit.unlimited && !dailyLimit.canTakeMockTest);
  const buttonLabel = atLimit ? "Limit Reached — Resets at Midnight" : "Start Mock Test";
  const buttonClass = atLimit
    ? "cursor-not-allowed bg-slate-300 text-slate-500"
    : "bg-[#0d9488] text-white hover:bg-[#0b7c72]";

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0d1b35]/5 text-[#0d1b35]">
        <FileTextIcon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-[#0d1b35]">Full Mock Test</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
        Complete 3 unique passages in 60 minutes. Simulates real exam conditions.
      </p>
      {!dailyLimit?.unlimited ? (
        <LimitProgressBar
          used={testsUsed}
          max={maxTests}
          atLimit={atLimit}
          label="daily mock tests used"
        />
      ) : null}
      {atLimit ? (
        <span className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold ${buttonClass}`}>
          {buttonLabel}
        </span>
      ) : (
        <Link href="/dashboard/student/reading/test" className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold transition-colors ${buttonClass}`}>
          {buttonLabel}
        </Link>
      )}
    </div>
  );
}

function PassageTestModeCard({ dailyLimit }: { dailyLimit: DailyLimitInfo | null }) {
  const maxTests = dailyLimit?.passageTestsMax ?? 15;
  const testsUsed = dailyLimit?.unlimited ? 0 : (dailyLimit?.passageTestsUsed ?? 0);
  const atLimit = Boolean(dailyLimit && !dailyLimit.unlimited && !dailyLimit.canTakePassageTest);
  const buttonLabel = atLimit ? "Limit Reached — Resets at Midnight" : "Start Passage";
  const buttonClass = atLimit
    ? "cursor-not-allowed bg-slate-300 text-slate-500"
    : "bg-[#0d1b35] text-white hover:bg-[#152a4d]";

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0d1b35]/5 text-[#0d1b35]">
        <ClockIcon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-[#0d1b35]">Timed Passage Test</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
        Practice one unique passage in 20 minutes. Timer locks screen when time is up.
      </p>
      {!dailyLimit?.unlimited ? (
        <LimitProgressBar
          used={testsUsed}
          max={maxTests}
          atLimit={atLimit}
          label="daily passage tests used"
        />
      ) : null}
      {atLimit ? (
        <span className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold ${buttonClass}`}>
          {buttonLabel}
        </span>
      ) : (
        <Link
          href="/dashboard/student/reading/test/passage/multiple-choice"
          className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold transition-colors ${buttonClass}`}
        >
          {buttonLabel}
        </Link>
      )}
    </div>
  );
}

function PracticeModeCard({ dailyLimit }: { dailyLimit: DailyLimitInfo | null }) {
  const maxTests = dailyLimit?.practiceTestsMax ?? 15;
  const testsUsed = dailyLimit?.unlimited ? 0 : (dailyLimit?.practiceTestsUsed ?? 0);
  const atLimit = Boolean(dailyLimit && !dailyLimit.unlimited && !dailyLimit.canTakePracticeTest);
  const buttonLabel = atLimit ? "Limit Reached — Resets at Midnight" : "Start Practice";
  const buttonClass = atLimit
    ? "cursor-not-allowed bg-slate-300 text-slate-500"
    : "bg-[#c9972c] text-[#0d1b35] hover:bg-[#b8862b]";

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0d1b35]/5 text-[#0d1b35]">
        <TargetIcon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-[#0d1b35]">Question Type Practice</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
        Focus on one question type. Every session uses a passage you have never seen.
      </p>
      {!dailyLimit?.unlimited ? (
        <LimitProgressBar
          used={testsUsed}
          max={maxTests}
          atLimit={atLimit}
          label="daily practice sessions used"
        />
      ) : null}
      {atLimit ? (
        <span className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold ${buttonClass}`}>
          {buttonLabel}
        </span>
      ) : (
        <Link
          href="/dashboard/student/reading/practice"
          className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold transition-colors ${buttonClass}`}
        >
          {buttonLabel}
        </Link>
      )}
    </div>
  );
}

export default function StudentReadingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isPathway } = usePathwayStudentContext();
  const [trackerRows, setTrackerRows] = useState<TrackerRow[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [dailyLimit, setDailyLimit] = useState<DailyLimitInfo | null>(null);
  const [trackerLoading, setTrackerLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const studentId = (session?.user as { id?: string })?.id ?? "";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    async function loadData() {
      setTrackerLoading(true);
      setStatsError(false);
      try {
        const [trackerRes, statsRes, limitRes] = await Promise.all([
          fetch("/api/reading/tracker"),
          fetch("/api/reading/stats"),
          studentId
            ? fetch(`/api/reading/daily-limit?studentId=${encodeURIComponent(studentId)}`)
            : Promise.resolve(null),
        ]);
        const trackerData = await trackerRes.json().catch(() => null);
        const statsData = await statsRes.json().catch(() => null);
        const limitData = limitRes
          ? await limitRes.json().catch(() => null)
          : null;
        if (!cancelled) {
          if (trackerRes.ok && Array.isArray(trackerData?.rows)) {
            setTrackerRows(trackerData.rows);
          } else {
            setTrackerRows([]);
          }
          if (limitRes?.ok && limitData) {
            setDailyLimit(limitData);
          }
          if (statsRes.ok && statsData) {
            setStats(statsData);
          } else {
            setStatsError(true);
            setStats({
              passagesCompleted: 0,
              questionsAnswered: 0,
              averageAccuracy: null,
              readingBand: null,
              typesPracticed: 0,
              lastPracticedType: null,
            });
          }
        }
      } catch {
        if (!cancelled) {
          setTrackerRows([]);
          setStatsError(true);
          setStats({
            passagesCompleted: 0,
            questionsAnswered: 0,
            averageAccuracy: null,
            readingBand: null,
            typesPracticed: 0,
            lastPracticedType: null,
          });
        }
      } finally {
        if (!cancelled) setTrackerLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [status, studentId]);

  const continueSlug = useMemo(() => {
    if (stats?.lastPracticedType) return normalizeSlug(stats.lastPracticedType);
    return "matching-headings";
  }, [stats?.lastPracticedType]);

  const continueLabel = useMemo(() => {
    if (stats?.lastPracticedType) {
      return formatQuestionType(normalizeSlug(stats.lastPracticedType));
    }
    return "Matching Headings";
  }, [stats?.lastPracticedType]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="reading" />

      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <header>
            <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">
              {isPathway ? "Reading Practice" : "IELTS Academic Reading"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              {isPathway
                ? "Build reading skills with texts and comprehension at your level"
                : "Master all 12 question types — timed and untimed practice"}
            </p>
          </header>

          {statsError ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Could not load live stats — showing defaults. Your practice will still be saved when available.
            </p>
          ) : null}

          <div className={`mt-6 grid grid-cols-2 gap-4 ${isPathway ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
            <StatCard label="Passages Completed" value={String(stats?.passagesCompleted ?? 0)} />
            <StatCard label="Questions Answered" value={String(stats?.questionsAnswered ?? 0)} />
            <StatCard label="Average Accuracy" value={stats?.averageAccuracy != null ? `${stats.averageAccuracy}%` : "—"} />
            {!isPathway ? (
            <StatCard label="Current Reading Band" value={stats?.readingBand != null ? stats.readingBand.toFixed(1) : "—"} />
            ) : null}
          </div>

          <div className={`mt-8 grid grid-cols-1 gap-6 ${isPathway ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            <PracticeModeCard dailyLimit={dailyLimit} />
            <PassageTestModeCard dailyLimit={dailyLimit} />
            {!isPathway ? <MockTestModeCard dailyLimit={dailyLimit} /> : null}
          </div>

          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0d1b35]">Continue Learning</h2>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-4">
              <div>
                <p className="text-sm text-slate-500">
                  {stats?.lastPracticedType ? "Last practiced" : "Recommended first practice"}
                </p>
                <p className="mt-1 text-base font-bold text-[#0d1b35]">{continueLabel}</p>
              </div>
              <Link href={`/dashboard/student/reading/practice/${continueSlug}`} className="rounded-xl bg-[#c9972c] px-6 py-2.5 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]">
                Continue
              </Link>
            </div>
          </section>

          <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0d1b35]">Performance Snapshot</h2>
            <p className="mt-1 text-sm text-slate-500">Your most attempted question types</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-3 font-semibold text-[#0d1b35]">Question Type</th>
                    <th className="pb-3 font-semibold text-[#0d1b35]">Attempts</th>
                    <th className="pb-3 font-semibold text-[#0d1b35]">Accuracy</th>
                    {!isPathway ? (
                    <th className="pb-3 font-semibold text-[#0d1b35]">Est. Band</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {trackerLoading ? (
                    <tr><td colSpan={isPathway ? 3 : 4} className="py-6 text-center text-slate-500">Loading tracker…</td></tr>
                  ) : trackerRows.length === 0 ? (
                    <tr><td colSpan={isPathway ? 3 : 4} className="py-6 text-center text-slate-500">No practice attempts yet. Start a session to see your progress here.</td></tr>
                  ) : (
                    trackerRows.map((row) => {
                      const tone = bandTone(row.estimated_band);
                      return (
                        <tr key={row.question_type} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 font-medium text-slate-700">{formatQuestionType(row.question_type)}</td>
                          <td className="py-3 text-slate-600">{row.attempts}</td>
                          <td className="py-3 text-slate-600">{formatAccuracy(row.accuracy)}</td>
                          {!isPathway ? (
                          <td className={`py-3 font-bold ${BAND_TONE_CLASS[tone]}`}>{formatBand(row.estimated_band)}</td>
                          ) : null}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard/student/reading/strategies" className="inline-flex items-center justify-center rounded-xl border border-[#0d1b35] px-6 py-2.5 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#0d1b35] hover:text-white">
                View Strategies
              </Link>
              <Link href="/dashboard/student/reading/tracker" className="inline-flex items-center justify-center rounded-xl border border-[#0d1b35] px-6 py-2.5 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#0d1b35] hover:text-white">
                View Full Tracker
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
