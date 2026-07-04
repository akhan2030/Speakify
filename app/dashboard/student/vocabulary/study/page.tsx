"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import VocabularyFlashcard from "@/components/vocabulary/VocabularyFlashcard";
import { useVocabularyCefr } from "@/components/vocabulary/useVocabularyCefr";
import { formatVocabTopicLabel } from "@/lib/vocabularyTopics";
import {
  normalizeSpeakifyCefrLevel,
  type VocabRating,
  type VocabularyWord,
} from "@/lib/vocabulary";

function readParam(searchParams: URLSearchParams, key: string): string | null {
  const fromHook = searchParams.get(key);
  if (fromHook) return fromHook;
  // Fallback: App Router soft-nav can drop useSearchParams briefly; window is authoritative.
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get(key);
  }
  return null;
}

function VocabularyStudyContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topic = readParam(searchParams, "topic");
  const cefrFromUrl = readParam(searchParams, "cefrLevel");
  const { base, usesProgramShell } = usePathwayStudentContext();
  const { cefrLevel: storedCefr, ready } = useVocabularyCefr();
  const cefrLevel = cefrFromUrl
    ? normalizeSpeakifyCefrLevel(cefrFromUrl)
    : storedCefr;
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !ready) return;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const params = new URLSearchParams({
          cefrLevel,
          mode: "study",
          limit: "10",
        });
        if (topic) params.set("topic", topic);
        const res = await fetch(`/api/vocabulary/words?${params.toString()}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setLoadError(json.error || "Could not load words for this topic.");
          setWords([]);
          return;
        }
        setWords(json.words ?? []);
        setIndex(0);
        setDone(false);
      } catch {
        setLoadError("Could not load words for this topic.");
        setWords([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, ready, cefrLevel, topic]);

  const saveRating = useCallback(
    async (rating: VocabRating) => {
      const word = words[index];
      if (!word) return;
      setSaving(true);
      try {
        await fetch("/api/vocabulary/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wordId: word.id,
            rating,
            cefrLevel: word.cefr_level || cefrLevel,
          }),
        });
      } finally {
        setSaving(false);
      }
    },
    [words, index, cefrLevel]
  );

  const handleRate = async (rating: VocabRating) => {
    await saveRating(rating);
    if (index + 1 >= words.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-screen">
      {!usesProgramShell ? <StudentSidebar activePage="vocabulary" /> : null}
      <main
        className={`min-h-screen flex-1 bg-slate-50 px-8 py-8 ${usesProgramShell ? "" : "ml-[200px]"}`}
      >
        <div className="mx-auto max-w-xl">
          <a
            href={`${base}/vocabulary`}
            className="text-sm font-medium text-[#0d9488] hover:underline"
          >
            ← Back to Vocabulary
          </a>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
            Topic study session
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0d1b35]">
            {topic ? formatVocabTopicLabel(topic) : "Study Words"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Level {cefrLevel}
            {topic ? ` · filtered to “${formatVocabTopicLabel(topic)}”` : ""} · 10-word session
          </p>

          {loading ? (
            <p className="mt-12 text-center text-slate-500">Loading flashcards…</p>
          ) : done || words.length === 0 ? (
            <div className="mt-12 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-bold text-[#0d1b35]">
                {words.length === 0 ? "No words found" : "Session complete!"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {loadError
                  ? loadError
                  : words.length === 0
                    ? topic
                      ? `No words for “${formatVocabTopicLabel(topic)}” at ${cefrLevel} yet. Try another topic or level.`
                      : "Try another CEFR level on the home page."
                    : "Great work — your progress has been saved."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href={`${base}/vocabulary/quiz`}
                  className="rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Take a quiz
                </a>
                <a
                  href={`${base}/vocabulary`}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#0d1b35]"
                >
                  Back to topics
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <VocabularyFlashcard
                word={words[index]}
                index={index}
                total={words.length}
                onRate={handleRate}
                saving={saving}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function VocabularyStudyPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <VocabularyStudyContent />
    </Suspense>
  );
}
