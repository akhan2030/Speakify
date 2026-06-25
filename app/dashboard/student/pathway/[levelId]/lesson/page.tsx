"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/student/PageFetchStates";
import { speakWithBrowser, stopBrowserSpeech } from "@/lib/browserSpeech";
import { apiGet, apiPost } from "@/lib/pathway/apiFetch";
import { PATHWAY_DAYS } from "@/lib/pathway/dayStructure";
import { resolveDayType } from "@/lib/pathway/dayMapping";
import { getNextDayEncouragement } from "@/lib/pathway/nextDayMessage";

type LessonPayload = {
  level: { slug: string; code: string; name: string };
  week: number;
  dayType: string;
  content: Record<string, unknown>;
  lessonId?: string | null;
  contentCached?: boolean;
  completed: boolean;
  weeklyScore?: number | null;
};

function Flashcard({
  word,
  definition,
  example,
  arabic,
}: {
  word: string;
  definition: string;
  example: string;
  arabic: string;
}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped(!flipped)}
      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-[#c9972c]"
    >
      {!flipped ? (
        <p className="text-lg font-bold text-[#0d1b35]">{word}</p>
      ) : (
        <>
          <p className="text-sm text-slate-600">{definition}</p>
          <p className="mt-2 text-xs italic text-slate-500">{example}</p>
          <p className="mt-2 text-sm text-[#0d9488]">{arabic}</p>
        </>
      )}
    </button>
  );
}

function DailyLessonInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const levelId = String(params.levelId);
  const week = Number(searchParams.get("week") ?? "1");
  const dayParam = searchParams.get("day") ?? "monday";
  const forceRegenerate = searchParams.get("force") === "1";
  const dayType = resolveDayType(dayParam);

  const [data, setData] = useState<LessonPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quizSeconds, setQuizSeconds] = useState(30 * 60);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [grammarExIndex, setGrammarExIndex] = useState(0);
  const [vocabExIndex, setVocabExIndex] = useState(0);
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState<number | null>(null);
  const [writingText, setWritingText] = useState("");
  const [speakingTranscript, setSpeakingTranscript] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const quizSubmittedRef = useRef(false);

  const load = useCallback(() => {
    console.log("1. Lesson page loaded - levelId:", levelId, "week:", week, "day:", dayParam);
    setLoading(true);
    setLoadError(null);
    apiGet(
      `/api/pathway/lesson/${levelId}?week=${week}&day=${encodeURIComponent(dayParam)}${forceRegenerate ? "&force=1" : ""}`
    )
      .then(async (r) => {
        const json = await r.json();
        console.log("9. API response status:", r.status, "hasContent:", Boolean(json.content));
        if (!r.ok) {
          throw new Error(
            String(json.error ?? `Failed to load lesson (${r.status})`)
          );
        }
        if (json.fallback && json.error) {
          throw new Error(String(json.error));
        }
        if (json.fallback || (json.level && json.content)) {
          return json as LessonPayload;
        }
        if (json.error) {
          throw new Error(json.error);
        }
        throw new Error("Lesson data is incomplete");
      })
      .then((payload) => {
        console.log("10. Lesson content ready on page");
        setData(payload);
      })
      .catch((err: Error) => {
        console.error("Lesson page load error:", err);
        setData(null);
        setLoadError(err.message ?? "Failed to load lesson");
      })
      .finally(() => setLoading(false));
  }, [levelId, week, dayParam, forceRegenerate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoadError("Taking too long. Lesson generation can take up to 90 seconds — please try again.");
      setLoading(false);
    }, 90000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    setQuizQuestionIndex(0);
    setGrammarExIndex(0);
    setVocabExIndex(0);
    setCompleteMessage(null);
    setQuizScore(null);
    quizSubmittedRef.current = false;
  }, [levelId, week, dayParam]);

  useEffect(() => {
    if (!data?.content || dayType !== "assessment") return;
    const minutes = Number((data.content as { timerMinutes?: number }).timerMinutes) || 30;
    setQuizSeconds(minutes * 60);
    if (data.completed && data.weeklyScore != null) {
      setQuizScore(data.weeklyScore);
    }
  }, [data?.content, data?.completed, data?.weeklyScore, dayType]);

  const markComplete = async (score = 100) => {
    setSaving(true);
    const res = await apiPost(`/api/pathway/lesson/${levelId}`, {
      week,
      day: dayParam,
      score,
      lessonId: data?.lessonId ?? undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (json.nextDayMessage) setCompleteMessage(String(json.nextDayMessage));
    if (json.streak?.current != null) setStreakCount(Number(json.streak.current));
    else if (dayType) setCompleteMessage(getNextDayEncouragement(dayType));
    setSaving(false);
    load();
  };

  const submitWeeklyQuiz = useCallback(async () => {
    if (quizSubmittedRef.current || !data || data.completed) return;
    quizSubmittedRef.current = true;
    const quiz = (data.content.quiz as Array<Record<string, unknown>>) ?? [];
    let correct = 0;
    quiz.forEach((q) => {
      if (answers[String(q.id)] === q.correctIndex) correct += 1;
    });
    const score = Math.round((correct / Math.max(quiz.length, 1)) * 100);
    setQuizScore(score);
    setSaving(true);
    const res = await apiPost(`/api/pathway/lesson/${levelId}`, {
      week,
      day: dayParam,
      score,
      lessonId: data?.lessonId ?? undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (json.nextDayMessage) setCompleteMessage(String(json.nextDayMessage));
    if (json.streak?.current != null) setStreakCount(Number(json.streak.current));
    setSaving(false);
    load();
  }, [answers, data, dayParam, levelId, load, week]);

  useEffect(() => {
    if (dayType !== "assessment" || data?.completed) return;
    const id = window.setInterval(() => {
      setQuizSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          submitWeeklyQuiz();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [dayType, data?.completed, submitWeeklyQuiz]);

  const checkMcq = async (id: string, selected: number, correct: number) => {
    const ok = selected === correct;
    setAnswers((p) => ({ ...p, [id]: selected }));
    setFeedback(ok ? "Correct ✓" : "Not quite — review the rule and try again.");
  };

  if (loading) {
    return (
      <PageShell activePage="course" loading={false} error={null}>
        <div className="flex flex-col items-center justify-center px-6 py-24">
          <div
            className="h-11 w-11 animate-spin rounded-full border-4 border-[#c9972c]/25 border-t-[#c9972c]"
            aria-hidden
          />
          <p className="mt-5 text-base font-semibold text-[#0d1b35]">
            Preparing your lesson — this takes about 15 seconds...
          </p>
          <p className="mt-2 max-w-sm text-center text-sm text-slate-500">
            Generating personalised content for your level with AI. First-time
            lessons may take up to 90 seconds.
          </p>
          {forceRegenerate ? (
            <p className="mt-2 text-xs font-medium text-[#c9972c]">
              Regenerating fresh content…
            </p>
          ) : null}
        </div>
      </PageShell>
    );
  }

  if (loadError || !dayType) {
    return (
      <PageShell activePage="course" loading={false} error={null}>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8">
            <p className="text-lg font-bold text-red-800">Could not load lesson</p>
            <p className="mt-3 text-sm text-red-700">
              {loadError ?? "Invalid day parameter"}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-[#0d9488] px-6 py-3 text-sm font-bold text-white hover:bg-[#0b7d72]"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("force", "1");
                window.location.href = url.toString();
              }}
              className="mt-3 block w-full text-sm font-semibold text-[#c9972c] underline"
            >
              Regenerate lesson with AI
            </button>
            <button
              type="button"
              onClick={load}
              className="mt-2 block w-full text-sm font-semibold text-[#0d9488] underline"
            >
              Retry without full refresh
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!data?.level || !data?.content) {
    return (
      <PageShell activePage="course" loading={false} error={null}>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-8">
            <p className="text-lg font-bold text-amber-900">Lesson data is incomplete</p>
            <p className="mt-3 text-sm text-amber-800">
              The server responded but did not include lesson content. Try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-[#0d9488] px-6 py-3 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  const dayMeta = PATHWAY_DAYS.find((d) => d.dayType === dayType);
  if (!dayMeta) {
    return (
      <PageShell activePage="course" loading={false} error="Unknown lesson day type">
        {null}
      </PageShell>
    );
  }

  const c = data.content ?? {};

  return (
    <PageShell activePage="course" loading={false} error={null}>
      <div className="p-6">
      <Link
        href={`/dashboard/student/pathway/${levelId}`}
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← {data.level.name}
      </Link>

      <header className="mt-4 rounded-2xl bg-[#0d1b35] px-6 py-5 text-white">
        <p className="text-xs uppercase text-[#c9972c]">
          Week {week} · {dayMeta.dayName}
        </p>
        <h1 className="mt-1 text-2xl font-bold">
          {dayMeta.icon} {dayMeta.dayLabel}
        </h1>
        <p className="mt-1 text-sm text-slate-300">{dayMeta.theme}</p>
      </header>

      <div className="mt-6 space-y-6">
        {completeMessage || streakCount != null ? (
          <div className="rounded-xl border border-[#c9972c]/40 bg-[#c9972c]/10 px-5 py-4">
            {completeMessage ? (
              <p className="font-semibold text-[#8a6918]">{completeMessage}</p>
            ) : null}
            {streakCount != null && streakCount > 0 ? (
              <p className="mt-1 text-sm text-[#8a6918]/90">
                Study streak: {streakCount} day{streakCount === 1 ? "" : "s"} 🔥
              </p>
            ) : null}
          </div>
        ) : null}

        {dayType === "input" ? (
          <>
            <section className="overflow-hidden rounded-xl shadow-sm">
              <div className="bg-[#c9972c] px-5 py-3">
                <h2 className="text-lg font-bold text-[#0d1b35]">
                  {String(c.grammarTitle ?? "Grammar concept")}
                </h2>
              </div>
              <div className="space-y-3 bg-white p-5">
                {String(c.grammarExplanation ?? "")
                  .split(/\n\n+/)
                  .filter(Boolean)
                  .map((para) => (
                    <p key={para.slice(0, 40)} className="text-sm leading-relaxed text-slate-700">
                      {para}
                    </p>
                  ))}
              </div>
            </section>
            {Array.isArray(c.grammarExamples) && (c.grammarExamples as string[]).length > 0 ? (
              <section>
                <h2 className="mb-3 font-bold text-[#0d1b35]">Example sentences</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(c.grammarExamples as string[]).map((ex) => (
                    <div
                      key={ex.slice(0, 30)}
                      className="rounded-xl bg-[#0d1b35] px-4 py-3 text-sm text-white"
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {c.saudiContext ? (
              <section className="rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/5 p-5">
                <h2 className="font-bold text-[#0d9488]">Saudi context</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {String(c.saudiContext)}
                </p>
              </section>
            ) : null}
            {Array.isArray(c.commonMistakes) && (c.commonMistakes as string[]).length > 0 ? (
              <section className="rounded-xl bg-red-50 p-5">
                <h2 className="font-bold text-red-800">Common mistakes</h2>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-900/90">
                  {(c.commonMistakes as string[]).map((m) => (
                    <li key={m.slice(0, 40)}>{m}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            <section>
              <h2 className="mb-3 font-bold text-[#0d1b35]">Vocabulary flashcards (15)</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {((c.vocabulary as Array<Record<string, string>>) ?? []).map((v) => (
                  <Flashcard
                    key={v.id}
                    word={v.word}
                    definition={v.definition}
                    example={v.ieltsExample || v.example}
                    arabic={v.arabic}
                  />
                ))}
              </div>
            </section>
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[#0d1b35]">Reading passage</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {String(c.passage ?? "")}
              </p>
              <div className="mt-4 space-y-3">
                {((c.comprehension as Array<Record<string, unknown>>) ?? []).map(
                  (q, i) => (
                    <div key={String(q.id)} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">
                        {i + 1}. {String(q.question)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {((q.options as string[]) ?? []).map((opt, oi) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              checkMcq(String(q.id), oi, Number(q.correctIndex))
                            }
                            className="rounded-lg border px-3 py-1 text-xs hover:bg-[#0d9488]/10"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
            <CompleteButton
              label="Mark Complete"
              saving={saving}
              completed={data.completed}
              encouragement={completeMessage ?? (data.completed ? getNextDayEncouragement("input") : null)}
              onComplete={() => markComplete()}
            />
          </>
        ) : null}

        {dayType === "practice" ? (
          <>
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[#0d1b35]">Grammar practice</h2>
              <p className="mt-1 text-xs text-slate-500">
                Exercise {grammarExIndex + 1} of{" "}
                {Math.min(((c.grammarExercises as unknown[]) ?? []).length, 10)}
              </p>
              {(() => {
                const exercises = ((c.grammarExercises as Array<Record<string, string>>) ?? []).slice(0, 10);
                const ex = exercises[grammarExIndex];
                if (!ex) return null;
                return (
                  <ExerciseRow
                    key={ex.id}
                    index={grammarExIndex + 1}
                    prompt={ex.prompt}
                    answer={ex.answer}
                    explanation={ex.explanation}
                    onFeedback={setFeedback}
                    onCorrect={() => {
                      if (grammarExIndex < exercises.length - 1) {
                        setGrammarExIndex((i) => i + 1);
                      }
                    }}
                  />
                );
              })()}
            </section>
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[#0d1b35]">Vocabulary matching</h2>
              <p className="mt-1 text-xs text-slate-500">
                Exercise {vocabExIndex + 1} of{" "}
                {Math.min(((c.vocabExercises as unknown[]) ?? []).length, 10)}
              </p>
              {(() => {
                const exercises = ((c.vocabExercises as Array<Record<string, unknown>>) ?? []).slice(0, 10);
                const ex = exercises[vocabExIndex];
                if (!ex) return null;
                if (Array.isArray(ex.options)) {
                  return (
                    <VocabMatchBlock
                      key={String(ex.id)}
                      ex={ex}
                      index={vocabExIndex + 1}
                      onCorrect={() => {
                        if (vocabExIndex < exercises.length - 1) {
                          setVocabExIndex((i) => i + 1);
                        }
                      }}
                      onFeedback={setFeedback}
                    />
                  );
                }
                return (
                  <ExerciseRow
                    key={String(ex.id)}
                    index={vocabExIndex + 1}
                    prompt={String(ex.prompt)}
                    answer={String(ex.answer)}
                    onFeedback={setFeedback}
                    onCorrect={() => {
                      if (vocabExIndex < exercises.length - 1) {
                        setVocabExIndex((i) => i + 1);
                      }
                    }}
                  />
                );
              })()}
            </section>
            {(c.listening as { transcript?: string; questions?: Array<Record<string, unknown>> }) ? (
              <section className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="font-bold text-[#0d1b35]">Listening exercise</h2>
                <LessonListeningAudio
                  transcript={String((c.listening as { transcript?: string }).transcript ?? "")}
                />
                <div className="mt-4 space-y-3">
                  {(
                    (c.listening as { questions?: Array<Record<string, unknown>> }).questions ??
                    []
                  ).map((q, i) => (
                    <McqBlock key={String(q.id)} index={i + 1} q={q} onCheck={checkMcq} />
                  ))}
                </div>
              </section>
            ) : null}
            {feedback ? (
              <p className="text-sm font-medium text-[#0d9488]">{feedback}</p>
            ) : null}
            <CompleteButton
              label="Mark Complete"
              saving={saving}
              completed={data.completed}
              encouragement={completeMessage ?? (data.completed ? getNextDayEncouragement("practice") : null)}
              onComplete={() => markComplete()}
            />
          </>
        ) : null}

        {dayType === "application" ? (
          <>
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[#0d1b35]">Speaking (60 sec)</h2>
              <p className="mt-2 text-sm text-slate-600">{String(c.speakingPrompt)}</p>
              {Array.isArray(c.speakingTips) ? (
                <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
                  {(c.speakingTips as string[]).map((t) => (
                    <li key={t.slice(0, 30)}>{t}</li>
                  ))}
                </ul>
              ) : null}
              <RecordButton onTranscript={setSpeakingTranscript} />
              {speakingTranscript ? (
                <p className="mt-2 text-xs text-slate-500">{speakingTranscript}</p>
              ) : null}
            </section>
            <section className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[#0d1b35]">Writing</h2>
              <p className="mt-2 text-sm text-slate-600">
                {(c.writing as { instruction?: string })?.instruction}
              </p>
              <p className="mt-1 text-sm font-medium">
                {(c.writing as { prompt?: string })?.prompt}
              </p>
              {Array.isArray(c.writingTips) ? (
                <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
                  {(c.writingTips as string[]).map((t) => (
                    <li key={t.slice(0, 30)}>{t}</li>
                  ))}
                </ul>
              ) : null}
              <textarea
                className="mt-3 min-h-[160px] w-full rounded-xl border px-4 py-3 text-sm"
                value={writingText}
                onChange={(e) => setWritingText(e.target.value)}
                disabled={applicationSubmitted || data.completed}
              />
              <p className="mt-1 text-xs text-slate-500">
                Words: {writingText.trim() ? writingText.trim().split(/\s+/).length : 0}
                {(c.writing as { minWords?: number; maxWords?: number })?.minWords
                  ? ` (target ${(c.writing as { minWords?: number }).minWords}–${(c.writing as { maxWords?: number }).maxWords ?? 120})`
                  : ""}
              </p>
            </section>
            {c.bandDescriptors ? (
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="font-bold text-[#0d1b35]">Band descriptors</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(["band5", "band6", "band7"] as const).map((key) => {
                    const label = key.replace("band", "Band ");
                    const text = (c.bandDescriptors as Record<string, string>)?.[key];
                    if (!text) return null;
                    return (
                      <div key={key} className="rounded-lg bg-white p-3 text-xs text-slate-700">
                        <p className="font-bold text-[#c9972c]">{label}</p>
                        <p className="mt-1">{text}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
            {applicationSubmitted || data.completed ? (
              <section className="rounded-xl border border-[#c9972c] bg-[#c9972c]/10 p-5">
                <h2 className="font-bold text-[#0d1b35]">Model answers</h2>
                <p className="mt-2 text-xs font-semibold uppercase text-slate-500">Speaking</p>
                <p className="mt-1 text-sm text-slate-700">
                  {String(
                    (c.modelAnswer as { speaking?: string })?.speaking ??
                      "I prepare by reviewing vocabulary daily and practising with a partner."
                  )}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase text-slate-500">Writing</p>
                <p className="mt-1 text-sm text-slate-700">
                  {String(
                    (c.modelAnswer as { writing?: string })?.writing ??
                      "A well-structured paragraph with clear topic sentence and supporting details."
                  )}
                </p>
              </section>
            ) : null}
            <CompleteButton
              label={applicationSubmitted ? "Mark Complete" : "Submit & reveal model answers"}
              saving={saving}
              completed={data.completed}
              encouragement={completeMessage ?? (data.completed ? getNextDayEncouragement("application") : null)}
              onComplete={async () => {
                setApplicationSubmitted(true);
                await markComplete();
              }}
            />
          </>
        ) : null}

        {dayType === "review" ? (
          <>
            <div className="rounded-xl border-2 border-[#c9972c] bg-gradient-to-r from-[#c9972c]/20 to-[#c9972c]/10 px-5 py-4 text-center">
              <p className="text-lg font-bold text-[#8a6918]">Review Day — 30% Revisit</p>
              <p className="mt-1 text-sm text-[#8a6918]/90">
                {String(c.reviewBanner ?? true) === "true" || c.reviewBanner === true
                  ? "Spaced repetition from your previous level in new contexts"
                  : String(c.reviewBanner ?? "Spaced repetition from your previous level")}
              </p>
            </div>
            <h2 className="font-bold text-[#0d1b35]">Vocabulary review</h2>
            {((c.vocabReview as Array<Record<string, unknown>>) ?? []).map((q, i) => (
              <McqBlock key={String(q.id)} index={i + 1} q={q} onCheck={checkMcq} />
            ))}
            <h2 className="font-bold text-[#0d1b35]">Grammar review</h2>
            {((c.grammarReview as Array<Record<string, unknown>>) ?? []).map((q, i) => (
              <McqBlock key={String(q.id)} index={i + 1} q={q} onCheck={checkMcq} />
            ))}
            <CompleteButton
              label="Mark Complete"
              saving={saving}
              completed={data.completed}
              encouragement={completeMessage ?? (data.completed ? getNextDayEncouragement("review") : null)}
              onComplete={() => markComplete()}
            />
          </>
        ) : null}

        {dayType === "assessment" ? (
          <>
            {quizScore == null && !data.completed ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-[#0d1b35]">
                    Question {quizQuestionIndex + 1} of{" "}
                    {((c.quiz as unknown[]) ?? []).length}
                  </p>
                  <p
                    className={`font-mono text-lg font-bold ${
                      quizSeconds <= 600 ? "text-red-600" : "text-[#0d1b35]"
                    }`}
                  >
                    {Math.floor(quizSeconds / 60)}:
                    {String(quizSeconds % 60).padStart(2, "0")}
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-[#c9972c] transition-all"
                    style={{
                      width: `${(((c.quiz as unknown[]) ?? []).length ? (quizQuestionIndex + 1) / ((c.quiz as unknown[]).length) : 0) * 100}%`,
                    }}
                  />
                </div>
                {(() => {
                  const quiz = (c.quiz as Array<Record<string, unknown>>) ?? [];
                  const q = quiz[quizQuestionIndex];
                  if (!q) return null;
                  return (
                    <McqBlock
                      key={String(q.id)}
                      index={quizQuestionIndex + 1}
                      q={q}
                      section={String(q.section ?? "")}
                      onCheck={(id, selected, correct) => {
                        checkMcq(id, selected, correct);
                        setAnswers((p) => ({ ...p, [String(q.id)]: selected }));
                      }}
                    />
                  );
                })()}
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={quizQuestionIndex === 0}
                    onClick={() => setQuizQuestionIndex((i) => Math.max(0, i - 1))}
                    className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {quizQuestionIndex < ((c.quiz as unknown[]) ?? []).length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setQuizQuestionIndex((i) => i + 1)}
                      className="rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Next question
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={submitWeeklyQuiz}
                      className="rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35] disabled:opacity-50"
                    >
                      {saving ? "Submitting…" : "Submit Weekly Quiz"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                {quizScore != null ? (
                  <div className="rounded-xl border border-[#c9972c] bg-[#c9972c]/10 p-6 text-center">
                    <p className="text-2xl font-bold text-[#8a6918]">Score: {quizScore}%</p>
                    {quizScore < 60 ? (
                      <p className="mt-2 text-sm text-red-700">
                        Weak areas detected — review{" "}
                        <Link
                          href={`/dashboard/student/pathway/${levelId}/lesson?week=${week}&day=monday`}
                          className="font-semibold underline"
                        >
                          grammar
                        </Link>{" "}
                        and{" "}
                        <Link
                          href={`/dashboard/student/pathway/${levelId}/lesson?week=${week}&day=tuesday`}
                          className="font-semibold underline"
                        >
                          vocabulary
                        </Link>
                        .
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-[#8a6918]">
                        Great work this week! Keep your streak going next week.
                      </p>
                    )}
                  </div>
                ) : null}
                {data.completed ? (
                  <p className="text-sm font-semibold text-[#0d9488]">✓ Weekly assessment complete</p>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </div>
      </div>
    </PageShell>
  );
}

function CompleteButton({
  label,
  saving,
  completed,
  encouragement,
  onComplete,
}: {
  label: string;
  saving: boolean;
  completed: boolean;
  encouragement?: string | null;
  onComplete: () => void;
}) {
  if (completed) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[#0d9488]">✓ Day complete</p>
        {encouragement ? (
          <p className="text-sm font-medium text-[#8a6918]">{encouragement}</p>
        ) : null}
      </div>
    );
  }
  return (
    <button
      type="button"
      disabled={saving}
      onClick={onComplete}
      className="rounded-xl bg-[#0d9488] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
    >
      {saving ? "Saving…" : label}
    </button>
  );
}

function VocabMatchBlock({
  ex,
  index,
  onCorrect,
  onFeedback,
}: {
  ex: Record<string, unknown>;
  index: number;
  onCorrect: () => void;
  onFeedback: (msg: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const correctIndex = Number(ex.correctIndex ?? 0);
  const options = (ex.options as string[]) ?? [];

  return (
    <div className="mt-3 rounded-lg border p-3">
      <p className="text-sm font-medium">
        {index}. {String(ex.prompt)}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt, oi) => {
          const showResult = selected != null;
          const isCorrect = oi === correctIndex;
          const isSelected = selected === oi;
          return (
            <button
              key={opt}
              type="button"
              disabled={selected != null}
              onClick={() => {
                setSelected(oi);
                const ok = oi === correctIndex;
                onFeedback(ok ? "Correct ✓" : "Not quite — review the definition.");
                if (ok) onCorrect();
              }}
              className={`rounded-lg border px-3 py-1 text-xs ${
                showResult && isSelected
                  ? isCorrect
                    ? "border-green-500 bg-green-50 text-green-800"
                    : "border-red-500 bg-red-50 text-red-800"
                  : "hover:bg-[#0d9488]/10"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseRow({
  prompt,
  answer,
  index,
  explanation,
  onFeedback,
  onCorrect,
}: {
  prompt: string;
  answer: string;
  index: number;
  explanation?: string;
  onFeedback: (msg: string) => void;
  onCorrect?: () => void;
}) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  return (
    <div className="mt-3 rounded-xl border bg-white p-4">
      <p className="text-sm font-medium text-[#0d1b35]">
        {index}. {prompt}
      </p>
      <input
        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
        value={value}
        disabled={checked}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !checked) {
            const ok = value.trim().toLowerCase() === answer.toLowerCase();
            setChecked(true);
            onFeedback(
              ok
                ? "Correct ✓"
                : `Try again. Model: ${answer}${explanation ? ` — ${explanation}` : ""}`
            );
            if (ok) onCorrect?.();
          }
        }}
      />
      {!checked ? (
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-[#0d9488]"
          onClick={() => {
            const ok = value.trim().toLowerCase() === answer.toLowerCase();
            setChecked(true);
            onFeedback(
              ok
                ? "Correct ✓"
                : `Try again. Model: ${answer}${explanation ? ` — ${explanation}` : ""}`
            );
            if (ok) onCorrect?.();
          }}
        >
          Check answer
        </button>
      ) : null}
    </div>
  );
}

function McqBlock({
  q,
  index,
  onCheck,
  section,
}: {
  q: Record<string, unknown>;
  index: number;
  onCheck: (id: string, selected: number, correct: number) => void;
  section?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const correctIndex = Number(q.correctIndex);

  return (
    <div className="rounded-xl border bg-white p-4">
      {section ? (
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#c9972c]">
          {section}
        </p>
      ) : null}
      <p className="text-sm font-medium">
        {index}. {String(q.question)}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {((q.options as string[]) ?? []).map((opt, oi) => {
          const isSelected = selected === oi;
          const showResult = selected != null;
          const isCorrect = oi === correctIndex;
          return (
            <button
              key={opt}
              type="button"
              disabled={selected != null}
              onClick={() => {
                setSelected(oi);
                onCheck(String(q.id), oi, correctIndex);
              }}
              className={`rounded-lg border px-3 py-1 text-xs ${
                showResult && isSelected
                  ? isCorrect
                    ? "border-green-500 bg-green-50 text-green-800"
                    : "border-red-500 bg-red-50 text-red-800"
                  : showResult && isCorrect
                    ? "border-green-300 bg-green-50/50"
                    : "hover:bg-[#0d9488]/10"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected != null ? (
        <p className={`mt-2 text-xs font-medium ${selected === correctIndex ? "text-green-700" : "text-red-700"}`}>
          {selected === correctIndex ? "Correct ✓" : "Not quite — review and try again next time."}
        </p>
      ) : null}
    </div>
  );
}

function LessonListeningAudio({ transcript }: { transcript: string }) {
  const [audioLoading, setAudioLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [usingBrowserVoice, setUsingBrowserVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const playBrowser = async () => {
    setUsingBrowserVoice(true);
    setError(null);
    setIsPlaying(true);
    try {
      await speakWithBrowser(transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Device voice unavailable");
    } finally {
      setIsPlaying(false);
      setAudioLoading(false);
    }
  };

  const play = async () => {
    if (!transcript.trim()) {
      setError("No transcript available.");
      setAudioLoading(false);
      return;
    }
    stopBrowserSpeech();
    setAudioLoading(true);
    setError(null);
    setUsingBrowserVoice(false);
    audioRef.current?.pause();
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    try {
      const res = await fetch("/api/listening/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          transcript,
          text: transcript,
          voice: "onyx",
          announcement: true,
          placement: true,
        }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || contentType.includes("application/json")) {
        let msg = "Audio generation failed";
        try {
          const json = await res.json();
          msg = String(json.error ?? msg);
        } catch {
          /* ignore */
        }
        const quota =
          msg.toLowerCase().includes("429") ||
          msg.toLowerCase().includes("quota") ||
          msg.toLowerCase().includes("billing");
        if (quota) {
          await playBrowser();
          return;
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      setAudioLoading(false);
      setIsPlaying(true);
      await audio.play();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Audio unavailable";
      const quota =
        msg.toLowerCase().includes("429") ||
        msg.toLowerCase().includes("quota");
      if (quota) {
        await playBrowser();
        return;
      }
      setAudioLoading(false);
      setIsPlaying(false);
      setError(msg);
    }
  };

  useEffect(() => {
    void play();
    return () => {
      stopBrowserSpeech();
      audioRef.current?.pause();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-[#0d9488]/20 bg-[#0d9488]/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void play()}
          disabled={audioLoading}
          className="text-sm font-semibold text-[#0d9488] disabled:opacity-60"
        >
          {audioLoading ? "Generating audio..." : isPlaying ? "Playing..." : "Replay audio"}
        </button>
        {error ? (
          <button
            type="button"
            onClick={() => void playBrowser()}
            className="text-xs font-semibold text-[#8a6918] underline"
          >
            Use device voice
          </button>
        ) : null}
      </div>
      {usingBrowserVoice && !error ? (
        <p className="text-xs text-amber-700">Using your device voice (AI audio unavailable)</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function RecordButton({ onTranscript }: { onTranscript: (t: string) => void }) {
  const [rec, setRec] = useState(false);
  const ref = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const toggle = async () => {
    if (rec) {
      ref.current?.stop();
      setRec(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunks.current = [];
    recorder.ondataavailable = (e) => chunks.current.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", blob, "answer.webm");
      const res = await fetch("/api/speaking/transcribe", { method: "POST", body: form });
      const json = await res.json();
      onTranscript(json.transcript ?? "");
      stream.getTracks().forEach((t) => t.stop());
    };
    ref.current = recorder;
    recorder.start();
    setRec(true);
    window.setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
        setRec(false);
      }
    }, 60000);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="mt-3 rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35]"
    >
      {rec ? "Stop recording" : "🎤 Record 60s"}
    </button>
  );
}


export default function DailyLessonPage() {
  return (
    <Suspense
      fallback={
        <PageShell activePage="course" loading error={null}>
          {null}
        </PageShell>
      }
    >
      <DailyLessonInner />
    </Suspense>
  );
}
