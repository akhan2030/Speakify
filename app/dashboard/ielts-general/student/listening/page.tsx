"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PageSpinner } from "@/components/StudentSidebar";
import GeneralSkillBandHeader from "@/components/ielts-general/GeneralSkillBandHeader";
import SkillTabs from "@/components/ielts/SkillTabs";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";

const BASE = `${GENERAL_STUDENT_BASE}/listening`;

const TABS = [
  { id: "sections", label: "Section Practice" },
  { id: "full", label: "Full Listening" },
  { id: "accents", label: "Accent Exposure" },
  { id: "strategies", label: "Strategies" },
];

const SECTIONS = [
  {
    n: 1,
    title: "Everyday conversation",
    desc: "Social contexts — booking, enquiries, local services. Core GT listening skill.",
    color: "#c9972c",
  },
  {
    n: 2,
    title: "Social monologue",
    desc: "Tours, announcements, facility information — common in migration contexts.",
    color: "#0d9488",
  },
  {
    n: 3,
    title: "Training & education",
    desc: "2–4 speakers discussing courses, workplace training, or study plans.",
    color: "#7c3aed",
  },
  {
    n: 4,
    title: "Talk / lecture",
    desc: "Single speaker on a general topic — note-taking under time pressure.",
    color: "#1d4ed8",
  },
];

const ACCENTS = [
  { label: "British", desc: "Most common in IELTS — practice Section 1 first.", href: `${BASE}/section/1` },
  { label: "Australian", desc: "Often appears in Sections 2 & 3.", href: `${BASE}/section/2` },
  { label: "North American", desc: "Less frequent but tested — build exposure.", href: `${BASE}/section/3` },
];

function ListeningContent() {
  const { data: session } = useSession();
  const studentId = (session?.user as { id?: string })?.id ?? "";
  const [overallBand, setOverallBand] = useState<number | null>(null);

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/listening/tracker?studentId=${encodeURIComponent(studentId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.overallBand != null) setOverallBand(json.overallBand);
      })
      .catch(() => {});
  }, [studentId]);

  return (
    <SkillTabs tabs={TABS} defaultTab="sections">
      {(tab) => {
        if (tab === "sections") {
          return (
            <div className="grid gap-4 sm:grid-cols-2">
              {SECTIONS.map((s) => (
                <div
                  key={s.n}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{ borderLeftWidth: 4, borderLeftColor: s.color }}
                >
                  <p className="text-xs font-bold uppercase" style={{ color: s.color }}>
                    Section {s.n}
                  </p>
                  <h3 className="mt-1 font-bold text-[#0d1b35]">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
                  <p className="mt-2 text-xs text-slate-400">Audio plays once</p>
                  <Link
                    href={`${BASE}/section/${s.n}`}
                    className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-bold text-white hover:opacity-95"
                    style={{ backgroundColor: s.color }}
                  >
                    Practice Section {s.n} →
                  </Link>
                </div>
              ))}
            </div>
          );
        }
        if (tab === "full") {
          return (
            <div className="rounded-xl border border-[#0d1b35] bg-[#0d1b35] p-6 text-white shadow-sm">
              <h3 className="text-xl font-bold">Full 40-question listening</h3>
              <p className="mt-2 text-sm text-slate-300">
                30 minutes · 4 sections · Same format for Academic and General Training
              </p>
              {overallBand != null ? (
                <p className="mt-3 text-sm text-[#c9972c]">
                  Your estimate: Band {overallBand.toFixed(1)}
                </p>
              ) : null}
              <Link
                href={`${BASE}/test`}
                className="mt-5 inline-block rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:opacity-95"
              >
                Start full listening test →
              </Link>
            </div>
          );
        }
        if (tab === "accents") {
          return (
            <div className="grid gap-4 md:grid-cols-3">
              {ACCENTS.map((a) => (
                <div
                  key={a.label}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-bold text-[#0d1b35]">{a.label}</h3>
                  <p className="mt-2 text-sm text-slate-600">{a.desc}</p>
                  <Link
                    href={a.href}
                    className="mt-4 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
                  >
                    Practice →
                  </Link>
                </div>
              ))}
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {[
              {
                title: "Predict before you listen",
                text: "Read questions first — predict answer type (number, name, place) especially in Sections 1–2.",
              },
              {
                title: "Everyday vocabulary",
                text: "GT candidates often miss answers due to spelling of common words (address, accommodation, appointment).",
              },
              {
                title: "Follow signpost words",
                text: "In Section 4, listen for however, finally, the main point to track lecture structure.",
              },
              {
                title: "Transfer carefully",
                text: "You hear each recording once. Write clearly — you may have brief check time between sections.",
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <h3 className="font-bold text-[#0d1b35]">{tip.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{tip.text}</p>
              </div>
            ))}
            <Link
              href={`${BASE}/tracker`}
              className="inline-block text-sm font-semibold text-[#0d9488] hover:underline"
            >
              View listening tracker →
            </Link>
          </div>
        );
      }}
    </SkillTabs>
  );
}

export default function IeltsGeneralListeningPage() {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <div className="mb-4 flex items-start gap-3 rounded-xl bg-[#c9972c]/15 px-4 py-3 text-sm text-[#0d1b35]">
        <span>🎧</span>
        <span>
          General Training uses the <strong>same listening test</strong> as Academic.
          Use headphones — audio plays once per section.
        </span>
      </div>
      <GeneralSkillBandHeader
        skill="listening"
        title="Listening"
        subtitle="Everyday conversations, announcements, and talks — sections 1–4"
      />
      <Suspense fallback={<PageSpinner />}>
        <ListeningContent />
      </Suspense>
    </main>
  );
}
