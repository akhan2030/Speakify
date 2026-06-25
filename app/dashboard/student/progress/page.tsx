"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";

type Breakdown = Record<string, number | null>;

type SkillCard = {
  band: number | null;
  lastEssayDateLabel?: string;
  lastAttemptDateLabel?: string;
  breakdown?: Breakdown;
  accuracyPercent?: number | null;
  typesMastered?: number;
  typesTotal?: number;
  sectionsCompleted?: number;
  sectionsTotal?: number;
  attemptCount?: number;
};

type VocabCard = {
  cefrLevel: string;
  wordsMastered: number;
  totalWords: number;
  percentComplete: number;
  streak: number;
};

type Activity = {
  module: string;
  label: string;
  score: number | null;
  dateLabel: string;
};

type DayCell = {
  date: string;
  dayLabel: string;
  studied: boolean;
};

type PlacementBaseline = {
  placementCompleted: boolean;
  placementBand: number | null;
  placementCefrLevel: string | null;
  placementCefrName: string | null;
};

type ProgressPayload = {
  targetBand: number | null;
  overallBand: number | null;
  progressToTarget: number | null;
  writing: SkillCard | null;
  speaking: SkillCard | null;
  reading: SkillCard | null;
  listening: SkillCard | null;
  vocabulary: VocabCard | null;
  recentActivity: Activity[];
  studyStreak: number;
  last7Days: DayCell[];
};

type ProgressView = ProgressPayload & PlacementBaseline;

function formatBand(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(1);
}

function BandBadge({ band }: { band: number | null | undefined }) {
  return (
    <span className="text-3xl font-bold text-[#c9972c]">{formatBand(band)}</span>
  );
}

function BreakdownRow({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-[#0d1b35]">{formatBand(value)}</span>
    </div>
  );
}

function SkillPanel({
  title,
  icon,
  href,
  band,
  meta,
  children,
}: {
  title: string;
  icon: string;
  href: string;
  band: number | null | undefined;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md hover:ring-2 hover:ring-[#c9972c]/25"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d1b35] text-sm font-bold text-white">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-[#0d1b35]">{title}</h3>
            {meta ? <p className="text-xs text-slate-500">{meta}</p> : null}
          </div>
        </div>
        <BandBadge band={band} />
      </div>
      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
        {children}
      </div>
    </Link>
  );
}

export default function StudentProgressPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProgressView | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [progressRes, readingRes, listeningRes, placementRes] =
          await Promise.all([
            fetch("/api/student/progress"),
            fetch("/api/reading/stats"),
            fetch("/api/listening/tracker"),
            fetch("/api/student/placement-status"),
          ]);

        const progressJson = await progressRes.json();
        const placementJson = placementRes.ok ? await placementRes.json() : null;
        const readingJson = readingRes.ok
          ? await readingRes.json()
          : null;
        const listeningJson = listeningRes.ok
          ? await listeningRes.json()
          : null;

        if (!progressRes.ok) throw new Error(progressJson.error ?? "Failed");

        if (!cancelled) {
          const listeningAttempted = (listeningJson?.rows ?? []).filter(
            (r: { attempted?: boolean }) => r.attempted
          );
          const listeningAccs = listeningAttempted
            .map((r: { accuracy?: number | null }) => r.accuracy)
            .filter((a: number | null | undefined): a is number => a != null);
          const listeningAccuracy =
            listeningAccs.length > 0
              ? Math.round(
                  (listeningAccs.reduce((a: number, b: number) => a + b, 0) /
                    listeningAccs.length) *
                    10
                ) / 10
              : progressJson.listening?.accuracyPercent ?? null;

          const merged: ProgressView = {
            ...progressJson,
            placementCompleted: Boolean(placementJson?.placementCompleted),
            placementBand: placementJson?.placementBand ?? null,
            placementCefrLevel: placementJson?.placementCefrLevel ?? null,
            placementCefrName: placementJson?.placementCefrName ?? null,
            reading: {
              ...progressJson.reading,
              band:
                readingJson?.readingBand ?? progressJson.reading?.band ?? null,
              accuracyPercent:
                readingJson?.averageAccuracy ??
                progressJson.reading?.accuracyPercent ??
                null,
              typesMastered:
                readingJson?.typesPracticed ??
                progressJson.reading?.typesMastered ??
                0,
              typesTotal: 12,
            },
            listening: {
              ...progressJson.listening,
              band:
                listeningJson?.overallBand ??
                progressJson.listening?.band ??
                null,
              accuracyPercent: listeningAccuracy,
            },
          };

          const bands = [
            merged.writing?.band,
            merged.speaking?.band,
            merged.reading?.band,
            merged.listening?.band,
          ].filter((b): b is number => b != null && Number.isFinite(b));

          if (bands.length) {
            merged.overallBand =
              Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 10) / 10;
            if (merged.targetBand && merged.targetBand > 0) {
              merged.progressToTarget = Math.min(
                100,
                Math.round((merged.overallBand / merged.targetBand) * 100)
              );
            }
          }

          setData(merged);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  const overall = data?.overallBand;
  const progressPct = data?.progressToTarget ?? 0;

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="progress" />
      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50 p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">
            My Progress
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Track your IELTS journey across all skills
          </p>
        </header>

        {loading ? (
          <p className="text-slate-500">Loading your progress…</p>
        ) : !data ? (
          <p className="text-red-600">Could not load progress. Please try again.</p>
        ) : (
          <div className="space-y-8">
            {data.placementCompleted &&
            data.placementBand != null &&
            Number.isFinite(data.placementBand) ? (
              <section className="rounded-xl border border-[#0d9488]/40 bg-[#0d9488]/10 px-5 py-4">
                <p className="text-sm font-semibold text-[#0d9488]">
                  Your starting level: Band {data.placementBand.toFixed(1)}
                  {data.placementCefrLevel
                    ? ` (${data.placementCefrLevel}${
                        data.placementCefrName
                          ? ` — ${data.placementCefrName}`
                          : ""
                      })`
                    : ""}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Baseline from your Speakify placement test
                </p>
              </section>
            ) : null}

            <section className="rounded-2xl border border-[#c9972c]/30 bg-gradient-to-br from-[#0d1b35] to-[#152a4d] p-6 text-white shadow-lg sm:p-8">
              <p className="text-sm font-medium text-[#c9972c]">
                Overall Band Score
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-4">
                <span className="text-5xl font-bold text-[#c9972c] sm:text-6xl">
                  {formatBand(overall)}
                </span>
                {data.targetBand ? (
                  <span className="pb-2 text-lg text-slate-300">
                    Target:{" "}
                    <span className="font-semibold text-white">
                      {data.targetBand.toFixed(1)}
                    </span>
                  </span>
                ) : null}
              </div>
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs text-slate-300">
                  <span>Progress toward target</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#c9972c] transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Average across Writing, Speaking, Reading, and Listening
                {overall == null ? " — complete a practice session to see your score" : ""}
              </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <SkillPanel
                title="Writing"
                icon="W"
                href="/dashboard/student/writing"
                band={data.writing?.band}
                meta={
                  data.writing?.lastEssayDateLabel
                    ? `Last essay: ${data.writing.lastEssayDateLabel}`
                    : "No essays yet"
                }
              >
                <BreakdownRow label="TA" value={data.writing?.breakdown?.ta} />
                <BreakdownRow label="CC" value={data.writing?.breakdown?.cc} />
                <BreakdownRow label="LR" value={data.writing?.breakdown?.lr} />
                <BreakdownRow label="GRA" value={data.writing?.breakdown?.gra} />
              </SkillPanel>

              <SkillPanel
                title="Speaking"
                icon="S"
                href="/dashboard/student/speaking"
                band={data.speaking?.band}
                meta={
                  data.speaking?.lastAttemptDateLabel
                    ? `Last attempt: ${data.speaking.lastAttemptDateLabel}`
                    : "No attempts yet"
                }
              >
                <BreakdownRow label="FC" value={data.speaking?.breakdown?.fc} />
                <BreakdownRow label="LR" value={data.speaking?.breakdown?.lr} />
                <BreakdownRow label="GRA" value={data.speaking?.breakdown?.gra} />
                <BreakdownRow label="P" value={data.speaking?.breakdown?.p} />
              </SkillPanel>

              <SkillPanel
                title="Reading"
                icon="R"
                href="/dashboard/student/reading"
                band={data.reading?.band}
                meta={`${data.reading?.typesMastered ?? 0} / ${data.reading?.typesTotal ?? 12} question types`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Accuracy</span>
                  <span className="font-semibold text-[#0d1b35]">
                    {data.reading?.accuracyPercent != null
                      ? `${data.reading.accuracyPercent}%`
                      : "—"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Question types mastered across IELTS reading formats
                </p>
              </SkillPanel>

              <SkillPanel
                title="Listening"
                icon="L"
                href="/dashboard/student/listening"
                band={data.listening?.band}
                meta={`${data.listening?.sectionsCompleted ?? 0} / ${data.listening?.sectionsTotal ?? 4} sections`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Accuracy</span>
                  <span className="font-semibold text-[#0d1b35]">
                    {data.listening?.accuracyPercent != null
                      ? `${data.listening.accuracyPercent}%`
                      : "—"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {data.listening?.accuracyPercent != null
                    ? `${data.listening.accuracyPercent}% average accuracy`
                    : "Start a section to track accuracy"}
                </p>
              </SkillPanel>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0d1b35]">
                    Vocabulary Progress
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    CEFR level:{" "}
                    <span className="font-semibold text-[#0d9488]">
                      {data.vocabulary?.cefrLevel ?? "—"}
                    </span>
                  </p>
                </div>
                <Link
                  href="/dashboard/student/vocabulary"
                  className="text-sm font-semibold text-[#0d9488] hover:underline"
                >
                  Study words →
                </Link>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Words mastered
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#0d1b35]">
                    {data.vocabulary?.wordsMastered ?? 0}
                    <span className="text-base font-normal text-slate-400">
                      {" "}
                      / {data.vocabulary?.totalWords ?? 0}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Study streak
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#c9972c]">
                    {data.vocabulary?.streak ?? data.studyStreak ?? 0}{" "}
                    <span className="text-base font-normal text-slate-500">
                      days
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Complete
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#0d9488]">
                    {data.vocabulary?.percentComplete ?? 0}%
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#0d9488]"
                  style={{
                    width: `${data.vocabulary?.percentComplete ?? 0}%`,
                  }}
                />
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#0d1b35]">
                  Recent Activity
                </h2>
                {data.recentActivity.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    No activity yet. Start practicing to see your history here.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.recentActivity.map((item, i) => (
                      <li
                        key={`${item.module}-${item.dateLabel}-${i}`}
                        className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#0d1b35]">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.module} · {item.dateLabel}
                          </p>
                        </div>
                        {item.score != null ? (
                          <span className="text-lg font-bold text-[#c9972c]">
                            {item.score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-[#0d9488]">
                            Done
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#0d1b35]">Study streak</h2>
                <p className="mt-1 text-3xl font-bold text-[#c9972c]">
                  {data.studyStreak}{" "}
                  <span className="text-base font-normal text-slate-500">
                    day{data.studyStreak === 1 ? "" : "s"} in a row
                  </span>
                </p>
                <div className="mt-6 flex justify-between gap-2">
                  {data.last7Days.map((day) => (
                    <div
                      key={day.date}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <span className="text-[10px] font-medium text-slate-500">
                        {day.dayLabel}
                      </span>
                      <div
                        className={`flex h-10 w-full max-w-[40px] items-center justify-center rounded-lg text-xs font-bold ${
                          day.studied
                            ? "bg-[#c9972c] text-[#0d1b35]"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {day.studied ? "✓" : "·"}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Last 7 days — gold days show when you practiced
                </p>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
