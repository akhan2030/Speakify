"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import {
  getCategoryMeta,
  isGrammarCategorySlug,
  type GrammarExercise,
} from "@/lib/grammar";
import { getLessonContent } from "@/lib/grammarContent";

function ExerciseBlock({
  exercise,
  category,
  onComplete,
}: {
  exercise: GrammarExercise;
  category: string;
  onComplete: (id: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    feedback: string;
    suggestion?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const typeLabel =
    exercise.type === "fill"
      ? "Fill in the blank"
      : exercise.type === "correct"
        ? "Correct the error"
        : "Rewrite the sentence";

  const check = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/grammar/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          exerciseId: exercise.id,
          answer: answer.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setFeedback(json);
      if (json.correct) onComplete(exercise.id);
    } catch (err) {
      setFeedback({
        correct: false,
        feedback:
          err instanceof Error ? err.message : "Could not get feedback.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
        {typeLabel}
      </p>
      <p className="mt-2 text-sm font-medium text-[#0d1b35]">{exercise.prompt}</p>
      {exercise.hint ? (
        <p className="mt-1 text-xs text-slate-500">Hint: {exercise.hint}</p>
      ) : null}
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={3}
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0d1b35] focus:border-[#c9972c] focus:outline-none focus:ring-1 focus:ring-[#c9972c]"
        placeholder="Type your answer…"
        disabled={loading}
      />
      <button
        type="button"
        onClick={check}
        disabled={loading || !answer.trim()}
        className="mt-3 rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35] hover:opacity-95 disabled:opacity-50"
      >
        {loading ? "Checking…" : "Get AI Feedback"}
      </button>
      {feedback ? (
        <div
          className={`mt-3 rounded-lg px-4 py-3 text-sm ${
            feedback.correct
              ? "bg-[#0d9488]/10 text-[#0d9488]"
              : "bg-red-50 text-red-800"
          }`}
        >
          <p className="font-semibold">
            {feedback.correct ? "Correct!" : "Keep practising"}
          </p>
          <p className="mt-1">{feedback.feedback}</p>
          {!feedback.correct && feedback.suggestion ? (
            <p className="mt-2 text-xs">
              Suggested: <strong>{feedback.suggestion}</strong>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function GrammarLessonPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const category = String(params?.category ?? "");

  const meta = isGrammarCategorySlug(category) ? getCategoryMeta(category) : null;
  const lesson = isGrammarCategorySlug(category)
    ? getLessonContent(category)
    : null;

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (!isGrammarCategorySlug(category)) return;
    setCompleted(new Set());
  }, [category]);

  const allDone = useMemo(
    () => lesson && completed.size >= lesson.exercises.length,
    [lesson, completed]
  );

  const markExercise = useCallback((id: string) => {
    setCompleted((prev) => new Set(prev).add(id));
  }, []);

  const saveProgress = useCallback(async () => {
    if (!meta) return;
    setSaving(true);
    try {
      await fetch("/api/grammar/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          exercisesCompleted: completed.size,
          lessonsCompleted: allDone ? meta.lessonCount : Math.min(
            meta.lessonCount,
            Math.ceil((completed.size / lesson!.exercises.length) * meta.lessonCount)
          ),
          markComplete: allDone,
        }),
      });
    } finally {
      setSaving(false);
    }
  }, [allDone, category, completed.size, meta, lesson]);

  useEffect(() => {
    if (completed.size === 0) return;
    saveProgress();
  }, [completed.size, allDone, saveProgress]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  if (!meta || !lesson) {
    return (
      <div className="flex min-h-screen">
        <StudentSidebar activePage="grammar" />
        <main className="ml-[200px] flex-1 p-8">
          <p className="text-red-600">Category not found.</p>
          <Link href="/dashboard/student/grammar" className="text-[#0d9488]">
            ← Back
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="grammar" />
      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50 px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard/student/grammar"
            className="text-sm font-medium text-[#0d9488] hover:underline"
          >
            ← Grammar home
          </Link>

          <header className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
              {meta.difficulty}
            </p>
            <h1 className="text-2xl font-bold text-[#0d1b35]">{meta.name}</h1>
            <p className="mt-1 text-sm text-slate-600">{meta.subtitle}</p>
          </header>

          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0d1b35]">Grammar rules</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {lesson.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#0d1b35]">IELTS Writing</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {lesson.ieltsWritingExamples.map((ex) => (
                  <li key={ex} className="italic">
                    &ldquo;{ex}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#0d1b35]">IELTS Speaking</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {lesson.ieltsSpeakingExamples.map((ex) => (
                  <li key={ex} className="italic">
                    &ldquo;{ex}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="font-bold text-[#0d1b35]">
              Common mistakes (Saudi learners)
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {lesson.saudiMistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-[#0d1b35]">
                Practice exercises
              </h2>
              <span className="text-sm text-slate-500">
                {completed.size}/{lesson.exercises.length} done
              </span>
            </div>
            <div className="mt-4 space-y-4">
              {lesson.exercises.map((ex) => (
                <ExerciseBlock
                  key={ex.id}
                  exercise={ex}
                  category={category}
                  onComplete={markExercise}
                />
              ))}
            </div>
          </section>

          {allDone ? (
            <div className="mt-8 rounded-xl border border-[#0d9488]/40 bg-[#0d9488]/10 p-5 text-center">
              <p className="font-semibold text-[#0d9488]">
                Category practice complete!
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {saving ? "Saving progress…" : "Progress saved."}
              </p>
              <Link
                href="/dashboard/student/grammar"
                className="mt-4 inline-block rounded-xl bg-[#0d1b35] px-6 py-2.5 text-sm font-bold text-white"
              >
                Back to categories
              </Link>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
