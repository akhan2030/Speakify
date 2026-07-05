"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";

type Difficulty = "Easy" | "Medium" | "Hard";

type StrategyType = {
  slug: string;
  name: string;
  difficulty: Difficulty;
  tip: string;
};

type TrackerRow = {
  question_type: string;
  attempts: number;
  accuracy: number | null;
  estimated_band: number | null;
};

const STRATEGY_TYPES: StrategyType[] = [
  {
    slug: "multiple-choice",
    name: "Multiple Choice",
    difficulty: "Medium",
    tip: "Eliminate wrong answers using keywords",
  },
  {
    slug: "true-false-not-given",
    name: "True/False/Not Given",
    difficulty: "Hard",
    tip: "Only use text — never use outside knowledge",
  },
  {
    slug: "matching-headings",
    name: "Matching Headings",
    difficulty: "Hard",
    tip: "Read first and last sentence of each paragraph only",
  },
  {
    slug: "matching-information",
    name: "Matching Information",
    difficulty: "Medium",
    tip: "Scan for names, dates, and numbers first",
  },
  {
    slug: "matching-features",
    name: "Matching Features",
    difficulty: "Medium",
    tip: "Underline all names in questions before reading",
  },
  {
    slug: "matching-sentence-endings",
    name: "Matching Sentence Endings",
    difficulty: "Medium",
    tip: "Focus on logical and grammatical flow",
  },
  {
    slug: "sentence-completion",
    name: "Sentence Completion",
    difficulty: "Medium",
    tip: "Predict word type before reading passage",
  },
  {
    slug: "summary-completion",
    name: "Summary Completion",
    difficulty: "Medium",
    tip: "Find synonyms — answers are paraphrased",
  },
  {
    slug: "note-completion",
    name: "Note Completion",
    difficulty: "Easy",
    tip: "Answers follow passage order",
  },
  {
    slug: "short-answer",
    name: "Short Answer Questions",
    difficulty: "Easy",
    tip: "Use exact words from passage — never paraphrase",
  },
  {
    slug: "diagram-completion",
    name: "Diagram/Flowchart Completion",
    difficulty: "Hard",
    tip: "Follow sequence markers: first, then, finally",
  },
  {
    slug: "classification",
    name: "Classification",
    difficulty: "Medium",
    tip: "Create a category table before answering",
  },
];

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, "-");
}

function formatBand(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function bandDisplayClass(band: number | null | undefined): string {
  if (band === null || band === undefined || !Number.isFinite(band)) {
    return "text-slate-400";
  }
  if (band >= 7) return "text-green-600";
  if (band >= 5) return "text-amber-600";
  return "text-red-600";
}

function StrategyCard({
  type,
  band,
  base,
}: {
  type: StrategyType;
  band: number | null;
  base: string;
}) {
  const bandLabel =
    band !== null && Number.isFinite(band) ? formatBand(band) : "Not attempted";
  const bandClass = bandDisplayClass(band);

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold text-[#0d1b35]">{type.name}</h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_CLASS[type.difficulty]}`}
        >
          {type.difficulty}
        </span>
      </div>

      <p className="mt-3 text-sm">
        <span className="text-slate-500">Your band: </span>
        <span className={`font-bold ${bandClass}`}>{bandLabel}</span>
      </p>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
        {type.tip}
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href={`${base}/reading/strategies/${type.slug}`}
          className="flex-1 rounded-lg border border-[#0d1b35] py-2.5 text-center text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#0d1b35] hover:text-white"
        >
          Learn Strategy
        </Link>
        <Link
          href={`${base}/reading/practice/${type.slug}`}
          className="flex-1 rounded-lg bg-[#c9972c] py-2.5 text-center text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
        >
          Practice Now
        </Link>
      </div>
    </div>
  );
}

export default function ReadingStrategiesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { base, usesProgramShell, dashboardHref } = usePathwayStudentContext();
  const [trackerRows, setTrackerRows] = useState<TrackerRow[]>([]);

  const bandBySlug = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of trackerRows) {
      if (row.estimated_band !== null && Number.isFinite(row.estimated_band)) {
        map.set(normalizeSlug(row.question_type), row.estimated_band);
      }
    }
    return map;
  }, [trackerRows]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadTracker() {
      try {
        const res = await fetch("/api/reading/tracker?all=true");
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok && Array.isArray(data?.rows)) {
          setTrackerRows(data.rows);
        }
      } catch {
        if (!cancelled) setTrackerRows([]);
      }
    }

    loadTracker();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="reading" /> : null}

      <main className={`min-h-screen flex-1 bg-slate-50 ${usesProgramShell ? "" : "ml-[200px]"}`}>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link
            href={`${base}/reading`}
            className="text-sm font-semibold text-[#0d1b35] hover:text-[#c9972c]"
          >
            ← Back to Reading
          </Link>

          <nav className="mt-4 flex flex-wrap items-center gap-1 text-sm text-slate-500">
            <Link href={dashboardHref} className="hover:text-[#c9972c]">
              Dashboard
            </Link>
            <span>&gt;</span>
            <Link href={`${base}/reading`} className="hover:text-[#c9972c]">
              Reading
            </Link>
            <span>&gt;</span>
            <span className="font-medium text-[#0d1b35]">Strategies</span>
          </nav>

          <header className="mt-4">
            <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">
              Reading Strategies
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Learn the expert approach for every question type
            </p>
          </header>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STRATEGY_TYPES.map((type) => (
              <StrategyCard
                key={type.slug}
                type={type}
                band={bandBySlug.get(type.slug) ?? null}
                base={base}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
