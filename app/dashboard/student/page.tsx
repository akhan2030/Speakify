"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StudentSidebar, { getRoleLabel, PageSpinner } from "@/components/StudentSidebar";
import IeltsReadinessMeter from "@/components/student/IeltsReadinessMeter";
import SpeakifyWay from "@/components/SpeakifyWay";

type ReadingSummary = {
  readingBand: number | null;
  typesPracticed: number;
};

const OTHER_SKILL_CARDS = [
  { name: "Writing", icon: "W", score: "5.5", percent: 60, barClass: "bg-[#c9972c]", href: "/dashboard/student/writing" },
  { name: "Speaking", icon: "S", score: "6.0", percent: 66, barClass: "bg-[#c9972c]", href: "/dashboard/student/speaking" },
  { name: "Listening", icon: "L", score: "3.4", percent: 37, barClass: "bg-red-500", href: "/dashboard/student/listening" },
  { name: "Vocabulary", icon: "V", score: "6.5", percent: 72, barClass: "bg-[#c9972c]", href: "/dashboard/student/vocabulary" },
  { name: "Grammar", icon: "G", score: "5.0", percent: 55, barClass: "bg-[#c9972c]", href: "/dashboard/student/grammar" },
];

function ProgressBar({
  percent,
  className = "bg-[#c9972c]",
}: {
  percent: number;
  className?: string;
}) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${className}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function HorizontalBarRow({
  label,
  score,
  percent,
  variant = "gold",
}: {
  label: string;
  score?: string;
  percent?: number;
  variant?: "gold" | "amber" | "red" | "none";
}) {
  if (variant === "none") {
    return (
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="italic text-slate-400">not attempted</span>
      </div>
    );
  }

  const barClass =
    variant === "red"
      ? "bg-red-500"
      : variant === "amber"
        ? "bg-amber-500"
        : "bg-[#c9972c]";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        {score ? <span className="font-semibold text-[#0d1b35]">{score}</span> : null}
      </div>
      <ProgressBar percent={percent ?? 0} className={barClass} />
    </div>
  );
}

function ReadingSkillCard({ summary }: { summary: ReadingSummary }) {
  const hasAttempts = summary.typesPracticed > 0;
  const progressPercent = Math.round((summary.typesPracticed / 12) * 100);

  return (
    <Link
      href="/dashboard/student/reading"
      className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md hover:ring-2 hover:ring-[#c9972c]/30"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d1b35] text-sm font-bold text-white">
        R
      </div>
      <div className="mt-2 text-xs text-slate-500">Reading</div>
      {hasAttempts ? (
        <>
          <div className="mt-1 text-2xl font-bold text-[#c9972c]">
            {summary.readingBand !== null
              ? summary.readingBand.toFixed(1)
              : "—"}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            {summary.typesPracticed} question type
            {summary.typesPracticed === 1 ? "" : "s"} practiced
          </p>
        </>
      ) : (
        <>
          <div className="mt-1 text-sm font-bold text-[#c9972c]">
            Start Practice
          </div>
          <p className="mt-1 text-[10px] text-slate-400">No attempts yet</p>
        </>
      )}
      <div className="mt-3 w-full">
        <ProgressBar percent={progressPercent} className="bg-[#c9972c]" />
      </div>
    </Link>
  );
}

function SkillCard({
  name,
  icon,
  score,
  percent,
  barClass,
  href,
}: {
  name: string;
  icon: string;
  score: string;
  percent: number;
  barClass: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md hover:ring-2 hover:ring-[#c9972c]/30"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d1b35] text-sm font-bold text-white">
        {icon}
      </div>
      <div className="mt-2 text-xs text-slate-500">{name}</div>
      <div className="mt-1 text-2xl font-bold text-[#c9972c]">{score}</div>
      <div className="mt-3 w-full">
        <ProgressBar percent={percent} className={barClass} />
      </div>
    </Link>
  );
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [readingSummary, setReadingSummary] = useState<ReadingSummary>({
    readingBand: null,
    typesPracticed: 0,
  });
  const [showPlacementBanner, setShowPlacementBanner] = useState(false);

  const studentName = session?.user?.name ?? "Student";
  const roleLabel = getRoleLabel((session?.user as { role?: string })?.role);

  const initials = useMemo(() => {
    if (!studentName?.trim()) return "ST";
    const parts = studentName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [studentName]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadReadingSummary() {
      try {
        const res = await fetch("/api/reading/stats");
        const data = await res.json().catch(() => null);
        if (!cancelled && data) {
          setReadingSummary({
            readingBand:
              data.readingBand !== null && Number.isFinite(data.readingBand)
                ? data.readingBand
                : null,
            typesPracticed: Number(data.typesPracticed) || 0,
          });
        }
      } catch {
        if (!cancelled) {
          setReadingSummary({ readingBand: null, typesPracticed: 0 });
        }
      }
    }

    async function loadPlacementStatus() {
      try {
        const res = await fetch("/api/student/placement-status");
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok && data) {
          setShowPlacementBanner(
            Boolean(data.showBanner ?? data.needsPlacementBanner)
          );
        }
      } catch {
        if (!cancelled) setShowPlacementBanner(false);
      }
    }

    loadReadingSummary();
    loadPlacementStatus();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="dashboard" />

      <main className="ml-[200px] min-h-screen flex-1 bg-white p-6">
        {showPlacementBanner ? (
          <Link
            href="/placement-test"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c9972c]/40 bg-[#c9972c]/15 px-5 py-4 transition-colors hover:bg-[#c9972c]/25"
          >
            <p className="text-sm font-medium text-[#0d1b35] sm:text-base">
              📝 Take your free placement test to get matched to the right level
            </p>
            <span className="shrink-0 rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35]">
              Start Test
            </span>
          </Link>
        ) : null}

        <IeltsReadinessMeter />

        <SpeakifyWay variant="banner" className="mb-8" />

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#0d1b35]">
              Good morning, {studentName}!
            </h1>
            <p className="mt-1 text-sm text-slate-500">{roleLabel}</p>
            <p className="text-sm text-slate-500">
              You have 2 lessons scheduled today
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c9972c] text-sm font-bold text-[#0d1b35]">
              {initials}
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <SkillCard {...OTHER_SKILL_CARDS[0]} />
          <SkillCard {...OTHER_SKILL_CARDS[1]} />
          <ReadingSkillCard summary={readingSummary} />
          <SkillCard {...OTHER_SKILL_CARDS[2]} />
          <SkillCard {...OTHER_SKILL_CARDS[3]} />
          <SkillCard {...OTHER_SKILL_CARDS[4]} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-[#0d1b35]">
              Reading — Question Types
            </h2>
            <div className="space-y-4">
              <HorizontalBarRow label="Multiple Choice" score="9.0" percent={100} variant="gold" />
              <HorizontalBarRow label="Matching Headings" score="1.7" percent={20} variant="red" />
              <HorizontalBarRow label="Sentence Completion" score="5.0" percent={55} variant="amber" />
              <HorizontalBarRow label="True/False/Not Given" variant="none" />
              <HorizontalBarRow label="Matching Information" variant="none" />
              <HorizontalBarRow label="Short Answer" variant="none" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-[#0d1b35]">
              Listening — Question Types
            </h2>
            <div className="space-y-4">
              <HorizontalBarRow label="Multiple Choice" score="4.3" percent={48} variant="amber" />
              <HorizontalBarRow label="Form Completion" score="4.0" percent={45} variant="amber" />
              <HorizontalBarRow label="Sentence Completion" score="2.0" percent={22} variant="red" />
              <HorizontalBarRow label="Matching" variant="none" />
              <HorizontalBarRow label="Map Labelling" variant="none" />
              <HorizontalBarRow label="Flow-chart" variant="none" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-[#0d1b35]">My Schedule</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0d1b35]" />
                  <span>
                    <span className="font-medium text-slate-800">Live Writing Class</span>
                    <span className="block text-slate-500">Today 4:00 PM</span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c9972c]" />
                  <span>
                    <span className="font-medium text-slate-800">Speaking Session</span>
                    <span className="block text-slate-500">Tomorrow 10:00 AM</span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                  <span>
                    <span className="font-medium text-slate-800">Mock IELTS Test</span>
                    <span className="block text-slate-500">Friday 2:00 PM</span>
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-[#0d1b35]">Focus This Week</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-slate-700">Matching Headings (Reading)</span>
                  </span>
                  <span className="font-semibold text-red-600">1.7</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-slate-700">Sentence Completion (Listening)</span>
                  </span>
                  <span className="font-semibold text-red-600">2.0</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-slate-700">Overall Listening</span>
                  </span>
                  <span className="font-semibold text-red-600">34%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
