"use client";

import PathwaySubPageShell from "@/components/pathway/PathwaySubPageShell";
import { usePathwayStudent } from "@/components/pathway/usePathwayStudent";
import { PATHWAY_LEVEL_IDS, PATHWAY_LEVEL_NAMES } from "@/lib/programs/terminology";

export default function CertificatesPage() {
  const ctx = usePathwayStudent();
  const currentIdx = PATHWAY_LEVEL_IDS.indexOf(ctx.levelId);

  const earned = PATHWAY_LEVEL_IDS.slice(0, currentIdx).map((levelId) => ({
    levelId,
    name: PATHWAY_LEVEL_NAMES[levelId],
    date: "Completed",
  }));

  return (
    <PathwaySubPageShell
      title="Certificates"
      subtitle="CEFR level certificates earned on English Pathway."
    >
      {earned.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No certificates yet. Complete your first level graduation assessment to earn one.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {earned.map((cert) => (
            <li
              key={cert.levelId}
              className="rounded-xl border border-[#c9972c]/30 bg-gradient-to-br from-[#fffbeb] to-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
                CEFR Certificate
              </p>
              <p className="mt-2 text-lg font-bold text-[#0d1b35]">{cert.name}</p>
              <p className="mt-1 text-sm text-slate-500">{cert.date}</p>
              <button
                type="button"
                className="mt-4 text-sm font-semibold text-[#0d9488] hover:underline"
              >
                Download PDF →
              </button>
            </li>
          ))}
        </ul>
      )}
    </PathwaySubPageShell>
  );
}
