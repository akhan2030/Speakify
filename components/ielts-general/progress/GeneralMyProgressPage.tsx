"use client";

import Link from "next/link";
import GeneralIeltsReadinessMeter from "@/components/ielts-general/GeneralIeltsReadinessMeter";
import GeneralSkillBandHeader from "@/components/ielts-general/GeneralSkillBandHeader";

const BASE = "/dashboard/ielts-general/student";

export default function GeneralMyProgressPage() {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <Link
        href={BASE}
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← Dashboard
      </Link>

      <GeneralSkillBandHeader
        skill="reading"
        title="My Progress"
        subtitle="General Training readiness — letters, GT reading, listening & speaking"
      />
      <GeneralIeltsReadinessMeter />
    </main>
  );
}
