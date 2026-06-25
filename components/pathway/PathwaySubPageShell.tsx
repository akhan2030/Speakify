"use client";

import Link from "next/link";
import { usePathwayStudent } from "@/components/pathway/usePathwayStudent";
import { getProgramTerminology, PATHWAY_LEVEL_NAMES, PATHWAY_LEVEL_IDS } from "@/lib/programs/terminology";

export default function PathwaySubPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const ctx = usePathwayStudent();
  const terms = getProgramTerminology("pathway");

  return (
    <div className="max-w-4xl">
      <Link
        href="/dashboard/pathway/student"
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← Dashboard
      </Link>
      <header className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
          {terms.programName} · {ctx.levelCode} · Week {ctx.week}/{ctx.weekCount}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#0d1b35]">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        ) : null}
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function PathwayLevelMap() {
  const ctx = usePathwayStudent();

  return (
    <ul className="space-y-2">
      {PATHWAY_LEVEL_IDS.map((levelId) => {
        const isCurrent = levelId === ctx.levelId;
        const idx = PATHWAY_LEVEL_IDS.indexOf(levelId);
        const currentIdx = PATHWAY_LEVEL_IDS.indexOf(ctx.levelId);
        const isCompleted = idx < currentIdx;
        return (
          <li
            key={levelId}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              isCurrent
                ? "border-[#c9972c] bg-[#fffbeb]"
                : isCompleted
                  ? "border-green-200 bg-green-50"
                  : "border-slate-200 bg-white"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[#0d1b35]">
              <span>{isCompleted ? "✅" : isCurrent ? "🔵" : "🔒"}</span>
              {PATHWAY_LEVEL_NAMES[levelId]}
            </span>
            {isCurrent ? (
              <span className="text-xs font-semibold text-[#c9972c]">
                Week {ctx.week}/{ctx.weekCount}
              </span>
            ) : isCompleted ? (
              <span className="text-xs font-semibold text-green-700">Completed</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
