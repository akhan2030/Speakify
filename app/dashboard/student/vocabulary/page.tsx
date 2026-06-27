"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import { useVocabularyCefr } from "@/components/vocabulary/useVocabularyCefr";
import { SPEAKIFY_CEFR_LEVELS, VOCAB_LEVEL_BANKS, type VocabularyWord } from "@/lib/vocabulary";
import type { VocabTopicSummary } from "@/lib/vocabularyTopics";

type HomeData = {
  cefrLevel: string;
  streak: number;
  dueCount: number;
  todaysWords: VocabularyWord[];
  levelProgress: { level: string; learned: number; total: number; percent: number }[];
};

export default function VocabularyPage() {
  const { status } = useSession();
  const router = useRouter();
  const { isPathway, base } = usePathwayStudentContext();
  const { cefrLevel, setCefrLevel, ready } = useVocabularyCefr();
  const [data, setData] = useState<HomeData | null>(null);
  const [topics, setTopics] = useState<VocabTopicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/vocabulary/home?cefrLevel=${encodeURIComponent(cefrLevel)}`
      );
      if (!res.ok) throw new Error("Failed to load");
      const json = (await res.json()) as HomeData;
      setData(json);
    } catch {
      setData({
        cefrLevel,
        streak: 0,
        dueCount: 0,
        todaysWords: [],
        levelProgress: SPEAKIFY_CEFR_LEVELS.map((level) => ({
          level,
          learned: 0,
          total: 0,
          percent: 0,
        })),
      });
    } finally {
      setLoading(false);
    }
  }, [cefrLevel]);

  useEffect(() => {
    if (status !== "authenticated" || !ready) return;
    (async () => {
      setTopicsLoading(true);
      try {
        const res = await fetch(
          `/api/vocabulary/topics?cefrLevel=${encodeURIComponent(cefrLevel)}`
        );
        const json = await res.json();
        setTopics(json.topics ?? []);
      } catch {
        setTopics([]);
      } finally {
        setTopicsLoading(false);
      }
    })();
  }, [status, ready, cefrLevel]);

  useEffect(() => {
    if (status !== "authenticated" || !ready) return;
    loadHome();
  }, [status, ready, loadHome]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  const currentLevel = data?.cefrLevel ?? cefrLevel;
  const currentProgress =
    data?.levelProgress.find((p) => p.level === currentLevel) ?? {
      percent: 0,
      learned: 0,
      total: 0,
    };

  return (
    <div className="flex min-h-screen">
      <StudentSidebar activePage="vocabulary" />
      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50 px-8 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0d1b35]">Vocabulary</h1>
              <p className="mt-1 text-sm text-slate-600">
                {isPathway
                  ? "Grow your English vocabulary at your CEFR level"
                  : "Build your IELTS word bank with daily practice"}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Study streak
                </p>
                <p className="text-2xl font-bold text-[#c9972c]">
                  {data?.streak ?? 0}{" "}
                  <span className="text-sm font-medium text-slate-600">days</span>
                </p>
              </div>
              <span className="text-3xl" aria-hidden>
                🔥
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Your CEFR level
                </p>
                <p className="mt-1 text-xl font-bold text-[#0d1b35]">{currentLevel}</p>
              </div>
              <label className="text-sm text-slate-600">
                <span className="mr-2 font-medium">Change level</span>
                <select
                  value={cefrLevel}
                  onChange={(e) => setCefrLevel(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0d1b35] focus:border-[#c9972c] focus:outline-none focus:ring-1 focus:ring-[#c9972c]"
                >
                  {SPEAKIFY_CEFR_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  {currentLevel} progress — {currentProgress.learned} /{" "}
                  {currentProgress.total} words studied
                </span>
                <span className="font-semibold text-[#0d9488]">
                  {currentProgress.percent}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#c9972c] transition-all"
                  style={{ width: `${currentProgress.percent}%` }}
                />
              </div>
            </div>
          </div>

          {(data?.dueCount ?? 0) > 0 ? (
            <Link
              href="/dashboard/student/vocabulary/review"
              className="mt-4 flex items-center justify-between rounded-xl border border-[#0d9488]/40 bg-[#0d9488]/10 px-5 py-4 transition-colors hover:bg-[#0d9488]/15"
            >
              <span className="text-sm font-semibold text-[#0d1b35]">
                Words due for review
              </span>
              <span className="rounded-full bg-[#0d9488] px-3 py-1 text-sm font-bold text-white">
                {data?.dueCount}
              </span>
            </Link>
          ) : null}

          <div className="mt-8">
            <h2 className="text-lg font-bold text-[#0d1b35]">Today&apos;s new words</h2>
            <p className="mt-1 text-sm text-slate-600">
              {loading
                ? "Loading…"
                : `${data?.todaysWords.length ?? 0} words at ${currentLevel}`}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(data?.todaysWords ?? []).map((w) => (
                <Link
                  key={w.id}
                  href="/dashboard/student/vocabulary/study"
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:border-[#c9972c]/50 hover:shadow-md"
                >
                  <p className="text-lg font-bold text-[#0d1b35]">{w.word}</p>
                  {w.pronunciation_ipa ? (
                    <p className="text-xs text-slate-500">{w.pronunciation_ipa}</p>
                  ) : null}
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{w.definition}</p>
                </Link>
              ))}
              {!loading && (data?.todaysWords.length ?? 0) === 0 ? (
                <p className="col-span-full text-sm text-slate-500">
                  No words yet for this level. Start a study session below.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-bold text-[#0d1b35]">Browse by Topic</h2>
            <p className="mt-1 text-sm text-slate-600">
              {topicsLoading
                ? "Loading topics…"
                : `IELTS vocabulary at ${currentLevel} grouped by theme`}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <div
                  key={topic.key}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-[#0d1b35]">{topic.label}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {topic.wordCount} word{topic.wordCount === 1 ? "" : "s"} at {currentLevel}
                  </p>
                  <Link
                    href={`/dashboard/student/vocabulary/study?topic=${encodeURIComponent(topic.key)}`}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#0d1b35] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#152a4d]"
                  >
                    Study this topic
                  </Link>
                </div>
              ))}
              {!topicsLoading && topics.length === 0 ? (
                <p className="col-span-full text-sm text-slate-500">
                  No topic categories found for this level yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/student/vocabulary/study"
              className="flex flex-col rounded-xl bg-[#0d1b35] p-6 text-white shadow-md transition-colors hover:bg-[#152a4d]"
            >
              <span className="text-2xl" aria-hidden>
                📚
              </span>
              <h3 className="mt-3 text-xl font-bold">Study Words</h3>
              <p className="mt-2 flex-1 text-sm text-slate-300">
                Flashcards with spaced repetition at your level
              </p>
              <span className="mt-4 text-sm font-semibold text-[#c9972c]">
                Start session →
              </span>
            </Link>
            {!isPathway ? (
            <Link
              href="/dashboard/student/vocabulary/phrases"
              className="flex flex-col rounded-xl border-2 border-[#c9972c] bg-white p-6 shadow-sm transition-colors hover:bg-[#c9972c]/5"
            >
              <span className="text-2xl" aria-hidden>
                ✍️
              </span>
              <h3 className="mt-3 text-xl font-bold text-[#0d1b35]">IELTS Phrases</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">
                High-band linking phrases for Writing &amp; Speaking
              </p>
              <span className="mt-4 text-sm font-semibold text-[#c9972c]">
                Browse phrases →
              </span>
            </Link>
            ) : (
            <Link
              href={`${base}/vocabulary/study`}
              className="flex flex-col rounded-xl border-2 border-[#0d9488] bg-white p-6 shadow-sm transition-colors hover:bg-[#0d9488]/5"
            >
              <span className="text-2xl" aria-hidden>
                ✍️
              </span>
              <h3 className="mt-3 text-xl font-bold text-[#0d1b35]">Useful Phrases</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">
                Everyday English phrases for speaking and writing
              </p>
              <span className="mt-4 text-sm font-semibold text-[#0d9488]">
                Browse phrases →
              </span>
            </Link>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/student/vocabulary/quiz"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0d1b35] shadow-sm hover:border-[#0d9488]"
            >
              Quiz mode
            </Link>
            <Link
              href="/dashboard/student/vocabulary/review"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0d1b35] shadow-sm hover:border-[#0d9488]"
            >
              Review due words
            </Link>
          </div>

          <div className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Progress by CEFR level
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Speakify official levels A1.1 → C2.2
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(data?.levelProgress ?? SPEAKIFY_CEFR_LEVELS.map((level) => ({
                level,
                learned: 0,
                total: 0,
                percent: 0,
              }))).map((row) => (
                <div
                  key={row.level}
                  className={`rounded-lg border px-3 py-2 ${
                    row.level === currentLevel
                      ? "border-[#c9972c] bg-[#c9972c]/5"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#0d1b35]">{row.level}</span>
                    <span className="text-slate-500">{row.percent}%</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                    {VOCAB_LEVEL_BANKS[row.level as keyof typeof VOCAB_LEVEL_BANKS]}
                  </p>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#0d9488]"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
