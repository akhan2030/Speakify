"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SkillRadarChart from "@/components/mock-test/SkillRadarChart";
import MockCompletionCertificate, {
  printMockCertificate,
} from "@/components/mock-test/MockCompletionCertificate";
import {
  buildMockCertificateFromReport,
  readMockSessionMeta,
} from "@/lib/mock-test/certificate";
import type { MockTestFullReport, SectionBreakdown } from "@/lib/mock-test/reportTypes";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

function TrophyIcon() {
  return (
    <svg className="h-10 w-10 text-[#c9972c]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 3h12v2a6 6 0 01-4 5.66V14h3v2H7v-2h3v-3.34A6 6 0 016 5V3zm2 0v2a4 4 0 003 3.87V5H8zm8 0h-3v3.87A4 4 0 0016 5V3zM5 5H3v1a4 4 0 004 3.46V5zm16 0h-2v3.46A4 4 0 0021 6V5h-2zM8 18h8v3H8v-3z" />
    </svg>
  );
}

function BreakdownList({ items }: { items: SectionBreakdown[] }) {
  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex justify-between text-xs">
          <span className="text-slate-500">{item.label}</span>
          <span className="font-semibold text-[#0d1b35]">
            {item.correct}/{item.total}
            {item.band != null && (
              <span className="ml-1 text-[#c9972c]">({item.band.toFixed(1)})</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function CriteriaRow({
  label,
  criteria,
}: {
  label: string;
  criteria: { taskAchievement: number; coherenceCohesion: number; lexicalResource: number; grammaticalRange: number };
}) {
  const items = [
    { k: label === "Task 1" ? "TA" : "TR", v: criteria.taskAchievement },
    { k: "CC", v: criteria.coherenceCohesion },
    { k: "LR", v: criteria.lexicalResource },
    { k: "GRA", v: criteria.grammaticalRange },
  ];
  return (
    <div className="mt-2">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {items.map((c) => (
          <span
            key={c.k}
            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs"
          >
            {c.k}{" "}
            <strong className="text-[#c9972c]">{c.v.toFixed(1)}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function HighlightedEssay({
  text,
  highlights,
}: {
  text: string;
  highlights: { phrase: string; type: "good" | "weak" }[];
}) {
  let parts: React.ReactNode[] = [text];
  for (const h of highlights) {
    if (!h.phrase.trim()) continue;
    const next: React.ReactNode[] = [];
    for (const part of parts) {
      if (typeof part !== "string") {
        next.push(part);
        continue;
      }
      const idx = part.toLowerCase().indexOf(h.phrase.toLowerCase());
      if (idx === -1) {
        next.push(part);
        continue;
      }
      const before = part.slice(0, idx);
      const match = part.slice(idx, idx + h.phrase.length);
      const after = part.slice(idx + h.phrase.length);
      if (before) next.push(before);
      next.push(
        <mark
          key={`${h.phrase}-${idx}`}
          className={
            h.type === "good"
              ? "rounded bg-emerald-100 px-0.5 text-emerald-900"
              : "rounded bg-red-100 px-0.5 text-red-900"
          }
        >
          {match}
        </mark>
      );
      if (after) next.push(after);
    }
    parts = next;
  }
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{parts}</p>
  );
}

function TranscriptHighlights({
  text,
  strong,
  weak,
}: {
  text: string;
  strong: string[];
  weak: string[];
}) {
  let parts: React.ReactNode[] = [text];
  const apply = (phrases: string[], cls: string) => {
    for (const phrase of phrases) {
      if (!phrase.trim()) continue;
      const next: React.ReactNode[] = [];
      for (const part of parts) {
        if (typeof part !== "string") {
          next.push(part);
          continue;
        }
        const idx = part.toLowerCase().indexOf(phrase.toLowerCase());
        if (idx === -1) {
          next.push(part);
          continue;
        }
        const before = part.slice(0, idx);
        const match = part.slice(idx, idx + phrase.length);
        const after = part.slice(idx + phrase.length);
        if (before) next.push(before);
        next.push(
          <mark key={`${cls}-${phrase}-${idx}`} className={`rounded px-0.5 ${cls}`}>
            {match}
          </mark>
        );
        if (after) next.push(after);
      }
      parts = next;
    }
  };
  apply(strong, "bg-emerald-100 text-emerald-900");
  apply(weak, "bg-red-100 text-red-900");
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{parts}</p>
  );
}

function SkillScoreCard({
  title,
  band,
  children,
}: {
  title: string;
  band: number;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-[#0d1b35]">{title}</h3>
        <div className="text-right">
          <p className="text-3xl font-black text-[#c9972c]">{band.toFixed(1)}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Band</p>
        </div>
      </div>
      {children}
    </article>
  );
}

type Props = {
  report: MockTestFullReport;
  attemptId: string;
};

export default function MockResultsReport({ report, attemptId }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [task1Open, setTask1Open] = useState(false);
  const [task2Open, setTask2Open] = useState(false);
  const [sessionMeta, setSessionMeta] = useState<ReturnType<typeof readMockSessionMeta>>(
    {}
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`mock_test_${attemptId}`);
      if (!raw) return;
      const payload = JSON.parse(raw) as Record<string, unknown>;
      setSessionMeta(readMockSessionMeta(payload));
    } catch {
      setSessionMeta({});
    }
  }, [attemptId]);

  const certificateData = useMemo(
    () =>
      buildMockCertificateFromReport(report, {
        examReference: sessionMeta.examReference,
        examDateTime: sessionMeta.examDateTime,
        mockNumber: sessionMeta.mockNumber,
        programme:
          sessionMeta.examVariant === "general" ? "ielts_general" : "ielts_academic",
      }),
    [report, sessionMeta]
  );
  const whatsappRaw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "966556004488";
  const waBase = `https://wa.me/${whatsappRaw.replace(/\D/g, "")}`;
  const consultHref = `${waBase}?text=${encodeURIComponent(
    `Hi Speakify, I'd like to book a free consultation about my IELTS mock test results (Attempt ${attemptId}). My predicted band is ${report.overallBand}.`
  )}`;
  const reserveHref = `${waBase}?text=${encodeURIComponent(
    `Hi Speakify, I'd like to reserve a spot in the IELTS Accelerator programme. My mock test band is ${report.overallBand}.`
  )}`;
  const chatHref = `${waBase}?text=${encodeURIComponent(
    "Hi Speakify, I have questions about my IELTS mock test report."
  )}`;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const { skills, bandPrediction } = report;
  const completedDate = new Date(report.completedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mock-results-print min-h-screen bg-[#f8f9fa]">
      <div ref={printRef}>
        {/* Hero */}
        <header
          className="px-4 py-12 text-white sm:px-6 sm:py-16"
          style={{ backgroundColor: NAVY }}
        >
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c9972c]">
              Speakify IELTS Academic
            </p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Your IELTS Mock Exam Report
            </h1>
            <p className="mt-3 text-slate-300">
              {report.studentName} · Completed {completedDate}
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <TrophyIcon />
              <p className="text-7xl font-black text-[#c9972c] sm:text-8xl">
                {report.overallBand.toFixed(1)}
              </p>
            </div>
            <p className="mt-1 text-sm text-slate-400">Overall predicted band</p>

            <p className="mt-5 text-lg font-semibold" style={{ color: TEAL }}>
              Prediction Confidence: {report.confidencePercent}%
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Expected real IELTS range: {report.predictedRange.low.toFixed(1)} –{" "}
              {report.predictedRange.high.toFixed(1)}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <span
                className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-white/20 text-center"
                style={{ backgroundColor: NAVY }}
              >
                <span className="text-lg font-black text-[#c9972c]">
                  {report.cefr.level}
                </span>
              </span>
              <span className="text-left text-sm text-slate-300">
                CEFR {report.cefr.level}
                <br />
                <span className="font-semibold text-white">{report.cefr.label}</span>
              </span>
              <span className="rounded-full border border-[#c9972c]/40 bg-[#c9972c]/15 px-4 py-2 text-sm font-bold text-[#c9972c]">
                ✓ Reviewed by Speakify IELTS Examiner
              </span>
            </div>

            <div className="mx-auto mt-10 max-w-sm">
              <SkillRadarChart data={report.radar} />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <section className="mb-12 print:break-before-page">
            <h2 className="mb-4 text-2xl font-bold text-[#0d1b35] print:hidden">
              Your IELTS Test Report Form
            </h2>
            <p className="mb-6 text-sm text-slate-600 print:hidden">
              Official-style mock certificate with CEFR levels — download and keep for your
              records.
            </p>
            <MockCompletionCertificate
              data={certificateData}
              onPrint={printMockCertificate}
            />
          </section>

          {/* Score breakdown grid */}
          <section>
            <h2 className="text-2xl font-bold text-[#0d1b35]">Score breakdown</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <SkillScoreCard title="Listening" band={skills.listening.band}>
                <p className="mt-3 text-sm text-slate-600">
                  Correct answers:{" "}
                  <strong>
                    {skills.listening.correct} / {skills.listening.total}
                  </strong>
                </p>
                <BreakdownList items={skills.listening.sectionBreakdown} />
                <p className="mt-3 text-xs text-slate-500">
                  Strongest: {skills.listening.strongestQuestionType} · Weakest:{" "}
                  {skills.listening.weakestQuestionType}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {skills.listening.meaning}
                </p>
              </SkillScoreCard>

              <SkillScoreCard title="Reading" band={skills.reading.band}>
                <p className="mt-3 text-sm text-slate-600">
                  Correct answers:{" "}
                  <strong>
                    {skills.reading.correct} / {skills.reading.total}
                  </strong>{" "}
                  · Accuracy: {skills.reading.accuracy}%
                </p>
                <BreakdownList items={skills.reading.passageBreakdown} />
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {skills.reading.meaning}
                </p>
              </SkillScoreCard>

              <SkillScoreCard title="Writing" band={skills.writing.band}>
                <div className="mt-3 flex gap-4 text-sm">
                  <span>
                    Task 1:{" "}
                    <strong className="text-[#c9972c]">
                      {skills.writing.task1Band.toFixed(1)}
                    </strong>
                  </span>
                  <span>
                    Task 2:{" "}
                    <strong className="text-[#c9972c]">
                      {skills.writing.task2Band.toFixed(1)}
                    </strong>
                  </span>
                </div>
                <CriteriaRow label="Task 1" criteria={skills.writing.task1Criteria} />
                <CriteriaRow label="Task 2" criteria={skills.writing.task2Criteria} />

                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => setTask1Open((o) => !o)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-bold text-[#0d1b35]"
                  >
                    {task1Open ? "▼" : "▶"} Task 1 essay
                  </button>
                  {task1Open && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                      <HighlightedEssay
                        text={skills.writing.task1Text}
                        highlights={skills.writing.writingHighlights}
                      />
                      <p className="mt-3 text-xs text-slate-500">
                        {skills.writing.task1Feedback}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setTask2Open((o) => !o)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-bold text-[#0d1b35]"
                  >
                    {task2Open ? "▼" : "▶"} Task 2 essay
                  </button>
                  {task2Open && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                      <HighlightedEssay
                        text={skills.writing.task2Text}
                        highlights={skills.writing.writingHighlights}
                      />
                      <p className="mt-3 text-xs italic text-slate-500">
                        {skills.writing.annotatedFeedback}
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {skills.writing.meaning}
                </p>
              </SkillScoreCard>

              <SkillScoreCard title="Speaking" band={skills.speaking.band}>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {[
                    { k: "FC", v: skills.speaking.fluency },
                    { k: "LR", v: skills.speaking.lexicalResource },
                    { k: "GRA", v: skills.speaking.grammaticalRange },
                    { k: "P", v: skills.speaking.pronunciation },
                  ].map((c) => (
                    <span
                      key={c.k}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1"
                    >
                      {c.k}{" "}
                      <strong className="text-[#c9972c]">{c.v.toFixed(1)}</strong>
                    </span>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  {skills.speaking.partTranscripts.map((p) => (
                    <div
                      key={p.label}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <p className="text-xs font-bold text-[#c9972c]">{p.label}</p>
                      <TranscriptHighlights
                        text={p.text}
                        strong={skills.speaking.strongPhrases}
                        weak={skills.speaking.weakPhrases}
                      />
                    </div>
                  ))}
                  {!skills.speaking.partTranscripts.length && (
                    <TranscriptHighlights
                      text={skills.speaking.transcript}
                      strong={skills.speaking.strongPhrases}
                      weak={skills.speaking.weakPhrases}
                    />
                  )}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {skills.speaking.meaning}
                </p>
              </SkillScoreCard>
            </div>
          </section>

          {/* Examiner report */}
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-[#0d1b35]">What your examiner says</h2>
            <p className="mt-1 text-sm font-semibold text-[#c9972c]">
              Human-reviewed assessment
            </p>
            <div className="mt-6 space-y-6">
              {(["listening", "reading", "writing", "speaking"] as const).map((key) => (
                <div
                  key={key}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="font-bold capitalize text-[#0d1b35]">{key}</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {skills[key].examinerReport}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold" style={{ color: TEAL }}>
                  Vocabulary analysis
                </h3>
                <p className="mt-3 text-xs font-bold uppercase text-slate-400">
                  Strong words used
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {report.vocabulary.strongWords.map((w) => (
                    <span
                      key={w}
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800"
                    >
                      {w}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs font-bold uppercase text-slate-400">
                  Weak patterns
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {report.vocabulary.weakPatterns.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-orange-600">Grammar analysis</h3>
                <p className="mt-3 text-xs font-bold uppercase text-slate-400">
                  Used correctly
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {report.grammar.structuresUsedWell.map((s) => (
                    <li key={s}>✓ {s}</li>
                  ))}
                </ul>
                <p className="mt-4 text-xs font-bold uppercase text-slate-400">
                  Error patterns
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {report.grammar.errorPatterns.map((e) => (
                    <li key={e}>✗ {e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Band prediction */}
          <section
            className="mt-14 rounded-2xl p-8 text-white shadow-lg"
            style={{ backgroundColor: NAVY }}
          >
            <h2 className="text-2xl font-bold">
              Your path to Band {bandPrediction.target.toFixed(1)}
            </h2>
            <p className="mt-3 text-slate-300">
              Current:{" "}
              <strong className="text-[#c9972c]">
                {bandPrediction.current.toFixed(1)}
              </strong>{" "}
              → Target:{" "}
              <strong className="text-white">{bandPrediction.target.toFixed(1)}</strong>{" "}
              — Gap:{" "}
              <strong className="text-[#c9972c]">
                {bandPrediction.gap.toFixed(1)} bands
              </strong>
            </p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#c9972c] transition-all"
                style={{ width: `${bandPrediction.progressPercent}%` }}
              />
            </div>
            <p className="mt-4 text-sm" style={{ color: TEAL }}>
              Probability of achieving {bandPrediction.target.toFixed(1)} in official
              IELTS: <strong>{bandPrediction.probabilityPercent}%</strong>
            </p>
            <p className="mt-3 text-sm text-slate-300">{bandPrediction.message}</p>
          </section>

          {/* Improvement plan */}
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-[#0d1b35]">
              Your 4-week improvement plan
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Based on weakest areas: {report.weakAreas.join(", ")}
            </p>
            <div className="mt-6 space-y-4">
              {report.improvementPlan.map((week) => (
                <div
                  key={week.week}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-[#0d1b35]"
                      style={{ backgroundColor: GOLD }}
                    >
                      W{week.week}
                    </span>
                    <div>
                      <p className="font-bold text-[#0d1b35]">{week.phase}</p>
                      <p className="text-sm text-slate-500">{week.focus}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {week.resources.map((r) => (
                      <Link
                        key={r.href}
                        href={r.href}
                        className="rounded-lg border border-[#c9972c]/40 px-3 py-1.5 text-xs font-semibold text-[#c9972c] hover:bg-[#c9972c]/10"
                      >
                        {r.label} →
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Program recommendations */}
          <section className="mt-14 grid gap-6 lg:grid-cols-2">
            <div
              className="rounded-2xl p-8 text-white shadow-lg"
              style={{ backgroundColor: NAVY }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-[#c9972c]">
                Featured programme
              </p>
              <h3 className="mt-2 text-2xl font-bold">IELTS Accelerator — 3,800 SAR</h3>
              <p className="mt-2 text-sm text-slate-300">
                From Band {bandPrediction.current.toFixed(1)} to{" "}
                {bandPrediction.target.toFixed(1)} in 30 days — or we coach you again,
                free
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                {[
                  "Daily live sessions",
                  "AI + human feedback",
                  "Speaking mock 3× per week",
                  "Full mock test Week 4",
                  "94% hit target band",
                  "Designed for Saudi students",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[#c9972c]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <blockquote className="mt-5 border-l-2 border-[#c9972c] pl-4 text-sm italic text-slate-300">
                &ldquo;I went from 5.5 to 7.0 in 28 days&rdquo; — Fatima Al-Zahrani, Riyadh
              </blockquote>
              <a
                href={reserveHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block w-full rounded-xl py-3 text-center text-sm font-bold text-[#0d1b35] print:hidden"
                style={{ backgroundColor: GOLD }}
              >
                Reserve My Spot
              </a>
            </div>

            <div className="rounded-2xl border-2 bg-white p-8 shadow-sm" style={{ borderColor: GOLD }}>
              <h3 className="text-xl font-bold text-[#0d1b35]">
                Writing Skills Course — 925 SAR
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                8 hours of intensive writing coaching
              </p>
              <p className="mt-4 text-sm text-slate-500">
                Task 1 reports + Task 2 essays with examiner feedback on structure,
                cohesion, and lexical range.
              </p>
              <a
                href={consultHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block w-full rounded-xl border-2 py-3 text-center text-sm font-bold text-[#0d1b35] print:hidden"
                style={{ borderColor: GOLD }}
              >
                Enrol Now
              </a>
            </div>
          </section>

          {/* Footer actions */}
          <section className="mt-14 flex flex-col flex-wrap items-center justify-center gap-3 border-t border-slate-200 pt-10 print:hidden sm:flex-row">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-[#0d1b35] hover:bg-white"
            >
              Download Full Report as PDF
            </button>
            <Link
              href="/mock-test/exam"
              className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-[#0d1b35] hover:bg-white"
            >
              Take Another Mock Test
            </Link>
            <a
              href={chatHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white hover:bg-[#20bd5a]"
            >
              Chat with our team
            </a>
            <a
              href={consultHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl px-6 py-3 text-sm font-bold text-[#0d1b35]"
              style={{ backgroundColor: GOLD }}
            >
              Book a free consultation
            </a>
          </section>

          <p className="mt-8 text-center text-[10px] text-slate-400 print:mt-4">
            Report generated{" "}
            {new Date(report.generatedAt).toLocaleString("en-GB")} · Attempt {attemptId}
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .mock-results-print header {
            background: #0d1b35 !important;
            color: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #mock-completion-certificate,
          #mock-completion-certificate * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .mock-certificate-wrap {
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
