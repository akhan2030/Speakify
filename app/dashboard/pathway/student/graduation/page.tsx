"use client";

import Link from "next/link";
import PathwaySubPageShell from "@/components/pathway/PathwaySubPageShell";
import { usePathwayStudent } from "@/components/pathway/usePathwayStudent";
import { getProgramTerminology } from "@/lib/programs/terminology";

export default function GraduationPage() {
  const ctx = usePathwayStudent();
  const terms = getProgramTerminology("pathway");

  const sections = [
    { name: "Vocabulary & Grammar", weight: "25%", duration: "20 min" },
    { name: "Reading Comprehension", weight: "20%", duration: "25 min" },
    { name: "Listening", weight: "20%", duration: "20 min" },
    { name: "Writing Task", weight: "20%", duration: "30 min" },
    { name: "Speaking Recording", weight: "15%", duration: "15 min" },
  ];

  return (
    <PathwaySubPageShell
      title={terms.assessmentLabel}
      subtitle={`End-of-level assessment for ${ctx.levelName}. Pass score: 70%.`}
    >
      <div className="rounded-xl border border-[#c9972c]/40 bg-[#fffbeb] p-5">
        <p className="text-sm font-semibold text-[#c9972c]">{terms.readinessLabel}</p>
        <p className="mt-2 text-4xl font-bold text-[#0d9488]">
          {ctx.graduationReadiness}%
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {ctx.graduationReadiness >= 70
            ? "You meet the minimum readiness threshold for this level."
            : "Complete more weekly units to raise your readiness before attempting the assessment."}
        </p>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-[#0d1b35]">Assessment structure</h2>
        <ul className="mt-4 space-y-3">
          {sections.map((s) => (
            <li
              key={s.name}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm"
            >
              <span className="font-medium text-[#0d1b35]">{s.name}</span>
              <span className="text-slate-500">
                {s.weight} · {s.duration}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={ctx.graduationReadiness < 70}
          className="rounded-lg bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ctx.graduationReadiness >= 70 ? "Start assessment" : "Locked — raise readiness"}
        </button>
        <Link
          href="/dashboard/pathway/student/weekly-plan"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
        >
          Back to weekly plan
        </Link>
      </div>
    </PathwaySubPageShell>
  );
}
