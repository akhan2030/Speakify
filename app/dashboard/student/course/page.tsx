"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SpeakifyWay from "@/components/SpeakifyWay";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";

type LevelRow = {
  slug: string;
  code: string;
  name: string;
  description: string;
  weekCount: number;
  targetBands?: string | null;
  enrolled: boolean;
  progress: number;
};

export default function CourseHubPage() {
  const [programTracks, setProgramTracks] = useState<LevelRow[]>([]);
  const [cefrLevels, setCefrLevels] = useState<LevelRow[]>([]);
  const [active, setActive] = useState<{
    slug: string;
    code: string;
    name: string;
    trackType?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/course/levels")
      .then((r) => r.json())
      .then((d) => {
        setProgramTracks(d.programTracks ?? d.levels ?? []);
        setCefrLevels(d.cefrLevels ?? []);
        setActive(d.activeEnrollment ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  function TrackCard({ level }: { level: LevelRow }) {
    return (
      <Link
        href={`/dashboard/student/course/${level.slug}`}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md hover:ring-2 hover:ring-[#c9972c]/30"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-[#0d1b35] px-3 py-1 text-xs font-bold text-[#c9972c]">
            {level.code}
          </span>
          {level.enrolled ? (
            <span className="text-[10px] font-semibold uppercase text-[#0d9488]">Enrolled</span>
          ) : null}
        </div>
        <h2 className="mt-3 font-bold text-[#0d1b35]">{level.name}</h2>
        <p className="mt-2 line-clamp-2 text-xs text-slate-500">{level.description}</p>
        <p className="mt-3 text-xs text-slate-400">
          {level.weekCount} weekly units · 70/30 progression
          {level.targetBands ? ` · ${level.targetBands}` : ""}
        </p>
        {level.progress > 0 ? (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-[#c9972c]" style={{ width: `${level.progress}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">{level.progress}% complete</p>
          </div>
        ) : null}
      </Link>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="course" />

      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50 p-6">
        <SpeakifyWay variant="banner" className="mb-8" />

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
            Speakify Course Path
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0d1b35]">IELTS Program Tracks</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Placement test matches you to Foundation (6 weeks), Plus (6 weeks), or Elite (4 weeks).
            Each track uses 70/30 review-to-new progression with mid-level and graduation exams.
          </p>
        </div>

        {active ? (
          <Link
            href={`/dashboard/student/course/${active.slug}`}
            className="mb-8 block rounded-2xl border-2 border-[#0d9488]/40 bg-[#0d9488]/10 p-5 hover:bg-[#0d9488]/15"
          >
            <p className="text-xs font-semibold uppercase text-[#0d9488]">Continue learning</p>
            <p className="mt-1 text-lg font-bold text-[#0d1b35]">
              {active.code} — {active.name}
            </p>
          </Link>
        ) : null}

        <section>
          <h2 className="text-lg font-bold text-[#0d1b35]">Recommended program tracks</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programTracks.map((level) => (
              <TrackCard key={level.slug} level={level} />
            ))}
          </div>
        </section>

        {cefrLevels.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-lg font-bold text-[#0d1b35]">CEFR sub-levels (A1.1 → C1.2)</h2>
            <p className="mt-1 text-sm text-slate-500">
              Optional granular pathway — 4 weeks per sub-level.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cefrLevels.map((level) => (
                <TrackCard key={level.slug} level={level} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
