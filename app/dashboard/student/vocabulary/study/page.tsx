"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import VocabularyFlashcard from "@/components/vocabulary/VocabularyFlashcard";
import { useVocabularyCefr } from "@/components/vocabulary/useVocabularyCefr";
import type { VocabRating, VocabularyWord } from "@/lib/vocabulary";

export default function VocabularyStudyPage() {
  const { status } = useSession();
  const router = useRouter();
  const { cefrLevel, ready } = useVocabularyCefr();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !ready) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/vocabulary/words?cefrLevel=${encodeURIComponent(cefrLevel)}&mode=study&limit=10`
        );
        const json = await res.json();
        setWords(json.words ?? []);
        setIndex(0);
        setDone(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, ready, cefrLevel]);

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
      <StudentSidebar activePage="vocabulary" />
      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50 px-8 py-8">
        <div className="mx-auto max-w-xl">
          <Link
            href="/dashboard/student/vocabulary"
            className="text-sm font-medium text-[#0d9488] hover:underline"
          >
            ← Back to Vocabulary
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">Study Words</h1>
          <p className="mt-1 text-sm text-slate-600">Level {cefrLevel} · 10-word session</p>

          {loading ? (
            <p className="mt-12 text-center text-slate-500">Loading flashcards…</p>
          ) : done || words.length === 0 ? (
            <div className="mt-12 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-bold text-[#0d1b35]">
                {words.length === 0 ? "No words found" : "Session complete!"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {words.length === 0
                  ? "Try another CEFR level on the home page."
                  : "Great work — your progress has been saved."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/dashboard/student/vocabulary/quiz"
                  className="rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Take a quiz
                </Link>
                <Link
                  href="/dashboard/student/vocabulary"
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#0d1b35]"
                >
                  Home
                </Link>
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
