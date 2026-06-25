"use client";

import Link from "next/link";
import PathwaySubPageShell, { PathwayLevelMap } from "@/components/pathway/PathwaySubPageShell";
import { usePathwayStudent } from "@/components/pathway/usePathwayStudent";
import { getProgramTerminology } from "@/lib/programs/terminology";

export default function MyPathwayPage() {
  const ctx = usePathwayStudent();
  const terms = getProgramTerminology("pathway");

  return (
    <PathwaySubPageShell
      title={terms.trackLabel}
      subtitle={`Your CEFR journey from A1.1 to C1.2. You are currently at ${ctx.levelName}.`}
    >
      <PathwayLevelMap />
      <p className="mt-6 text-sm text-slate-600">
        Complete all weekly units across seven language skills, then pass the{" "}
        {terms.assessmentLabel.toLowerCase()} to unlock the next level.
      </p>
      <Link
        href="/dashboard/pathway/student/weekly-plan"
        className="mt-4 inline-block rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35]"
      >
        View weekly plan →
      </Link>
    </PathwaySubPageShell>
  );
}
