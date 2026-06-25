"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AudioRecorder from "@/components/AudioRecorder";
import SpeakingEvaluationCard, {
  type SpeakingEvaluationData,
} from "@/components/SpeakingEvaluationCard";
import DailyLimitReached from "@/components/DailyLimitReached";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import { getRandomCueCard } from "@/lib/speakingQuestions";

type PageState =
  | "cue-card-display"
  | "preparation"
  | "recording"
  | "evaluating"
  | "result";

type CueCard = {
  id: number;
  topic: string;
  prompt: string;
  bullets: string[];
  part3Questions: string[];
};

const PREP_TOTAL = 60;

function formatPrepTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function prepRingColor(seconds: number) {
  if (seconds > 30) return "#22c55e";
  if (seconds > 15) return "#f59e0b";
  return "#ef4444";
}

function bulletLikelyCovered(bullet: string, transcript: string): boolean {
  const t = transcript.toLowerCase();
  const stopWords = new Set([
    "where",
    "what",
    "when",
    "who",
    "whom",
    "which",
    "why",
    "how",
    "explain",
    "describe",
    "during",
    "this",
    "that",
    "your",
    "have",
    "been",
    "were",
    "with",
    "from",
    "they",
    "them",
    "about",
    "well",
    "particularly",
  ]);
  const keywords =
    bullet
      .toLowerCase()
      .match(/\b[a-z]{4,}\b/g)
      ?.filter((w) => !stopWords.has(w)) ?? [];
  if (keywords.length === 0) {
    return t.length > 0 && t.includes(bullet.toLowerCase().slice(0, 12));
  }
  return keywords.some((kw) => t.includes(kw));
}

function durationGuidance(seconds: number) {
  if (seconds < 30) {
    return { text: "Keep speaking — too short", className: "text-red-500" };
  }
  if (seconds < 60) {
    return { text: "Getting there — try to continue", className: "text-amber-500" };
  }
  if (seconds < 120) {
    return { text: "Good length — well done", className: "text-green-500" };
  }
  return { text: "Excellent — very thorough response", className: "text-[#c9972c]" };
}

function PrepCountdownRing({ timeLeft }: { timeLeft: number }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (PREP_TOTAL - timeLeft) / PREP_TOTAL;
  const offset = circumference * (1 - progress);
  const color = prepRingColor(timeLeft);
  const pulse = timeLeft <= 15;

  return (
    <div
      className={`relative mx-auto h-[200px] w-[200px] ${pulse ? "animate-pulse" : ""}`}
    >
      <svg
        width="200"
        height="200"
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl font-bold" style={{ color }}>
          {formatPrepTime(timeLeft)}
        </span>
      </div>
    </div>
  );
}

function CueCardFull({ card, isPathway = false }: { card: CueCard; isPathway?: boolean }) {
  return (
    <div className="mx-auto max-w-[600px] rounded-xl border-2 border-[#0d1b35] bg-[#fafaf7] p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {isPathway ? "Speaking — Part 2" : "IELTS Speaking — Part 2"}
      </p>
      <p className="mt-4 text-lg font-bold text-[#0d1b35]">{card.prompt}</p>
      <p className="mt-5 text-sm font-bold text-[#0d1b35]">You should say:</p>
      <ul className="mt-3 space-y-2">
        {card.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2 text-sm text-slate-700">
            <span className="text-[#0d1b35]">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CueCardCompact({ card }: { card: CueCard }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <p className="font-bold text-[#0d1b35]">{card.prompt}</p>
      <ul className="mt-2 space-y-1 text-slate-600">
        {card.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span>•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CueCardReference({ card }: { card: CueCard }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-bold text-[#0d1b35]">{card.prompt}</p>
      <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
        {card.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className="text-[#c9972c]">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SpeakingPart2Page() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isPathway, base, usesProgramShell } = usePathwayStudentContext();
  const studentId = (session?.user as { id?: string })?.id ?? "";

  const [state, setState] = useState<PageState>("cue-card-display");
  const [cueCard, setCueCard] = useState<CueCard | null>(null);
  const [prepNotes, setPrepNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<
    (SpeakingEvaluationData & { success?: boolean }) | null
  >(null);
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TOTAL);
  const [prepStarted, setPrepStarted] = useState(false);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [limitLoading, setLimitLoading] = useState(true);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);

  const transcriptRef = useRef("");
  const recorderKeyRef = useRef(0);
  const usedCueIdsRef = useRef<number[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    const card = getRandomCueCard();
    setCueCard(card as CueCard);
    usedCueIdsRef.current = [card.id];
  }, []);

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
          const blocked = !data.unlimited && data.part2 && !data.part2.canTake;
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

  useEffect(() => {
    if (state !== "preparation" || !prepStarted) return;

    const id = setInterval(() => {
      setPrepTimeLeft((t) => {
        if (t <= 1) {
          setState("recording");
          setShowToast(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [state, prepStarted]);

  useEffect(() => {
    if (!showToast) return;
    const id = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(id);
  }, [showToast]);

  const handleSubmitPart2 = useCallback(
    async (answerTranscript: string, duration: number) => {
      if (!studentId || !cueCard) return;

      setState("evaluating");
      setEvalError(null);
      setTranscript(answerTranscript);

      const questionText = `${cueCard.prompt} Cover these points: ${cueCard.bullets.join(", ")}`;

      try {
        const res = await fetch("/api/speaking/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: answerTranscript,
            questionText,
            part: 2,
            taskType: "part2-cue-card",
            studentId,
            expectedDuration: 120,
            duration,
            topic: cueCard.topic,
            isFirstQuestion: true,
          }),
        });

        const result = await res.json().catch(() => null);

        if (!res.ok || !result?.success) {
          throw new Error(result?.error ?? "Evaluation failed");
        }

        setEvaluation({
          bandFC: result.bandFC,
          bandLR: result.bandLR,
          bandGRA: result.bandGRA,
          bandP: result.bandP,
          bandOverall: result.bandOverall,
          feedback: result.feedback,
          transcript: answerTranscript,
        });
        setState("result");
      } catch (err) {
        setEvalError(err instanceof Error ? err.message : "Evaluation failed");
        setState("recording");
      }
    },
    [studentId, cueCard]
  );

  const startPreparation = useCallback(() => {
    setPrepTimeLeft(PREP_TOTAL);
    setPrepStarted(true);
    setState("preparation");
  }, []);

  const tryAnotherCard = useCallback(() => {
    const excludeIds = cueCard ? [cueCard.id, ...usedCueIdsRef.current] : [];
    const next = getRandomCueCard(excludeIds) as CueCard;
    const merged = usedCueIdsRef.current.concat(next.id);
    usedCueIdsRef.current = merged.filter(
      (id, index) => merged.indexOf(id) === index
    );

    setCueCard(next);
    setPrepNotes("");
    setTranscript("");
    setEvaluation(null);
    setPrepTimeLeft(PREP_TOTAL);
    setPrepStarted(false);
    setRecordingElapsed(0);
    transcriptRef.current = "";
    recorderKeyRef.current += 1;
    setEvalError(null);
    setShowToast(false);
    setState("cue-card-display");
  }, [cueCard]);

  if (status === "loading" || status === "unauthenticated" || limitLoading) {
    return <PageSpinner />;
  }

  if (limitBlocked) {
    return <DailyLimitReached variant="part2" />;
  }

  if (!cueCard) {
    return <PageSpinner />;
  }

  const guidance = durationGuidance(recordingElapsed);

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

          {showToast ? (
            <div
              className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-semibold text-white shadow-lg"
              role="status"
            >
              Time&apos;s up — start speaking!
            </div>
          ) : null}

          {state === "cue-card-display" && (
            <>
              <header className="mt-4 text-center">
                <h1 className="text-2xl font-bold text-[#0d1b35]">
                  Part 2 — Cue Card
                </h1>
                <p className="mt-2 text-slate-500">
                  Read the topic carefully and prepare your answer
                </p>
              </header>

              <div className="mt-8">
                <CueCardFull card={cueCard} isPathway={isPathway} />
              </div>

              <div className="mx-auto mt-6 max-w-[600px] rounded-xl border border-[#c9972c]/40 bg-[#c9972c]/10 px-4 py-3 text-center text-sm text-[#0d1b35]">
                You will have 1 minute to prepare.
                <br />
                Make notes below to help you speak.
              </div>

              <div className="mx-auto mt-4 max-w-[600px]">
                <textarea
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Write key words and ideas here..."
                  className="h-[100px] w-full resize-none rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none ring-[#c9972c] focus:ring-2"
                />
              </div>

              <button
                type="button"
                onClick={startPreparation}
                className="mx-auto mt-6 block w-full max-w-[600px] rounded-xl bg-[#c9972c] py-3.5 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
              >
                Start 1 Minute Preparation
              </button>
            </>
          )}

          {state === "preparation" && (
            <>
              <div className="mt-8 flex flex-col items-center">
                <PrepCountdownRing timeLeft={prepTimeLeft} />
                <p className="mt-4 text-sm text-slate-500">Preparation Time</p>
              </div>

              <div className="mt-8">
                <CueCardCompact card={cueCard} />
              </div>

              <div className="mt-4">
                <textarea
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Write key words and ideas here..."
                  className="h-[100px] w-full resize-none rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none ring-[#c9972c] focus:ring-2"
                />
              </div>

              <button
                type="button"
                onClick={() => setState("recording")}
                className="mt-4 w-full rounded-xl border-2 border-slate-300 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:bg-white"
              >
                Skip — I&apos;m Ready
              </button>
            </>
          )}

          {state === "recording" && (
            <>
              <header className="mt-4">
                <h1 className="text-2xl font-bold text-[#0d1b35]">
                  Speak about your topic now
                </h1>
                <p className="mt-2 text-slate-500">
                  Cover all bullet points — aim for 1-2 minutes
                </p>
              </header>

              {evalError ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {evalError}
                </p>
              ) : null}

              <div className="mt-8 flex flex-col gap-6 lg:flex-row">
                <div className="lg:w-[40%]">
                  <CueCardReference card={cueCard} />
                </div>
                <div className="lg:w-[60%]">
                  <AudioRecorder
                    key={recorderKeyRef.current}
                    maxDuration={150}
                    minDuration={60}
                    autoSubmit
                    onTranscriptReady={(t) => {
                      transcriptRef.current = t;
                      setTranscript(t);
                    }}
                    onElapsedChange={setRecordingElapsed}
                    onRecordingComplete={(_blob, duration) => {
                      handleSubmitPart2(transcriptRef.current, duration);
                    }}
                  />
                  <p
                    className={`mt-4 text-center text-sm font-semibold ${guidance.className}`}
                  >
                    {guidance.text}
                  </p>
                </div>
              </div>
            </>
          )}

          {state === "evaluating" && (
            <div className="mt-20 flex flex-col items-center text-center">
              <span className="h-14 w-14 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
              <h2 className="mt-6 text-xl font-bold text-[#0d1b35]">
                Evaluating your Part 2 response…
              </h2>
              <p className="mt-2 text-slate-500">
                Assessing extended speaking ability
              </p>
            </div>
          )}

          {state === "result" && evaluation && (
            <>
              <header className="mt-4">
                <h1 className="text-2xl font-bold text-[#0d1b35]">
                  Part 2 Complete
                </h1>
              </header>

              <div className="mt-6">
                <SpeakingEvaluationCard
                  evaluation={{ ...evaluation, transcript }}
                  showTranscript
                  showModelAnswer={false}
                  hideBandScores={isPathway}
                />
              </div>

              <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[#0d1b35]">Bullet Point Coverage</h3>
                <ul className="mt-4 space-y-3">
                  {cueCard.bullets.map((bullet) => {
                    const covered = bulletLikelyCovered(bullet, transcript);
                    return (
                      <li
                        key={bullet}
                        className="flex items-start gap-3 text-sm text-slate-700"
                      >
                        {covered ? (
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                            ✓
                          </span>
                        ) : (
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            !
                          </span>
                        )}
                        <span>{bullet}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {prepNotes.trim() ? (
                <div className="mt-6 rounded-xl bg-slate-100 p-5">
                  <p className="text-sm font-bold text-[#0d1b35]">
                    Your preparation notes:
                  </p>
                  <p className="mt-2 text-sm italic text-slate-600">{prepNotes}</p>
                </div>
              ) : null}

              {evaluation.feedback.modelAnswer ? (
                <div className="mt-6 rounded-xl bg-[#0d9488] p-5">
                  <h3 className="font-bold text-white">
                    {isPathway ? "Model Answer" : "Band 7-8 Model Answer"}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/95">
                    {evaluation.feedback.modelAnswer}
                  </p>
                  <p className="mt-3 text-xs text-white/70">
                    2-minute ideal response
                  </p>
                </div>
              ) : null}

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={tryAnotherCard}
                  className="flex-1 rounded-xl border-2 border-[#0d1b35] py-3 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#0d1b35] hover:text-white"
                >
                  Try Another Cue Card
                </button>
                <Link
                  href={`${base}/speaking/part3`}
                  className="flex-1 rounded-xl bg-[#c9972c] py-3 text-center text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
                >
                  Continue to Part 3 →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
