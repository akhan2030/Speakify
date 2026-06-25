"use client";

import Link from "next/link";
import PathwaySubPageShell from "@/components/pathway/PathwaySubPageShell";
import { usePathwayStudent } from "@/components/pathway/usePathwayStudent";
import { getContentEngine } from "@/lib/programs";
import type { SkillUnit } from "@/lib/programs/types";
import {
  getProgramTerminology,
  PATHWAY_SKILLS,
  type PathwaySkill,
} from "@/lib/programs/terminology";

const SKILL_LABELS: Record<PathwaySkill, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
  writing: "Writing",
  pronunciation: "Pronunciation",
};

function WeekTaskRow({ unit }: { unit: SkillUnit }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
      <span className="text-[#0d1b35]">{unit.title}</span>
      <span className="text-xs text-slate-500">{unit.minutes} min</span>
    </li>
  );
}

export default function WeeklyPlanPage() {
  const ctx = usePathwayStudent();
  const terms = getProgramTerminology("pathway");

  return (
    <PathwaySubPageShell
      title="Weekly Plan"
      subtitle={`Week ${ctx.week} study plan for ${ctx.levelName} — general English, not exam format.`}
    >
      <div className="space-y-6">
        {PATHWAY_SKILLS.map((skill) => {
          const engine = getContentEngine("english_pathway");
          const units = engine.getSkillUnits(ctx.levelId, skill, ctx.week).filter(
            (u) => u.week === ctx.week
          );
          if (units.length === 0) return null;
          return (
            <section
              key={skill}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-[#0d1b35]">{SKILL_LABELS[skill]}</h2>
                <Link
                  href={`/dashboard/pathway/student/${skill}`}
                  className="text-xs font-semibold text-[#0d9488] hover:underline"
                >
                  Open skill →
                </Link>
              </div>
              <ul className="mt-3 space-y-2">
                {units.map((u) => (
                  <WeekTaskRow key={u.id} unit={u} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="mt-6 rounded-xl border border-[#0d9488]/30 bg-[#f0fdf4] p-4">
        <h2 className="font-bold text-[#0d1b35]">{terms.progressCheckLabel}</h2>
        <p className="mt-1 text-sm text-slate-600">
          End-of-week review covering vocabulary, grammar, and skills from Week {ctx.week}.
        </p>
        <Link
          href="/dashboard/pathway/student/progress-check"
          className="mt-3 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
        >
          Start progress check →
        </Link>
      </section>
    </PathwaySubPageShell>
  );
}
