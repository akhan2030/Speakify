"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ExamHighlightQuestionText,
  ExamHighlightSection,
  HighlightableInlineText,
  HighlightableRadioOption,
} from "@/components/exam/ExamHighlightSection";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import type { TextHighlight } from "@/lib/examHighlight";

const TOTAL = 45 * 60;

export default function MidLevelTestPage() {
  const params = useParams();
  const levelId = String(params.levelId);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [seconds, setSeconds] = useState(TOTAL);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [speakingText, setSpeakingText] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [started, setStarted] = useState(false);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);

  useEffect(() => {
    fetch(`/api/pathway/mid-level-test/${levelId}`)
      .then((r) => r.json())
      .then(setPayload)
      .finally(() => setLoading(false));
  }, [levelId]);

  useEffect(() => {
    if (!started || result) return;
    const id = window.setInterval(() => {
      setSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [started, result]);

  useEffect(() => {
    setHighlights([]);
  }, [step]);

  const submit = async () => {
    const sections = payload?.sections as Record<string, unknown>;
    const grammar = (sections?.grammar as Array<{ id: string; correctIndex: number }>) ?? [];
    const vocabulary =
      (sections?.vocabulary as Array<{ id: string; correctIndex: number }>) ?? [];
    const reading =
      (sections?.reading as { questions: Array<{ id: string; correctIndex: number }> }) ??
      {};

    const scoreSection = (
      items: Array<{ id: string; correctIndex?: number }>
    ) => {
      if (!items.length) return 0;
      let c = 0;
      items.forEach((q) => {
        if (answers[q.id] === q.correctIndex) c += 1;
      });
      return Math.round((c / items.length) * 100);
    };

    const scores = {
      grammar: scoreSection(grammar),
      vocabulary: scoreSection(vocabulary),
      reading: scoreSection(reading.questions ?? []),
      speaking: speakingText.length > 20 ? 70 : 40,
    };

    const weakAreas = Object.entries(scores)
      .filter(([, v]) => v < 70)
      .map(([k]) => k);

    const overall =
      Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

    const res = await fetch(`/api/pathway/mid-level-test/${levelId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionScores: scores, weakAreas, overallScore: overall }),
    });
    setResult(await res.json());
  };

  if (loading) return <PageSpinner />;

  if (result) {
    const weak = (result.weakAreas as string[]) ?? [];
    return (
      <div className="flex min-h-screen bg-slate-50">
        <StudentSidebar activePage="course" />
        <main className="ml-[200px] flex-1 p-6">
          <h1 className="text-2xl font-bold text-[#0d1b35]">Mid-Level Diagnostic</h1>
          <p className="mt-2 text-[#0d9488]">
            Areas to focus for the second half of this level
          </p>
          <ul className="mt-6 space-y-2">
            {Object.entries((result.sectionScores as Record<string, number>) ?? {}).map(
              ([skill, score]) => (
                <li
                  key={skill}
                  className={`rounded-lg px-4 py-2 text-sm ${
                    score >= 70 ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-900"
                  }`}
                >
                  <span className="capitalize">{skill}</span>: {Math.round(score)}%
                </li>
              )
            )}
          </ul>
          {weak.length ? (
            <div className="mt-6">
              <p className="font-semibold text-[#0d1b35]">Focus areas:</p>
              <ul className="mt-2 space-y-1">
                {weak.map((w) => (
                  <li key={w}>
                    <Link
                      href={`/dashboard/student/pathway/${levelId}/lesson?week=2&day=monday`}
                      className="text-sm text-[#0d9488] hover:underline"
                    >
                      Review {w} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <Link
            href={`/dashboard/student/pathway/${levelId}`}
            className="mt-8 inline-block rounded-xl bg-[#0d1b35] px-5 py-3 text-sm font-bold text-white"
          >
            Back to level
          </Link>
        </main>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <StudentSidebar activePage="course" />
        <main className="ml-[200px] flex-1 p-6">
          <Link
            href={`/dashboard/student/pathway/${levelId}`}
            className="text-sm text-[#0d9488] hover:underline"
          >
            ← Back
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">Mid-Level Test</h1>
          <p className="mt-2 text-sm text-slate-600">
            45 minutes · Diagnostic only (no pass/fail) · Grammar, Vocabulary, Reading,
            Speaking
          </p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-6 rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-bold text-white"
          >
            Begin diagnostic
          </button>
        </main>
      </div>
    );
  }

  const sections = payload?.sections as Record<string, unknown>;
  const steps = ["grammar", "vocabulary", "reading", "speaking"];
  const current = steps[step];
  const readingSection = sections?.reading as {
    passage?: string;
    questions?: Array<{ id: string; question: string; options: string[]; correctIndex: number }>;
  };
  const items =
    current === "reading"
      ? (readingSection?.questions ?? [])
      : current === "speaking"
        ? (sections?.speaking as unknown[]) ?? []
        : ((sections?.[current] as unknown[]) ?? []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <StudentSidebar activePage="course" />
      <main className="ml-[200px] flex-1 p-6">
        <div className="flex justify-between">
          <h1 className="text-xl font-bold capitalize text-[#0d1b35]">{current}</h1>
          <span className="font-mono font-bold text-[#0d1b35]">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
        </div>
        {current === "reading" && readingSection?.passage ? (
          <ExamHighlightSection
            sectionId={`mid-level-${current}`}
            highlights={highlights}
            onHighlightsChange={setHighlights}
          >
            <div className="mt-4 rounded-xl border bg-white p-4 text-sm leading-relaxed text-slate-700">
              <HighlightableInlineText
                blockId="mid-level-reading-passage"
                text={readingSection.passage}
              />
            </div>
            <div className="mt-6 space-y-3">
              {(items as Array<{ id: string; question: string; options: string[] }>).map(
                (q, i) => (
                  <div key={q.id} className="rounded-xl border bg-white p-4">
                    <p className="text-sm font-medium">
                      <ExamHighlightQuestionText
                        blockId={`${q.id}-stem`}
                        number={i + 1}
                        text={q.question}
                      />
                    </p>
                    <div className="mt-2 flex flex-col gap-2">
                      {q.options?.map((opt, oi) => (
                        <HighlightableRadioOption
                          key={opt}
                          blockId={`${q.id}-opt-${oi}`}
                          name={q.id}
                          label={opt}
                          checked={answers[q.id] === oi}
                          onSelect={() => setAnswers((p) => ({ ...p, [q.id]: oi }))}
                          className="rounded border px-2 py-1 text-xs"
                        />
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </ExamHighlightSection>
        ) : (
          <ExamHighlightSection
            sectionId={`mid-level-${current}`}
            highlights={highlights}
            onHighlightsChange={setHighlights}
            className="mt-6"
          >
            <div className="space-y-3">
              {current !== "speaking"
                ? (items as Array<{ id: string; question: string; options: string[] }>).map(
                    (q, i) => (
                      <div key={q.id} className="rounded-xl border bg-white p-4">
                        <p className="text-sm font-medium">
                          <ExamHighlightQuestionText
                            blockId={`${q.id}-stem`}
                            number={i + 1}
                            text={q.question}
                          />
                        </p>
                        <div className="mt-2 flex flex-col gap-2">
                          {q.options?.map((opt, oi) => (
                            <HighlightableRadioOption
                              key={opt}
                              blockId={`${q.id}-opt-${oi}`}
                              name={q.id}
                              label={opt}
                              checked={answers[q.id] === oi}
                              onSelect={() => setAnswers((p) => ({ ...p, [q.id]: oi }))}
                              className="rounded border px-2 py-1 text-xs"
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )
                : (
                    <div className="rounded-xl border bg-white p-4">
                      <p className="text-sm">
                        <HighlightableInlineText
                          blockId="mid-level-speaking-prompt"
                          text={(items[0] as { prompt?: string })?.prompt ?? ""}
                        />
                      </p>
                      <textarea
                        className="mt-3 w-full rounded-lg border p-3 text-sm"
                        placeholder="Record or type your response..."
                        value={speakingText}
                        onChange={(e) => setSpeakingText(e.target.value)}
                      />
                    </div>
                  )}
            </div>
          </ExamHighlightSection>
        )}
        <div className="mt-8 flex gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              Previous
            </button>
          ) : null}
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-xl bg-[#0d9488] px-4 py-2 text-sm font-bold text-white"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              className="rounded-xl bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35]"
            >
              Finish diagnostic
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
