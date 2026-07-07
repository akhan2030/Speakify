"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import { getGrammarCategories, grammarLessonHref } from "@/lib/grammar";
import { GENERAL_GRAMMAR_TIPS } from "@/lib/ielts-general/grammarTips";
import { useGrammarProgramme } from "@/components/grammar/useGrammarProgramme";

type ProgressRow = {
  category: string;
  lessonsCompleted: number;
  totalLessons: number;
  percentComplete: number;
};

const IELTS_GRAMMAR_TIPS = [
  {
    title: "Writing Task 1",
    body: "Use passive voice and precise tense control when describing charts and processes.",
  },
  {
    title: "Writing Task 2",
    body: "Complex sentences with conditionals and relative clauses raise your GRA score.",
  },
  {
    title: "Speaking",
    body: "Mix tenses naturally when telling stories in Part 2 and explaining opinions in Part 3.",
  },
];

export default function GrammarHomePage() {
  const router = useRouter();
  const { status } = useSession();
  const { isPathway, base, usesProgramShell } = usePathwayStudentContext();
  const grammarProgramme = useGrammarProgramme();
  const isGeneralGrammar = grammarProgramme === "general";
  const grammarCategories = getGrammarCategories(grammarProgramme);
  const [tab, setTab] = useState<"lessons" | "ielts">("lessons");
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/grammar/progress");
      const json = await res.json();
      const map: Record<string, ProgressRow> = {};
      for (const row of json.categories ?? []) {
        map[row.category] = row;
      }
      setProgress(map);
      setTableMissing(Boolean(json.tableMissing));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadProgress();
  }, [status, loadProgress]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="grammar" /> : null}
      <main
        className={`min-h-screen flex-1 bg-slate-50 px-8 py-8 ${usesProgramShell ? "" : "ml-[200px]"}`}
      >
        <div className="mx-auto max-w-6xl">
          <header>
            <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">
              {isPathway
                ? "Grammar"
                : isGeneralGrammar
                  ? "Grammar for General Training"
                  : "Grammar for IELTS"}
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              {isPathway
                ? "Build accurate English grammar step by step at your CEFR level"
                : isGeneralGrammar
                  ? "Grammar for letters, essays, and everyday English — not Academic graph reports"
                  : "Master the grammar structures that boost your band score"}
            </p>
          </header>

          {tableMissing ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Run <code className="text-xs">supabase/grammar_progress_setup.sql</code>{" "}
              to save lesson progress.
            </p>
          ) : null}

          <div className="mt-6 flex gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setTab("lessons")}
              className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
                tab === "lessons"
                  ? "border-b-2 border-[#c9972c] text-[#0d1b35]"
                  : "text-slate-500 hover:text-[#0d1b35]"
              }`}
            >
              Grammar Lessons
            </button>
            {!isPathway ? (
            <button
              type="button"
              onClick={() => setTab("ielts")}
              className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
                tab === "ielts"
                  ? "border-b-2 border-[#c9972c] text-[#0d1b35]"
                  : "text-slate-500 hover:text-[#0d1b35]"
              }`}
            >
              Grammar in {isGeneralGrammar ? "General Training" : "IELTS"}
            </button>
            ) : null}
          </div>

          {!isPathway && tab === "ielts" ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {(isGeneralGrammar ? GENERAL_GRAMMAR_TIPS : IELTS_GRAMMAR_TIPS).map(
                (tip) => (
                <div
                  key={tip.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-bold text-[#0d9488]">{tip.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{tip.body}</p>
                </div>
              )
              )}
              <div className="rounded-xl border border-[#c9972c]/30 bg-[#c9972c]/10 p-5 sm:col-span-3">
                <p className="text-sm text-[#0d1b35]">
                  Band 7+ candidates use a variety of complex structures accurately.
                  Practise each category below, then test yourself in{" "}
                  <Link
                    href={`${base}/grammar/practice`}
                    className="font-semibold text-[#0d9488] hover:underline"
                  >
                    Grammar Practice
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 flex justify-end">
                <Link
                  href={`${base}/grammar/practice`}
                  className="rounded-xl border-2 border-[#0d9488] px-5 py-2.5 text-sm font-bold text-[#0d9488] hover:bg-[#0d9488]/10"
                >
                  Mixed Practice →
                </Link>
              </div>

              {loading ? (
                <p className="mt-8 text-slate-500">Loading progress…</p>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {grammarCategories.map((cat) => {
                    const row = progress[cat.slug];
                    const pct = row?.percentComplete ?? 0;
                    return (
                      <article
                        key={cat.slug}
                        className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h2 className="text-lg font-bold text-[#0d1b35]">
                              {cat.name}
                            </h2>
                            <p className="text-xs text-slate-500">{cat.subtitle}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#0d1b35]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0d1b35]">
                            {cat.difficulty}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-600">
                          {cat.lessonCount} lessons
                        </p>
                        <div className="mt-4">
                          <div className="mb-1 flex justify-between text-xs text-slate-500">
                            <span>Progress</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#c9972c]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <Link
                          href={grammarLessonHref(cat.slug, base)}
                          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#0d1b35] py-2.5 text-sm font-bold text-white hover:bg-[#152a4d]"
                        >
                          Start Learning
                        </Link>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
