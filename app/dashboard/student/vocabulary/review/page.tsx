"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import VocabularyFlashcard from "@/components/vocabulary/VocabularyFlashcard";
import { useVocabularyCefr } from "@/components/vocabulary/useVocabularyCefr";
import type { VocabRating, VocabularyWord } from "@/lib/vocabulary";

function daysUntil(dateKey: string | null) {
  if (!dateKey) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateKey}T12:00:00`);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default function VocabularyReviewPage() {
  const { status } = useSession();
  const router = useRouter();
  const { cefrLevel, ready } = useVocabularyCefr();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [nextReviewDate, setNextReviewDate] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const loadReview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vocabulary/words?mode=review&limit=20");
      const json = await res.json();
      setWords(json.words ?? []);
      setNextReviewDate(json.nextReviewDate ?? null);
      setIndex(0);
      setDone(Boolean(json.reviewComplete) || (json.words ?? []).length === 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !ready) return;
    loadReview();
  }, [status, ready, loadReview]);

  const handleRate = async (rating: VocabRating) => {
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
    if (index + 1 >= words.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  const days = daysUntil(nextReviewDate);

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
          <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">Review</h1>
          <p className="mt-1 text-sm text-slate-600">Spaced repetition — words due today</p>

          {loading ? (
            <p className="mt-12 text-center text-slate-500">Loading review queue…</p>
          ) : done ? (
            <div className="mt-12 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/10 p-8 text-center">
              <p className="text-xl font-bold text-[#0d1b35]">All caught up!</p>
              <p className="mt-3 text-sm text-slate-700">
                {days !== null && nextReviewDate
                  ? `Next review in ${days} day${days === 1 ? "" : "s"} (${nextReviewDate})`
                  : "No upcoming reviews scheduled yet. Study new words to build your queue."}
              </p>
              <Link
                href="/dashboard/student/vocabulary/study"
                className="mt-6 inline-block rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-bold text-white"
              >
                Study new words
              </Link>
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
