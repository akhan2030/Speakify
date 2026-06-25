"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageSpinner } from "@/components/StudentSidebar";
import SkillBandHeader from "@/components/ielts/SkillBandHeader";
import SkillTabs from "@/components/ielts/SkillTabs";
import SubmissionHistory from "@/components/ielts/SubmissionHistory";

const BASE = "/dashboard/ielts/student/speaking";

const TABS = [
  { id: "part1", label: "Part 1" },
  { id: "part2", label: "Part 2" },
  { id: "part3", label: "Part 3" },
  { id: "recordings", label: "My Recordings" },
];

function PartPracticeCard({
  part,
  title,
  subtitle,
  minutes,
  href,
  color,
}: {
  part: string;
  title: string;
  subtitle: string;
  minutes: string;
  href: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <p className="text-xs font-semibold uppercase text-[#0d9488]">{part}</p>
      <h3 className="mt-1 text-lg font-bold text-[#0d1b35]">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      <p className="mt-2 text-xs text-slate-400">{minutes}</p>
      <Link
        href={href}
        className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-bold text-white hover:opacity-95"
        style={{ backgroundColor: color }}
      >
        Start recording →
      </Link>
    </div>
  );
}

function SpeakingContent() {
  return (
    <SkillTabs tabs={TABS} defaultTab="part1">
      {(tab) => {
        if (tab === "part1") {
          return (
            <div>
              <PartPracticeCard
                part="Part 1"
                title="Personal questions"
                subtitle="Familiar topics — home, work, hobbies. Record in browser; AI transcribes and scores fluency, vocabulary, grammar, pronunciation."
                minutes="4–5 minutes · Voice recording"
                href={`${BASE}/part1`}
                color="#c9972c"
              />
              <p className="mt-4 rounded-lg bg-[#0d9488]/10 px-4 py-3 text-sm text-[#0d1b35]">
                <strong>Pronunciation tip (Arabic speakers):</strong> Focus on word
                stress and final consonants — e.g. &quot;world&quot;, &quot;developed&quot;.
              </p>
            </div>
          );
        }
        if (tab === "part2") {
          return (
            <PartPracticeCard
              part="Part 2"
              title="Cue card"
              subtitle="1 minute prep, 1–2 minutes speaking. Model answers played after your recording."
              minutes="3–4 minutes · 60 sec prep"
              href={`${BASE}/part2`}
              color="#0d9488"
            />
          );
        }
        if (tab === "part3") {
          return (
            <PartPracticeCard
              part="Part 3"
              title="Discussion"
              subtitle="Abstract questions linked to Part 2. Practice analysing and expressing complex ideas."
              minutes="4–5 minutes · 4 questions"
              href={`${BASE}/part3`}
              color="#7c3aed"
            />
          );
        }
        return (
          <div>
            <SubmissionHistory skill="speaking" />
            <Link
              href={`${BASE}/results`}
              className="mt-4 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
            >
              View detailed feedback history →
            </Link>
          </div>
        );
      }}
    </SkillTabs>
  );
}

export default function IeltsSpeakingPage() {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <SkillBandHeader
        skill="speaking"
        title="Speaking"
        subtitle="Record in browser → AI transcribes → scores fluency, vocab, grammar, pronunciation"
      />
      <Suspense fallback={<PageSpinner />}>
        <SpeakingContent />
      </Suspense>
    </main>
  );
}
