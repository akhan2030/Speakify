"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";

type Question = {
  id: string;
  exerciseId: string;
  category: string;
  categoryName: string;
  type: string;
  prompt: string;
  hint: string | null;
};

type ResultRow = {
  id: string;
  correct: boolean;
  modelAnswer: string;
  categoryName: string;
};

type SessionResult = {
  correct: number;
  total: number;
  scorePercent: number;
  results: ResultRow[];
  weakAreas: { name: string; count: number }[];
};

export default function GrammarPracticePage() {
  const router = useRouter();
  const { status } = useSession();
  const { base, usesProgramShell } = usePathwayStudentContext();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<{ id: string; answer: string }[]>([]);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    modelAnswer: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [finished, setFinished] = useState<SessionResult | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setFinished(null);
    setIndex(0);
    setAnswers([]);
    setAnswer("");
    setFeedback(null);
    try {
      const res = await fetch("/api/grammar/practice");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setQuestions(json.questions ?? []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadSession();
  }, [status, loadSession]);

  const current = questions[index];

  const checkCurrent = async () => {
    if (!current || !answer.trim()) return;
    setChecking(true);
    try {
      const res = await fetch("/api/grammar/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: current.category,
          exerciseId: current.exerciseId,
          answer: answer.trim(),
        }),
      });
      const json = await res.json();
      const isCorrect = Boolean(json.correct);
      setFeedback({
        correct: isCorrect,
        modelAnswer: json.suggestion ?? "",
      });
      const nextAnswers = [
        ...answers,
        { id: current.id, answer: answer.trim() },
      ];
      setAnswers(nextAnswers);

      if (index + 1 >= questions.length) {
        const scoreRes = await fetch("/api/grammar/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: nextAnswers }),
        });
        const scoreJson = await scoreRes.json();
        if (scoreRes.ok) setFinished(scoreJson);
      }
    } finally {
      setChecking(false);
    }
  };

  const goNext = () => {
    setFeedback(null);
    setAnswer("");
    setIndex((i) => i + 1);
  };

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="grammar" /> : null}
      <main
        className={`min-h-screen flex-1 bg-slate-50 px-8 py-8 ${usesProgramShell ? "" : "ml-[200px]"}`}
      >
        <div className="mx-auto max-w-2xl">
          <Link
            href={`${base}/grammar`}
            className="text-sm font-medium text-[#0d9488] hover:underline"
          >
            ← Grammar home
          </Link>

          <header className="mt-4">
            <h1 className="text-2xl font-bold text-[#0d1b35]">Grammar Practice</h1>
            <p className="mt-1 text-sm text-slate-600">
              Mixed questions from all categories — 10 per session
            </p>
          </header>

          {loading ? (
            <p className="mt-8 text-slate-500">Loading questions…</p>
          ) : finished ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#0d9488]">
                Session complete
              </p>
              <p className="mt-4 text-5xl font-bold text-[#c9972c]">
                {finished.scorePercent}%
              </p>
              <p className="mt-2 text-slate-600">
                {finished.correct} / {finished.total} correct
              </p>

              {finished.weakAreas.length > 0 ? (
                <div className="mt-8 rounded-xl bg-amber-50 px-5 py-4 text-left">
                  <p className="text-sm font-bold text-[#0d1b35]">
                    Areas to review
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {finished.weakAreas.map((w) => (
                      <li key={w.name}>
                        {w.name} — {w.count} mistake
                        {w.count === 1 ? "" : "s"}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-6 text-sm text-[#0d9488]">
                  Strong performance across all categories!
                </p>
              )}

              <button
                type="button"
                onClick={loadSession}
                className="mt-8 rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-bold text-white hover:bg-[#152a4d]"
              >
                Try another session
              </button>
            </div>
          ) : current ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                <span>
                  Question {index + 1} of {questions.length}
                </span>
                <span className="rounded-full bg-[#0d1b35]/10 px-2 py-0.5 text-xs font-semibold text-[#0d1b35]">
                  {current.categoryName}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#c9972c] transition-all"
                  style={{
                    width: `${((index + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-6 text-base font-medium text-[#0d1b35]">
                {current.prompt}
              </p>
              {current.hint ? (
                <p className="mt-2 text-xs text-slate-500">Hint: {current.hint}</p>
              ) : null}

              {!feedback ? (
                <>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={4}
                    className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#c9972c] focus:outline-none focus:ring-1 focus:ring-[#c9972c]"
                    disabled={checking}
                  />
                  <button
                    type="button"
                    onClick={checkCurrent}
                    disabled={checking || !answer.trim()}
                    className="mt-4 w-full rounded-xl bg-[#c9972c] py-3 font-bold text-[#0d1b35] disabled:opacity-50"
                  >
                    {checking ? "Checking…" : "Check answer"}
                  </button>
                </>
              ) : (
                <div
                  className={`mt-4 rounded-xl px-4 py-4 ${
                    feedback.correct
                      ? "bg-[#0d9488]/10 text-[#0d9488]"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  <p className="font-bold">
                    {feedback.correct ? "Correct!" : "Not quite"}
                  </p>
                  {!feedback.correct && feedback.modelAnswer ? (
                    <p className="mt-2 text-sm">
                      Model answer: <strong>{feedback.modelAnswer}</strong>
                    </p>
                  ) : null}
                  {index + 1 < questions.length ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="mt-4 w-full rounded-xl bg-[#0d1b35] py-2.5 text-sm font-bold text-white"
                    >
                      Next question →
                    </button>
                  ) : (
                    <p className="mt-3 text-sm">Calculating your score…</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-8 text-slate-500">No questions available.</p>
          )}
        </div>
      </main>
    </div>
  );
}
