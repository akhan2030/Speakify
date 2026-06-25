"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MidnightCountdown from "@/components/MidnightCountdown";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";

type ListeningDailyLimit = {
  unlimited?: boolean;
  sectionTestsUsed: number;
  sectionTestsRemaining: number;
  sectionTestsMax: number;
  mockTestsUsed: number;
  mockTestsRemaining: number;
  mockTestsMax: number;
  practiceTestsUsed: number;
  practiceTestsRemaining: number;
  practiceTestsMax: number;
  canTakeSection: boolean;
  canTakeMock: boolean;
  canTakePractice: boolean;
};

type TrackerRow = {
  questionType: string;
  questionTypeId: string;
  totalAttempts: number;
  correctAnswers: number;
  accuracy: number | null;
  estimatedBand: number | null;
  attempted: boolean;
};

type ListeningTracker = {
  hasData: boolean;
  typesAttempted: number;
  overallBand: number | null;
  rows: TrackerRow[];
};

function HeadphonesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M3 14h3a2 2 0 0 0 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 0 2-2h3" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function SchoolIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function ChalkboardIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M8 21h8" /><path d="M12 17v4" /><path d="M3 5h18v10H3z" /><path d="M7 15h10" />
    </svg>
  );
}

function formatBand(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

function formatAccuracy(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${Math.round(value * 10) / 10}%`;
}

function accuracyClass(accuracy: number | null, attempted: boolean) {
  if (!attempted) return "text-slate-400 italic";
  if (accuracy === null) return "text-slate-500";
  if (accuracy >= 70) return "text-green-600 font-semibold";
  if (accuracy >= 50) return "text-amber-600 font-semibold";
  return "text-red-600 font-semibold";
}

function LimitBar({
  used,
  max,
  dark = false,
}: {
  used: number;
  max: number;
  dark?: boolean;
}) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div className="mt-3">
      <p className={`text-xs ${dark ? "text-[#c9972c]" : "text-[#c9972c]"}`}>
        {used} of {max} today
      </p>
      <div
        className={`mt-1.5 h-1 w-full overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-slate-100"}`}
      >
        <div
          className="h-full rounded-full bg-[#c9972c] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const SECTION_CARDS = [
  {
    section: 1,
    borderColor: "#c9972c",
    iconColor: "#c9972c",
    Icon: UsersIcon,
    questionRange: "Questions 1-10",
    difficulty: { label: "Easiest", className: "bg-green-100 text-green-700" },
    title: "Conversation",
    description:
      "Two people in everyday social context. Booking, registration, and enquiry topics.",
    questionTypePill: "Form + Table Completion",
    buttonClass: "bg-[#c9972c] hover:bg-[#b8862b] text-[#0d1b35]",
  },
  {
    section: 2,
    borderColor: "#0d9488",
    iconColor: "#0d9488",
    Icon: SpeakerIcon,
    questionRange: "Questions 11-20",
    difficulty: { label: "Easy-Medium", className: "bg-amber-100 text-amber-700" },
    title: "Social Monologue",
    description:
      "One speaker on community or social topic. Tours, announcements, local facilities.",
    questionTypePill: "Note Completion + Matching",
    buttonClass: "bg-[#0d9488] hover:bg-[#0b7f73] text-white",
  },
  {
    section: 3,
    borderColor: "#7c3aed",
    iconColor: "#7c3aed",
    Icon: SchoolIcon,
    questionRange: "Questions 21-30",
    difficulty: { label: "Medium-Hard", className: "bg-amber-100 text-amber-700" },
    title: "Academic Discussion",
    description:
      "2-4 speakers in academic context. University assignments and research projects.",
    questionTypePill: "Multiple Choice + Matching",
    buttonClass: "bg-[#7c3aed] hover:bg-[#6d28d9] text-white",
  },
  {
    section: 4,
    borderColor: "#1d4ed8",
    iconColor: "#1d4ed8",
    Icon: ChalkboardIcon,
    questionRange: "Questions 31-40",
    difficulty: { label: "Hardest", className: "bg-red-100 text-red-700" },
    title: "Academic Lecture",
    description:
      "One speaker giving academic lecture. Science, history, sociology, technology.",
    questionTypePill: "Note + Summary Completion",
    buttonClass: "bg-[#1d4ed8] hover:bg-[#1e40af] text-white",
  },
];

export default function ListeningPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isPathway } = usePathwayStudentContext();
  const studentId = (session?.user as { id?: string })?.id ?? "";

  const [limits, setLimits] = useState<ListeningDailyLimit | null>(null);
  const [tracker, setTracker] = useState<ListeningTracker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !studentId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [limitRes, trackerRes] = await Promise.all([
          fetch(
            `/api/listening/daily-limit?studentId=${encodeURIComponent(studentId)}`
          ),
          fetch(
            `/api/listening/tracker?studentId=${encodeURIComponent(studentId)}`
          ),
        ]);

        const limitData = await limitRes.json().catch(() => null);
        const trackerData = await trackerRes.json().catch(() => null);

        if (!cancelled) {
          if (limitRes.ok && limitData) setLimits(limitData);
          if (trackerRes.ok && trackerData) setTracker(trackerData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, studentId]);

  const weakAreas = useMemo(() => {
    if (!tracker?.rows) return [];
    return tracker.rows
      .filter((r) => r.attempted && r.accuracy !== null)
      .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
      .slice(0, 3);
  }, [tracker]);

  if (status === "loading" || status === "unauthenticated" || loading) {
    return <PageSpinner />;
  }

  const sectionUsed = limits?.sectionTestsUsed ?? 0;
  const sectionMax = limits?.sectionTestsMax ?? 10;
  const mockUsed = limits?.mockTestsUsed ?? 0;
  const mockMax = limits?.mockTestsMax ?? 10;
  const canTakeSection = limits?.canTakeSection ?? true;
  const canTakeMock = limits?.canTakeMock ?? true;

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="listening" />

      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <header>
            <h1 className="text-[28px] font-bold text-[#0d1b35]">
              {isPathway ? "Listening Practice" : "IELTS Academic Listening"}
            </h1>
            <p className="mt-2 text-base text-slate-500">
              {isPathway
                ? "Train your ear with everyday and academic listening tasks"
                : "30 minutes · 4 sections · 40 questions · Audio plays once"}
            </p>
          </header>

          <div className="mt-6 flex items-start gap-4 rounded-xl bg-[#c9972c]/15 px-5 py-4">
            <HeadphonesIcon className="h-7 w-7 shrink-0 text-[#c9972c]" />
            <p className="text-sm leading-relaxed text-[#0d1b35]">
              {isPathway
                ? "For best results use headphones. Listen carefully — audio may only play once."
                : "For best results use headphones. Audio plays once — just like the real IELTS exam. Turn up your volume."}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {SECTION_CARDS.map((card) => {
              const Icon = card.Icon;
              const href = `/dashboard/student/listening/section/${card.section}`;
              const atLimit = !canTakeSection && !limits?.unlimited;

              return (
                <div
                  key={card.section}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{ borderLeftWidth: 4, borderLeftColor: card.borderColor }}
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0" style={{ color: card.iconColor }}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-base font-bold text-[#0d1b35]">
                      Section {card.section}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#0d1b35]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0d1b35]">
                      {card.questionRange}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${card.difficulty.className}`}
                    >
                      {card.difficulty.label}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-bold text-[#0d1b35]">
                    {card.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {card.description}
                  </p>

                  <span className="mt-3 inline-block w-fit rounded-full border border-[#c9972c] px-3 py-1 text-xs font-semibold text-[#c9972c]">
                    {card.questionTypePill}
                  </span>

                  <LimitBar used={sectionUsed} max={sectionMax} />

                  {atLimit ? (
                    <span
                      className={`mt-4 block w-full rounded-xl py-3 text-center text-sm font-bold ${card.buttonClass} cursor-not-allowed opacity-50`}
                    >
                      Daily Limit Reached
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className={`mt-4 block w-full rounded-xl py-3 text-center text-sm font-bold transition-colors ${card.buttonClass}`}
                    >
                      Practice Section {card.section}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {!isPathway ? (
          <div className="mt-8 flex flex-col gap-6 rounded-2xl bg-[#0d1b35] p-6 shadow-lg lg:flex-row lg:items-center">
            <div className="flex-1 lg:w-[70%]">
              <h2 className="text-xl font-bold text-white">
                Ready for the full exam experience?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                All 4 sections · 30 minutes · Audio plays once per section
                <br />
                Screen locks when time is up — real exam conditions.
              </p>
              <LimitBar used={mockUsed} max={mockMax} dark />
            </div>
            <div className="flex shrink-0 flex-col items-center justify-center gap-3 lg:w-[30%]">
              {canTakeMock || limits?.unlimited ? (
                <Link
                  href="/dashboard/student/listening/test"
                  className="rounded-xl bg-[#c9972c] px-8 py-3.5 text-center text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
                >
                  Start Full Mock Test
                </Link>
              ) : (
                <div className="max-w-xs rounded-xl border border-[#c9972c]/40 bg-white/10 px-5 py-4 text-center">
                  <p className="text-sm font-bold text-[#c9972c]">
                    Daily mock limit reached
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    You have used all {mockMax} full mock tests for today. Your
                    limit resets at midnight.
                  </p>
                  <MidnightCountdown
                    prefix="Resets in"
                    className="mt-3 text-xs text-slate-300"
                  />
                </div>
              )}
            </div>
          </div>
          ) : null}

          <section className="mt-12">
            <h2 className="text-xl font-bold text-[#0d1b35]">
              Your Performance by Question Type
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Based on your listening practice history
            </p>

            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                      Question Type
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                      Attempts
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                      Correct
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                      Accuracy
                    </th>
                    {!isPathway ? (
                    <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                      Est. Band
                    </th>
                    ) : null}
                    <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(tracker?.rows ?? []).map((row) => (
                    <tr
                      key={row.questionTypeId}
                      className={`border-b border-slate-100 last:border-0 ${
                        !row.attempted ? "bg-slate-50/50" : ""
                      }`}
                    >
                      <td
                        className={`px-4 py-3 ${
                          row.attempted ? "text-slate-700" : "italic text-slate-400"
                        }`}
                      >
                        {row.attempted ? row.questionType : `${row.questionType} — Not attempted`}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.attempted ? row.totalAttempts : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.attempted ? row.correctAnswers : "—"}
                      </td>
                      <td
                        className={`px-4 py-3 ${accuracyClass(row.accuracy, row.attempted)}`}
                      >
                        {row.attempted
                          ? formatAccuracy(row.accuracy)
                          : "—"}
                      </td>
                      {!isPathway ? (
                      <td className="px-4 py-3 font-semibold text-[#c9972c]">
                        {row.attempted ? formatBand(row.estimatedBand) : "—"}
                      </td>
                      ) : null}
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/student/listening/practice/${row.questionTypeId}`}
                          className={`inline-block rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                            row.attempted
                              ? "bg-[#c9972c] text-[#0d1b35] hover:bg-[#b8862b]"
                              : "border-2 border-[#0d1b35] text-[#0d1b35] hover:bg-[#0d1b35] hover:text-white"
                          }`}
                        >
                          {row.attempted ? "Practice" : "Try Now"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-stretch">
              <div
                className="flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: "#ef4444" }}
              >
                <h3 className="font-bold text-red-600">Focus Areas</h3>
                {weakAreas.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {weakAreas.map((area) => (
                      <li
                        key={area.questionTypeId}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span className="flex items-center gap-2 text-slate-700">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          {area.questionType} — {formatAccuracy(area.accuracy)}
                          {!isPathway ? (
                            <> — Band {formatBand(area.estimatedBand)}</>
                          ) : null}
                        </span>
                        <Link
                          href={`/dashboard/student/listening/practice/${area.questionTypeId}`}
                          className="rounded-lg bg-[#c9972c] px-3 py-1 text-xs font-bold text-[#0d1b35] hover:bg-[#b8862b]"
                        >
                          Practice
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Complete practice sessions to see focus areas.
                  </p>
                )}
              </div>

              {!isPathway ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm lg:w-64">
                <p className="text-5xl font-extrabold text-[#c9972c]">
                  {formatBand(tracker?.overallBand ?? null)}
                </p>
                <p className="mt-2 text-sm font-bold text-[#0d1b35]">
                  Overall Listening Band
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Based on {tracker?.typesAttempted ?? 0} question types attempted
                </p>
              </div>
              ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm lg:w-64">
                <p className="text-5xl font-extrabold text-[#0d9488]">
                  {tracker?.typesAttempted ?? 0}
                </p>
                <p className="mt-2 text-sm font-bold text-[#0d1b35]">
                  Question types practiced
                </p>
              </div>
              )}
            </div>
          </section>

          <section className="mt-12 pb-8">
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: "Listen Once",
                  desc: "Audio plays exactly once — no replay",
                },
                {
                  step: "Answer Questions",
                  desc: "Complete all questions before time runs out",
                },
                {
                  step: isPathway ? "Get Feedback" : "Get Your Band",
                  desc: isPathway
                    ? "Instant feedback on your answers"
                    : "Instant score with detailed feedback",
                },
              ].map((item, i) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#c9972c] text-lg font-bold text-[#0d1b35]">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 font-bold text-[#0d1b35]">{item.step}</h3>
                  <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
