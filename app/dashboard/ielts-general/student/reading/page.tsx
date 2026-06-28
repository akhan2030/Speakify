"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { PageSpinner } from "@/components/StudentSidebar";
import GeneralSkillBandHeader from "@/components/ielts-general/GeneralSkillBandHeader";
import SkillTabs from "@/components/ielts/SkillTabs";
import {
  GENERAL_READING_SECTIONS,
  GENERAL_READING_STRATEGIES,
} from "@/lib/ielts-general/readingSections";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";

const BASE = `${GENERAL_STUDENT_BASE}/reading`;

const TABS = [
  { id: "section-a", label: "Section A" },
  { id: "section-b", label: "Section B" },
  { id: "section-c", label: "Section C" },
  { id: "full", label: "Full GT Reading" },
  { id: "strategies", label: "Strategies" },
];

type TrackerRow = {
  question_type: string;
  attempts: number;
  accuracy: number | null;
  estimated_band: number | null;
};

function SectionPanel({ sectionId }: { sectionId: "a" | "b" | "c" }) {
  const section = GENERAL_READING_SECTIONS.find((s) => s.id === sectionId)!;

  return (
    <div>
      <div
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        style={{ borderLeftWidth: 4, borderLeftColor: section.color }}
      >
        <p className="text-xs font-bold uppercase" style={{ color: section.color }}>
          {section.label}
        </p>
        <h3 className="mt-1 text-lg font-bold text-[#0d1b35]">{section.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{section.description}</p>
        <p className="mt-3 text-xs text-slate-500">
          Text types: {section.textTypes.join(" · ")}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {section.questionTypes.map((drill) => (
          <Link
            key={drill.slug}
            href={`${BASE}/practice/${drill.slug}?section=${sectionId}`}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <h4 className="font-bold text-[#0d1b35]">{drill.label}</h4>
            <p className="mt-1 text-xs text-slate-500">~{drill.minutes} min</p>
            <p className="mt-2 text-xs font-semibold text-[#0d9488]">Start drill →</p>
          </Link>
        ))}
      </div>

      <Link
        href={`${BASE}/practice`}
        className="mt-6 inline-block text-sm font-semibold text-[#c9972c] hover:underline"
      >
        Browse all question types →
      </Link>
    </div>
  );
}

function ReadingContent() {
  const [rows, setRows] = useState<TrackerRow[]>([]);

  useEffect(() => {
    fetch("/api/reading/tracker")
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json?.rows)) setRows(json.rows);
      })
      .catch(() => {});
  }, []);

  return (
    <SkillTabs tabs={TABS} defaultTab="section-a">
      {(tab) => {
        if (tab === "section-a") return <SectionPanel sectionId="a" />;
        if (tab === "section-b") return <SectionPanel sectionId="b" />;
        if (tab === "section-c") return <SectionPanel sectionId="c" />;
        if (tab === "full") {
          return (
            <div className="rounded-xl border border-[#0d1b35] bg-[#0d1b35] p-6 text-white shadow-sm">
              <h3 className="text-xl font-bold">Full General Training reading</h3>
              <p className="mt-2 text-sm text-slate-300">
                Sections A, B & C combined — timed practice with real exam pacing (~60
                minutes).
              </p>
              <Link
                href={`${BASE}/test`}
                className="mt-5 inline-block rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:opacity-95"
              >
                Start timed GT reading →
              </Link>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {GENERAL_READING_STRATEGIES.map((tip) => (
              <div
                key={tip.title}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <h3 className="font-bold text-[#0d1b35]">{tip.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{tip.text}</p>
              </div>
            ))}
            {rows.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[#0d1b35]">Your question-type accuracy</h3>
                <div className="mt-4 space-y-3">
                  {[...rows]
                    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
                    .slice(0, 5)
                    .map((row) => {
                      const pct =
                        row.accuracy != null
                          ? Math.round(
                              (row.accuracy <= 1 ? row.accuracy * 100 : row.accuracy) * 10
                            ) / 10
                          : 0;
                      return (
                        <div key={row.question_type}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-slate-700">{row.question_type}</span>
                            <span className="text-slate-500">{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#c9972c]"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : null}
            <Link
              href={`${BASE}/strategies`}
              className="inline-block text-sm font-semibold text-[#0d9488] hover:underline"
            >
              Open full strategies library →
            </Link>
          </div>
        );
      }}
    </SkillTabs>
  );
}

export default function IeltsGeneralReadingPage() {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <GeneralSkillBandHeader
        skill="reading"
        title="Reading — Sections A, B & C"
        subtitle="General Training reading — notices, workplace texts, and extended passages"
      />
      <div className="mb-4 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/5 px-4 py-3 text-sm text-[#0d1b35]">
        GT Reading has <strong>three sections</strong> (not Academic&apos;s three long
        passages). Section A = short everyday texts, B = workplace, C = one long general
        passage.
      </div>
      <Suspense fallback={<PageSpinner />}>
        <ReadingContent />
      </Suspense>
    </main>
  );
}
