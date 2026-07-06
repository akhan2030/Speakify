"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageSpinner } from "@/components/StudentSidebar";
import GeneralSkillBandHeader from "@/components/ielts-general/GeneralSkillBandHeader";
import SkillTabs from "@/components/ielts/SkillTabs";
import { GT_READING_SECTIONS } from "@/lib/ielts-general/readingContent";
import { GENERAL_READING_STRATEGIES } from "@/lib/ielts-general/readingSections";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";

const BASE = `${GENERAL_STUDENT_BASE}/reading`;

const TABS = [
  { id: "section-a", label: "Section A" },
  { id: "section-b", label: "Section B" },
  { id: "section-c", label: "Section C" },
  { id: "full", label: "Full GT Reading" },
  { id: "strategies", label: "Strategies" },
];

const SECTION_META = [
  { id: "a" as const, key: "sectionA" as const, href: `${BASE}/practice/section-a`, color: "#c9972c" },
  { id: "b" as const, key: "sectionB" as const, href: `${BASE}/practice/section-b`, color: "#0d9488" },
  { id: "c" as const, key: "sectionC" as const, href: `${BASE}/practice/section-c`, color: "#7c3aed" },
];

function SectionPanel({
  sectionId,
}: {
  sectionId: "a" | "b" | "c";
}) {
  const row = SECTION_META.find((s) => s.id === sectionId)!;
  const meta = GT_READING_SECTIONS[row.key];

  return (
    <div>
      <div
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        style={{ borderLeftWidth: 4, borderLeftColor: row.color }}
      >
        <p className="text-xs font-bold uppercase" style={{ color: row.color }}>
          {meta.label}
        </p>
        <h3 className="mt-1 text-lg font-bold text-[#0d1b35]">{meta.description}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {meta.questionRange} · {meta.timeTarget} · {meta.vocabulary}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Text types: {meta.textTypes.slice(0, 4).join(" · ")}…
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/5 p-5">
        <h4 className="font-bold text-[#0d1b35]">Saudi-context practice</h4>
        <p className="mt-1 text-sm text-slate-600">
          Passages use everyday Saudi settings — {meta.saudiContext.slice(0, 2).join(", ")}.
        </p>
        <Link
          href={row.href}
          className="mt-4 inline-block rounded-xl px-6 py-3 text-sm font-bold text-white hover:opacity-95"
          style={{ backgroundColor: row.color }}
        >
          Start {meta.label} practice →
        </Link>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Question types: {meta.questionTypes.join(", ").replace(/_/g, " ")}
      </p>
    </div>
  );
}

function ReadingContent() {
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
                Sections A, B & C combined — 60-minute timed test with genuine GT passages
                (not Academic content).
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Section A (Q1–14) · Section B (Q15–27) · Section C (Q28–40)
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
        GT Reading uses <strong>everyday and workplace texts</strong> — not Academic long
        passages. Section A = short notices, B = work documents, C = one general-interest
        article.
      </div>
      <Suspense fallback={<PageSpinner />}>
        <ReadingContent />
      </Suspense>
    </main>
  );
}
