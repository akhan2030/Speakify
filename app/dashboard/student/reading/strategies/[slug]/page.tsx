"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getReadingStrategy } from "@/lib/readingStrategyContent";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";

type Difficulty = "Easy" | "Medium" | "Hard";

type StrategyStep = {
  title: string;
  description: string;
};

type StrategyMistake = {
  title: string;
  explanation: string;
};

type StrategyContent = {
  slug: string;
  name: string;
  difficulty: Difficulty;
  description: string;
  howItWorksBullets: string[];
  example: string;
  expertSteps: StrategyStep[];
  commonMistakes: StrategyMistake[];
  quickTips: string[];
};

type TrackerRow = {
  question_type: string;
  estimated_band: number | null;
};

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

function StrategyComingSoon({ slug, base }: { slug: string; base: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-[#0d1b35]">Strategy coming soon</h1>
      <p className="mt-3 text-slate-600">
        We are preparing expert guidance for{" "}
        <span className="font-medium text-[#0d1b35]">
          {slug.replace(/-/g, " ")}
        </span>
        .
      </p>
      <Link
        href={`${base}/reading/strategies`}
        className="mt-6 inline-flex rounded-xl border border-[#0d1b35] px-6 py-2.5 text-sm font-bold text-[#0d1b35] hover:bg-[#0d1b35] hover:text-white"
      >
        Back to All Strategies
      </Link>
    </div>
  );
}

function StrategyPageContent({
  strategy,
  band,
  base,
}: {
  strategy: StrategyContent;
  band: number | null;
  base: string;
}) {
  const bandLabel =
    band !== null && Number.isFinite(band) ? formatBand(band) : "Not attempted";

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">
              {strategy.name}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {strategy.description}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${DIFFICULTY_CLASS[strategy.difficulty]}`}
          >
            {strategy.difficulty}
          </span>
        </div>
        <p className="mt-4 text-sm">
          <span className="text-slate-500">Your current band: </span>
          <span className={`font-bold ${bandDisplayClass(band)}`}>{bandLabel}</span>
        </p>
      </section>

      {/* 2. How it works */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0d1b35]">
          How This Question Type Works
        </h2>
        <ul className="mt-4 space-y-2">
          {strategy.howItWorksBullets.map((bullet) => (
            <li
              key={bullet}
              className="flex gap-2.5 text-sm leading-relaxed text-[#374151]"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0d1b35]" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-l-4 border-[#0d1b35] bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Example
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {strategy.example}
          </p>
        </div>
      </section>

      {/* 3. Expert strategy */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0d1b35]">Expert Strategy</h2>
        <div className="mx-0 mt-2 h-0.5 w-16 bg-[#c9972c]" />
        <ol className="mt-6 space-y-5">
          {strategy.expertSteps.map((step, index) => (
            <li key={index} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c9972c] text-sm font-bold text-[#0d1b35]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-[#0d1b35]">{step.title}</h3>
                {step.description ? (
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Common mistakes */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0d1b35]">
          Common Mistakes to Avoid
        </h2>
        <div className="mt-4 space-y-3">
          {strategy.commonMistakes.map((mistake) => (
            <div
              key={mistake.title}
              className="rounded-lg border-l-4 border-red-500 bg-red-50/60 px-4 py-3"
            >
              <p className="flex gap-2 font-bold text-red-600">
                <span aria-hidden>✗</span>
                <span>{mistake.title}</span>
              </p>
              <p className="mt-1 pl-5 text-sm leading-relaxed text-[#374151]">
                {mistake.explanation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Quick tips */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0d1b35]">Quick Tips</h2>
        <ul className="mt-4 space-y-2">
          {strategy.quickTips.map((tip) => (
            <li
              key={tip}
              className="flex gap-2.5 text-sm leading-relaxed text-[#374151]"
            >
              <span className="shrink-0 font-bold text-[#c9972c]">✓</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Practice button */}
      <Link
        href={`${base}/reading/practice/${strategy.slug}`}
        className="block w-full rounded-xl bg-[#c9972c] py-4 text-center text-base font-bold text-[#0d1b35] shadow-sm transition-colors hover:bg-[#b8862b]"
      >
        Practice {strategy.name} Now →
      </Link>
    </div>
  );
}

export default function ReadingStrategyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const { base, usesProgramShell } = usePathwayStudentContext();
  const [band, setBand] = useState<number | null>(null);

  const slug = normalizeSlug(String(params?.slug ?? ""));
  const strategy = getReadingStrategy(slug) as StrategyContent | null;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !slug) return;

    let cancelled = false;

    async function loadBand() {
      try {
        const res = await fetch("/api/reading/tracker?all=true");
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok && Array.isArray(data?.rows)) {
          const row = (data.rows as TrackerRow[]).find(
            (item) => normalizeSlug(item.question_type) === slug
          );
          setBand(row?.estimated_band ?? null);
        }
      } catch {
        if (!cancelled) setBand(null);
      }
    }

    loadBand();
    return () => {
      cancelled = true;
    };
  }, [status, slug]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="min-h-screen flex bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="reading" /> : null}

      <main className={`min-h-screen flex-1 bg-slate-50 ${usesProgramShell ? "" : "ml-[200px]"}`}>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link
            href={`${base}/reading/strategies`}
            className="text-sm font-medium text-[#0d1b35] hover:text-[#c9972c]"
          >
            ← All Strategies
          </Link>

          <div className="mt-4">
            {strategy ? (
              <StrategyPageContent strategy={strategy} band={band} base={base} />
            ) : (
              <StrategyComingSoon slug={slug} base={base} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
