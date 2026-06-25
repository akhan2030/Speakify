"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { useVocabularyCefr } from "@/components/vocabulary/useVocabularyCefr";
import type { VocabularyWord } from "@/lib/vocabulary";

type QuizType = "pick-definition" | "type-word" | "fill-blank" | "match-meaning";

type QuizQuestion = {
  type: QuizType;
  word: VocabularyWord;
  prompt: string;
  options: string[];
  correctIndex: number;
  blankAnswer?: string;
};

const QUIZ_TYPES: QuizType[] = [
  "pick-definition",
  "type-word",
  "fill-blank",
  "match-meaning",
];

const CHOICE_LABELS = ["a", "b", "c", "d"];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestions(pool: VocabularyWord[]): QuizQuestion[] {
  const selected = shuffle(pool).slice(0, Math.min(10, pool.length));
  return selected.map((word, i) => {
    const type = QUIZ_TYPES[i % QUIZ_TYPES.length];
    const distractors = shuffle(
      pool.filter((w) => w.id !== word.id).map((w) => w.definition)
    ).slice(0, 3);
    const options = shuffle([word.definition, ...distractors]).slice(0, 4);
    const correctIndex = options.indexOf(word.definition);

    if (type === "pick-definition") {
      return {
        type,
        word,
        prompt: `What is the meaning of "${word.word}"?`,
        options,
        correctIndex,
      };
    }

    if (type === "type-word") {
      return {
        type,
        word,
        prompt: `Type the English word for this definition:\n${word.definition}`,
        options: [],
        correctIndex: 0,
        blankAnswer: word.word.toLowerCase(),
      };
    }

    if (type === "fill-blank") {
      const sentence = word.example_sentence.replace(
        new RegExp(word.word, "gi"),
        "______"
      );
      const options = shuffle([
        word.word,
        ...pool.filter((w) => w.id !== word.id).map((w) => w.word).slice(0, 3),
      ]).slice(0, 4);
      return {
        type,
        word,
        prompt: `Fill in the blank:\n${sentence}`,
        options,
        correctIndex: options.findIndex(
          (o) => o.toLowerCase() === word.word.toLowerCase()
        ),
      };
    }

    return {
      type: "match-meaning",
      word,
      prompt: `Which definition matches "${word.word}"?`,
      options,
      correctIndex,
    };
  });
}

export default function VocabularyQuizPage() {
  const { status } = useSession();
  const router = useRouter();
  const { cefrLevel, ready } = useVocabularyCefr();
  const [pool, setPool] = useState<VocabularyWord[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState(0);
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !ready) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/vocabulary/words?cefrLevel=${encodeURIComponent(cefrLevel)}&mode=study&limit=20`
        );
        const json = await res.json();
        const words = json.words ?? [];
        setPool(words);
        setQuestions(buildQuestions(words));
        setQIndex(0);
        setScore(0);
        setWrongIds(new Set());
        setFinished(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, ready, cefrLevel]);

  const current = questions[qIndex];

  const checkAnswer = (correct: boolean) => {
    if (!current) return;
    if (correct) setScore((s) => s + 1);
    else setWrongIds((prev) => new Set(prev).add(current.word.id));
  };

  const submitChoice = (optionIndex: number) => {
    if (!current || selected !== null) return;
    setSelected(optionIndex);
    const correct =
      current.type === "fill-blank"
        ? current.options[optionIndex]?.toLowerCase() === current.word.word.toLowerCase()
        : optionIndex === current.correctIndex;
    checkAnswer(correct);
  };

  const submitTyped = () => {
    if (!current || selected !== null) return;
    setSelected(0);
    const correct = typed.trim().toLowerCase() === current.blankAnswer;
    checkAnswer(correct);
  };

  const next = () => {
    if (qIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setQIndex((i) => i + 1);
      setSelected(null);
      setTyped("");
    }
  };

  const weakWords = useMemo(
    () => pool.filter((w) => wrongIds.has(w.id)),
    [pool, wrongIds]
  );

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
          <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">Quiz</h1>
          <p className="mt-1 text-sm text-slate-600">Level {cefrLevel}</p>

          {loading ? (
            <p className="mt-12 text-center text-slate-500">Preparing quiz…</p>
          ) : questions.length === 0 ? (
            <p className="mt-12 text-center text-slate-500">
              Not enough words at this level. Try another level.
            </p>
          ) : finished ? (
            <div className="mt-10 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#0d1b35]">Quiz complete</h2>
              <p className="mt-2 text-3xl font-bold text-[#c9972c]">
                {score} / {questions.length}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {Math.round((score / questions.length) * 100)}% correct
              </p>
              {weakWords.length > 0 ? (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-red-600">Words to review:</p>
                  <ul className="mt-2 space-y-2">
                    {weakWords.map((w) => (
                      <li
                        key={w.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
                      >
                        <span className="font-bold">{w.word}</span> — {w.definition}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#0d9488]">Perfect score — excellent!</p>
              )}
              <Link
                href="/dashboard/student/vocabulary/study"
                className="mt-6 inline-block rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-bold text-white"
              >
                Study again
              </Link>
            </div>
          ) : current ? (
            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Question {qIndex + 1} of {questions.length}
              </p>
              <p className="mt-4 whitespace-pre-line text-base font-medium text-[#0d1b35]">
                {current.prompt}
              </p>

              {current.type === "type-word" ? (
                <div className="mt-6">
                  <input
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    disabled={selected !== null}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-[#0d1b35] focus:border-[#0d9488] focus:outline-none"
                    placeholder="Type the word…"
                    onKeyDown={(e) => e.key === "Enter" && submitTyped()}
                  />
                  <button
                    type="button"
                    onClick={submitTyped}
                    disabled={selected !== null || !typed.trim()}
                    className="mt-3 w-full rounded-xl bg-[#0d9488] py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Check
                  </button>
                </div>
              ) : (
                <div className="mt-6 grid gap-2">
                  {current.options.map((opt, i) => {
                    let style = "border-slate-200 hover:border-[#0d9488]";
                    if (selected !== null) {
                      const isCorrect =
                        current.type === "fill-blank"
                          ? opt.toLowerCase() === current.word.word.toLowerCase()
                          : i === current.correctIndex;
                      if (isCorrect) style = "border-green-500 bg-green-50";
                      else if (i === selected) style = "border-red-500 bg-red-50";
                      else style = "border-slate-200 opacity-60";
                    }
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={selected !== null}
                        onClick={() => submitChoice(i)}
                        className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm text-[#0d1b35] transition-colors ${style}`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#c9972c] text-sm font-bold lowercase text-[#0d1b35]">
                          {CHOICE_LABELS[i] ?? String.fromCharCode(97 + i)}
                        </span>
                        <span className="pt-0.5">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selected !== null ? (
                <button
                  type="button"
                  onClick={next}
                  className="mt-6 w-full rounded-xl bg-[#0d1b35] py-3 text-sm font-bold text-white"
                >
                  {qIndex + 1 >= questions.length ? "See results" : "Next question"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
