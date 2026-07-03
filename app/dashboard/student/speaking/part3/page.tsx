"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AudioRecorder from "@/components/AudioRecorder";
import { type SpeakingEvaluationData } from "@/components/SpeakingEvaluationCard";
import DailyLimitReached from "@/components/DailyLimitReached";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import { fetchPart3Questions } from "@/lib/speaking/fetchPart3Questions";
import { normalizeLegacyCueCard } from "@/lib/speaking/part3Generation";
import { getRandomCueCard } from "@/lib/speakingQuestions";

type PageState =
  | "intro"
  | "question-active"
  | "evaluating"
  | "question-result"
  | "complete";

type CueCard = {
  id: number;
  topic: string;
  prompt: string;
  bullets: string[];
  part3Questions: string[];
};

type QuestionResult = SpeakingEvaluationData & {
  question: string;
  transcript: string;
  duration: number;
};

const COMMON_WORDS = new Set([
  "about",
  "after",
  "again",
  "against",
  "because",
  "before",
  "being",
  "between",
  "could",
  "during",
  "every",
  "first",
  "found",
  "great",
  "having",
  "however",
  "important",
  "little",
  "might",
  "never",
  "other",
  "people",
  "really",
  "should",
  "something",
  "still",
  "their",
  "there",
  "these",
  "think",
  "those",
  "through",
  "under",
  "until",
  "using",
  "which",
  "while",
  "world",
  "would",
  "years",
  "young",
  "always",
  "another",
  "around",
  "become",
  "believe",
  "better",
  "children",
  "country",
  "different",
  "education",
  "example",
  "family",
  "friends",
  "government",
  "health",
  "however",
  "important",
  "interest",
  "learning",
  "making",
  "maybe",
  "moment",
  "myself",
  "nothing",
  "number",
  "often",
  "parents",
  "perhaps",
  "person",
  "place",
  "point",
  "problem",
  "public",
  "question",
  "rather",
  "reason",
  "school",
  "second",
  "several",
  "society",
  "sometimes",
  "student",
  "study",
  "system",
  "taking",
  "technology",
  "things",
  "think",
  "though",
  "three",
  "today",
  "together",
  "understand",
  "university",
  "usually",
  "various",
  "video",
  "water",
  "where",
  "whether",
  "without",
  "working",
  "writing",
]);

function formatBand(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function average(nums: (number | null | undefined)[]) {
  const valid = nums.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 2) / 2;
}

function skillLevel(band: number | null): "strong" | "developing" | "needs work" {
  if (band === null || !Number.isFinite(band)) return "developing";
  if (band >= 7) return "strong";
  if (band >= 5) return "developing";
  return "needs work";
}

function skillLevelLabel(level: ReturnType<typeof skillLevel>) {
  if (level === "strong") return "Strong";
  if (level === "developing") return "Developing";
  return "Needs work";
}

function skillLevelClass(level: ReturnType<typeof skillLevel>) {
  if (level === "strong") return "text-green-600";
  if (level === "developing") return "text-amber-600";
  return "text-red-500";
}

function truncate(text: string, max = 48) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function extractVocabularyHighlights(transcripts: string[]): string[] {
  const wordCounts = new Map<string, number>();
  for (const text of transcripts) {
    const words = text.toLowerCase().match(/\b[a-z]{6,}\b/g) ?? [];
    for (const w of words) {
      if (COMMON_WORDS.has(w)) continue;
      wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
    }
  }
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 8)
    .map(([w]) => w);
}

function extractCommonErrors(results: QuestionResult[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const r of results) {
    for (const imp of r.feedback?.improvements ?? []) {
      const key = imp.title?.trim();
      if (key && !seen.has(key.toLowerCase())) {
        seen.add(key.toLowerCase());
        errors.push(key);
      }
    }
    const grammar = r.feedback?.grammar?.trim();
    if (grammar && grammar.length > 20 && errors.length < 3) {
      const snippet = grammar.split(/[.!?]/)[0]?.trim();
      if (snippet && !seen.has(snippet.toLowerCase())) {
        seen.add(snippet.toLowerCase());
        errors.push(snippet.length > 80 ? `${snippet.slice(0, 77)}…` : snippet);
      }
    }
    if (errors.length >= 3) break;
  }

  return errors.slice(0, 3);
}

function HelpCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21 2.18.57 3 1.79 3 3.79" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

export default function SpeakingPart3Page() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isPathway, base, usesProgramShell } = usePathwayStudentContext();
  const studentId = (session?.user as { id?: string })?.id ?? "";

  const [state, setState] = useState<PageState>("intro");
  const [cueCard, setCueCard] = useState<CueCard | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [limitLoading, setLimitLoading] = useState(true);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  const transcriptRef = useRef("");
  const recorderKeyRef = useRef(0);

  const loadSession = useCallback(async () => {
    const card = getRandomCueCard() as CueCard;
    setCueCard(card);
    setQuestions([]);
    setQuestionsLoading(true);

    try {
      const normalized = normalizeLegacyCueCard(card);
      if (!normalized) throw new Error("Cue card data missing");
      const qs = await fetchPart3Questions({
        cueCard: normalized,
        part2Transcript: "",
        testType: isPathway ? "pathways" : "ielts_academic",
      });
      setQuestions(qs.slice(0, 4));
      return { card, qs };
    } catch (err) {
      console.error(err);
      setEvalError(
        err instanceof Error ? err.message : "Could not prepare Part 3 questions"
      );
      return { card, qs: [] as string[] };
    } finally {
      setQuestionsLoading(false);
    }
  }, [isPathway]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !studentId) return;

    let cancelled = false;

    async function checkLimit() {
      setLimitLoading(true);
      try {
        const res = await fetch(
          `/api/speaking/daily-limit?studentId=${encodeURIComponent(studentId)}`
        );
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok && data) {
          const blocked = !data.unlimited && data.part3 && !data.part3.canTake;
          setLimitBlocked(blocked);
        }
      } finally {
        if (!cancelled) setLimitLoading(false);
      }
    }

    checkLimit();
    return () => {
      cancelled = true;
    };
  }, [status, studentId]);

  const handleSubmitAnswer = useCallback(
    async (answerTranscript: string, duration: number) => {
      if (!studentId || questions.length === 0) return;

      setState("evaluating");
      setEvalError(null);

      const questionText = questions[currentIndex];
      const totalQuestions = questions.length;

      try {
        const res = await fetch("/api/speaking/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: answerTranscript,
            questionText,
            part: 3,
            taskType: "part3-discussion",
            studentId,
            expectedDuration: 60,
            duration,
            topic: cueCard?.topic ?? "",
            isFirstQuestion: currentIndex === 0,
            questionNumber: currentIndex + 1,
            totalQuestions,
          }),
        });

        const result = await res.json().catch(() => null);

        if (!res.ok || !result?.success) {
          throw new Error(result?.error ?? "Evaluation failed");
        }

        setResults((prev) => [
          ...prev,
          {
            question: questionText,
            transcript: answerTranscript,
            duration,
            bandFC: result.bandFC,
            bandLR: result.bandLR,
            bandGRA: result.bandGRA,
            bandP: result.bandP,
            bandOverall: result.bandOverall,
            feedback: result.feedback,
          },
        ]);

        setState("question-result");
      } catch (err) {
        setEvalError(err instanceof Error ? err.message : "Evaluation failed");
        setState("question-active");
      }
    },
    [studentId, questions, currentIndex, cueCard]
  );

  const goNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      transcriptRef.current = "";
      recorderKeyRef.current += 1;
      setState("question-active");
    } else {
      setState("complete");
    }
  }, [currentIndex, questions.length]);

  const resetPart = useCallback(() => {
    loadSession();
    setCurrentIndex(0);
    setResults([]);
    transcriptRef.current = "";
    recorderKeyRef.current += 1;
    setEvalError(null);
    setState("intro");
  }, [loadSession]);

  if (status === "loading" || status === "unauthenticated" || limitLoading) {
    return <PageSpinner />;
  }

  if (limitBlocked) {
    return <DailyLimitReached variant="part3" />;
  }

  if (!cueCard || questions.length === 0) {
    return <PageSpinner />;
  }

  const currentResult = results[results.length - 1];
  const isLastQuestion = currentIndex >= questions.length - 1;
  const totalQ = questions.length;

  const partAverages = {
    fc: average(results.map((r) => r.bandFC)),
    lr: average(results.map((r) => r.bandLR)),
    gra: average(results.map((r) => r.bandGRA)),
    p: average(results.map((r) => r.bandP)),
    overall: average(results.map((r) => r.bandOverall)),
  };

  const vocabHighlights = extractVocabularyHighlights(results.map((r) => r.transcript));
  const commonErrors = extractCommonErrors(results);

  return (
    <div className="flex min-h-screen bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="speaking" /> : null}

      <main
        className={`min-h-screen flex-1 bg-slate-50 ${usesProgramShell ? "" : "ml-[200px]"}`}
      >
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            href={`${base}/speaking`}
            className="text-sm font-semibold text-[#0d1b35] hover:text-[#c9972c]"
          >
            ← Back to Speaking
          </Link>

          {state === "intro" && (
            <>
              <header className="mt-4">
                <h1 className="text-2xl font-bold text-[#0d1b35]">
                  Part 3 — Discussion
                </h1>
                <p className="mt-2 text-slate-500">
                  Discuss abstract ideas linked to your Part 2 topic
                </p>
              </header>

              <div className="mt-8 rounded-xl bg-[#f0f4f8] p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#c9972c]">
                  Today&apos;s discussion topic
                </p>
                <p className="mt-2 text-lg font-bold text-[#0d1b35]">{cueCard.topic}</p>
                <p className="mt-3 text-sm text-slate-500">
                  Your examiner will ask you {totalQ} abstract questions about this
                  topic area.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: HelpCircleIcon,
                    title: "4 Questions",
                    desc: "Each question is more abstract than Part 2",
                  },
                  {
                    icon: ClockIcon,
                    title: "40-80 seconds",
                    desc: "Recommended speaking time per answer",
                  },
                  {
                    icon: BrainIcon,
                    title: "Analytical thinking",
                    desc: "Show your ability to discuss ideas in depth",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
                  >
                    <item.icon className="mx-auto h-8 w-8 text-[#c9972c]" />
                    <p className="mt-3 text-sm font-bold text-[#0d1b35]">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl bg-[#c9972c]/15 p-5">
                <p className="font-bold text-[#0d1b35]">Part 3 Tips:</p>
                <ul className="mt-3 space-y-2 text-sm text-[#0d1b35]">
                  <li>✓ Give your opinion AND reasons</li>
                  <li>
                    ✓ Use phrases like: I believe, In my view, It could be argued that…
                  </li>
                  <li>✓ Give examples from real life or society</li>
                  <li>✓ Compare different perspectives</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setState("question-active")}
                disabled={questionsLoading || questions.length === 0}
                className="mt-8 w-full rounded-xl bg-[#c9972c] py-3.5 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {questionsLoading ? "Preparing linked Part 3 questions…" : "Begin Discussion"}
              </button>
            </>
          )}

          {state === "question-active" && (
            <>
              <div className="mt-4">
                <p className="text-sm font-semibold text-[#0d1b35]">
                  Part 3 — Question {currentIndex + 1} of {totalQ}
                </p>
                <div className="mt-3 flex gap-2">
                  {questions.map((_, i) => (
                    <span
                      key={i}
                      className={`h-2.5 flex-1 rounded-full ${
                        i < currentIndex
                          ? "bg-[#c9972c]"
                          : i === currentIndex
                            ? "animate-pulse bg-[#c9972c]"
                            : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <span className="mt-4 inline-block rounded-full bg-[#c9972c]/15 px-3 py-1 text-xs font-semibold text-[#0d1b35]">
                {cueCard.topic}
              </span>

              <div
                className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: "#0d9488" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0d9488]">
                  Examiner&apos;s Question
                </p>
                <p className="mt-3 text-xl font-bold text-[#0d1b35]">
                  {questions[currentIndex]}
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-[#0d9488]/10 p-4">
                <p className="text-xs font-bold text-[#0d9488]">You could start with:</p>
                <ul className="mt-2 space-y-1 text-sm italic text-slate-600">
                  <li>In my opinion, I think that…</li>
                  <li>There are several perspectives on this…</li>
                  <li>It&apos;s an interesting question because…</li>
                  <li>I believe that… because…</li>
                </ul>
              </div>

              {evalError ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {evalError}
                </p>
              ) : null}

              <div className="mt-6">
                <AudioRecorder
                  key={recorderKeyRef.current}
                  maxDuration={90}
                  minDuration={20}
                  autoSubmit
                  onTranscriptReady={(t) => {
                    transcriptRef.current = t;
                  }}
                  onRecordingComplete={(_blob, duration) => {
                    handleSubmitAnswer(transcriptRef.current, duration);
                  }}
                />
              </div>

              <p className="mt-4 text-center text-sm text-slate-500">
                Aim for 40-80 seconds per answer
                <br />
                Support your opinion with reasons and examples
              </p>
            </>
          )}

          {state === "evaluating" && (
            <div className="mt-20 flex flex-col items-center text-center">
              <span className="h-14 w-14 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
              <h2 className="mt-6 text-xl font-bold text-[#0d1b35]">
                Evaluating your response…
              </h2>
              <p className="mt-2 text-slate-500">
                Assessing analytical discussion skills
              </p>
            </div>
          )}

          {state === "question-result" && currentResult && (
            <>
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-center text-sm text-slate-500">
                  Question {currentIndex + 1} of {totalQ}
                </p>
                {!isPathway ? (
                <>
                <p className="mt-2 text-center text-5xl font-extrabold text-[#c9972c]">
                  {formatBand(currentResult.bandOverall)}
                </p>
                <p className="text-center text-xs text-slate-500">Overall band</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "FC", value: currentResult.bandFC, color: "#c9972c" },
                      { label: "LR", value: currentResult.bandLR, color: "#7c3aed" },
                      { label: "GRA", value: currentResult.bandGRA, color: "#2563eb" },
                      { label: "P", value: currentResult.bandP, color: "#0d9488" },
                    ].map((c) => (
                      <div
                        key={c.label}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center"
                      >
                        <p className="text-xs font-bold text-slate-500">{c.label}</p>
                        <p
                          className="mt-1 text-lg font-bold"
                          style={{ color: c.color }}
                        >
                          {formatBand(c.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-[#0d1b35]">Fluency:</span>{" "}
                      {currentResult.feedback.fluency?.slice(0, 120)}
                      {(currentResult.feedback.fluency?.length ?? 0) > 120 ? "…" : ""}
                    </p>
                    <p>
                      <span className="font-semibold text-[#0d1b35]">Lexical:</span>{" "}
                      {currentResult.feedback.lexical?.slice(0, 120)}
                      {(currentResult.feedback.lexical?.length ?? 0) > 120 ? "…" : ""}
                    </p>
                  </div>
                </div>
                </>
                ) : (
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-[#0d1b35]">Fluency:</span>{" "}
                    {currentResult.feedback.fluency?.slice(0, 160)}
                    {(currentResult.feedback.fluency?.length ?? 0) > 160 ? "…" : ""}
                  </p>
                  <p>
                    <span className="font-semibold text-[#0d1b35]">Lexical:</span>{" "}
                    {currentResult.feedback.lexical?.slice(0, 160)}
                    {(currentResult.feedback.lexical?.length ?? 0) > 160 ? "…" : ""}
                  </p>
                </div>
                )}

                {currentResult.feedback.strengths ? (
                  <div
                    className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
                  >
                    {currentResult.feedback.strengths.split(/[.!?]/)[0]?.trim() ||
                      currentResult.feedback.strengths}
                  </div>
                ) : null}

                {currentResult.feedback.improvements?.[0] ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <span className="font-semibold">Key improvement: </span>
                    {currentResult.feedback.improvements[0].title} —{" "}
                    {currentResult.feedback.improvements[0].advice}
                  </div>
                ) : null}

                {currentResult.feedback.modelAnswer ? (
                  <div className="mt-4 rounded-xl bg-[#0d9488] p-4">
                    <p className="text-xs font-bold text-white">Short model answer</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/95">
                      {currentResult.feedback.modelAnswer}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-8">
                {isLastQuestion ? (
                  <button
                    type="button"
                    onClick={() => setState("complete")}
                    className="w-full rounded-xl bg-[#c9972c] py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
                  >
                    View Discussion Results →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNextQuestion}
                    className="w-full rounded-xl bg-[#c9972c] py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
                  >
                    Next Question →
                  </button>
                )}
              </div>
            </>
          )}

          {state === "complete" && results.length > 0 && (
            <>
              <header className="mt-4 text-center">
                <TrophyIcon className="mx-auto h-12 w-12 text-[#c9972c]" />
                <h1 className="mt-3 text-[28px] font-bold text-[#0d1b35]">
                  Discussion Complete!
                </h1>
              </header>

              {!isPathway ? (
              <div className="mt-8 text-center">
                <p className="text-6xl font-extrabold text-[#c9972c]">
                  {formatBand(partAverages.overall)}
                </p>
                <p className="mt-2 text-sm text-slate-500">Part 3 Band Score</p>
              </div>
              ) : (
              <div className="mt-8 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/5 p-6 text-center">
                <p className="text-lg font-semibold text-[#0d1b35]">
                  Discussion complete — well done!
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Review your feedback below to keep building confidence.
                </p>
              </div>
              )}

              {!isPathway ? (
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "FC", value: partAverages.fc, color: "#c9972c" },
                  { label: "LR", value: partAverages.lr, color: "#7c3aed" },
                  { label: "GRA", value: partAverages.gra, color: "#2563eb" },
                  { label: "P", value: partAverages.p, color: "#0d9488" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
                  >
                    <p className="text-xs font-bold text-slate-500">{item.label}</p>
                    <p
                      className="mt-2 text-2xl font-bold"
                      style={{ color: item.color }}
                    >
                      {formatBand(item.value)}
                    </p>
                  </div>
                ))}
              </div>
              ) : null}

              <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[#0d1b35]">Discussion Quality</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {[
                    {
                      label: "Opinion expression",
                      band: partAverages.fc,
                    },
                    {
                      label: "Reasoning and examples",
                      band: partAverages.gra,
                    },
                    {
                      label: "Vocabulary range",
                      band: partAverages.lr,
                    },
                  ].map((item) => {
                    const level = skillLevel(item.band);
                    return (
                      <li
                        key={item.label}
                        className="flex items-center justify-between gap-4"
                      >
                        <span className="text-slate-700">{item.label}</span>
                        <span className={`font-semibold ${skillLevelClass(level)}`}>
                          {skillLevelLabel(level)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                        Question
                      </th>
                      {!isPathway ? (
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">Band</th>
                      ) : null}
                      <th className="px-4 py-3 font-semibold text-[#0d1b35]">
                        Key point
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="max-w-[200px] px-4 py-3 text-slate-600">
                          {truncate(r.question)}
                        </td>
                        {!isPathway ? (
                        <td className="px-4 py-3 font-bold text-[#c9972c]">
                          {formatBand(r.bandOverall)}
                        </td>
                        ) : null}
                        <td className="px-4 py-3 text-slate-600">
                          {r.feedback.improvements?.[0]?.title ??
                            r.feedback.strengths?.slice(0, 40) ??
                            "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {vocabHighlights.length > 0 ? (
                <div className="mt-6 rounded-xl border border-[#c9972c]/30 bg-[#c9972c]/10 p-5">
                  <p className="font-bold text-[#c9972c]">
                    Strong vocabulary you used:
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {vocabHighlights.map((word) => (
                      <span
                        key={word}
                        className="rounded-full bg-[#c9972c]/20 px-3 py-1 text-sm font-medium capitalize text-[#0d1b35]"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {commonErrors.length > 0 ? (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                  <p className="font-bold text-red-600">
                    Grammar patterns to improve:
                  </p>
                  <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-red-700">
                    {commonErrors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetPart}
                  className="flex-1 rounded-xl border-2 border-[#0d1b35] py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#0d1b35] hover:text-white"
                >
                  Practice Part 3 Again
                </button>
                {!isPathway ? (
                <Link
                  href="/dashboard/student/speaking/mock"
                  className="flex-1 rounded-xl bg-[#c9972c] py-3 text-center text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
                >
                  Take Full Mock Test
                </Link>
                ) : (
                <Link
                  href={`${base}/speaking`}
                  className="flex-1 rounded-xl bg-[#c9972c] py-3 text-center text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
                >
                  Back to Speaking Practice
                </Link>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
