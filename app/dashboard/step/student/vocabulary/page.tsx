"use client";

import Link from "next/link";
import { STEP_ROUTES } from "@/lib/step/paths";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";

const TOPICS = [
  "Academic word families (UNESCO, Vision 2030)",
  "Reading inference vocabulary",
  "Structure collocations",
  "Word meaning in context drills",
];

export default function StepVocabularyPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
        Vocabulary Builder
      </h1>
      <p className="text-sm text-slate-600">
        Academic vocabulary for STEP Reading (40%) and Structure (30%). No separate
        speaking or writing vocabulary — STEP is MCQ-only.
      </p>
      <ul className="space-y-3">
        {TOPICS.map((t) => (
          <li key={t} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            {t}
          </li>
        ))}
      </ul>
      <Link
        href={STEP_ROUTES.practice("reading")}
        className="inline-block rounded-xl px-4 py-2 text-sm font-semibold text-[#0d1b35]"
        style={{ backgroundColor: GOLD }}
      >
        Practice reading vocabulary →
      </Link>
    </div>
  );
}
