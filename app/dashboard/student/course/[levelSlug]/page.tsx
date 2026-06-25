"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import Progress7030Bar from "@/components/course/Progress7030Bar";
import CourseCertificate from "@/components/course/CourseCertificate";

type LevelData = {
  level: {
    slug: string;
    code: string;
    name: string;
    description: string;
    weekCount: number;
  };
  enrolled: boolean;
  midLevelPassed: boolean;
  weeks: Array<{
    id: string;
    week_number: number;
    title: string;
    locked?: boolean;
    progress7030: {
      reviewPercent: number;
      newUnlocked: boolean;
      reviewCompleted: number;
      reviewTotal: number;
      newCompleted: number;
      newTotal: number;
      overallPercent: number;
    };
  }>;
  assessments: Array<{
    id: string;
    assessment_type: string;
    title: string;
    description: string;
    pass_score: number;
    passed: boolean;
    score: number | null;
    href: string;
  }>;
  certificate: { certificate_code: string; title: string; issued_at: string } | null;
  dbMissing?: boolean;
};

export default function LevelHomePage() {
  const params = useParams();
  const levelSlug = String(params.levelSlug);
  const [data, setData] = useState<LevelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/course/levels/${levelSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error || !d.level) {
          setData(null);
          setError(d.error ?? "Level not found");
        } else {
          setData(d);
          setError(null);
        }
      })
      .catch(() => {
        setData(null);
        setError("Failed to load level");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [levelSlug]);

  const handleEnroll = async () => {
    setEnrolling(true);
    await fetch("/api/course/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ levelSlug }),
    });
    setEnrolling(false);
    load();
  };

  if (loading) return <PageSpinner />;

  if (error || !data?.level) {
    return (
      <div className="flex min-h-screen bg-white">
        <StudentSidebar activePage="course" />
        <main className="ml-[200px] flex-1 p-6">
          <Link
            href="/dashboard/student/course"
            className="text-sm font-semibold text-[#0d9488] hover:underline"
          >
            ← All levels
          </Link>
          <div className="mt-8 max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-xl font-bold text-[#0d1b35]">Level not available</h1>
            <p className="mt-2 text-sm text-amber-900">{error ?? "This level could not be loaded."}</p>
          </div>
        </main>
      </div>
    );
  }

  const { level, weeks, assessments, certificate, enrolled, dbMissing } = data;

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="course" />

      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50 p-6">
        <Link
          href="/dashboard/student/course"
          className="text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← All levels
        </Link>

        <div className="mt-4 rounded-2xl border border-[#c9972c]/30 bg-gradient-to-br from-[#0d1b35] to-[#152a4d] p-6 text-white">
          <p className="text-sm font-semibold text-[#c9972c]">{level.code}</p>
          <h1 className="mt-2 text-2xl font-bold">{level.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">{level.description}</p>
          {!enrolled ? (
            <button
              type="button"
              onClick={handleEnroll}
              disabled={enrolling}
              className="mt-5 rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35] hover:opacity-95 disabled:opacity-60"
            >
              {enrolling ? "Enrolling…" : "Enroll in this level →"}
            </button>
          ) : (
            <p className="mt-5 text-sm font-semibold text-[#0d9488]">✓ Enrolled</p>
          )}
        </div>

        {dbMissing ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Course content is loading from the catalog. Run the Supabase SQL migrations for full
            lessons and progress tracking.
          </p>
        ) : null}

        {certificate ? (
          <div className="mt-8">
            <CourseCertificate
              data={{
                certificateCode: certificate.certificate_code,
                title: certificate.title,
                cefrSubLevel: level.code,
              }}
            />
          </div>
        ) : null}

        <section className="mt-8">
          <h2 className="text-lg font-bold text-[#0d1b35]">Weekly units</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {weeks.map((week) => (
              <div
                key={week.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${
                  week.locked ? "border-slate-200 opacity-75" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#0d1b35]">{week.title}</h3>
                  <span className="text-sm font-semibold text-[#c9972c]">
                    {week.locked ? "Locked" : `${week.progress7030.overallPercent}%`}
                  </span>
                </div>
                {week.locked ? (
                  <p className="mt-3 text-sm text-amber-700">
                    Pass the mid-level check to unlock this week.
                  </p>
                ) : (
                  <>
                    <div className="mt-3">
                      <Progress7030Bar progress={week.progress7030} />
                    </div>
                    <Link
                      href={`/dashboard/student/course/${levelSlug}/week/${week.week_number}`}
                      className="mt-4 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
                    >
                      Open Week {week.week_number} →
                    </Link>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-[#0d1b35]">Assessments</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {assessments.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {a.assessment_type.replace("_", " ")}
                </p>
                <h3 className="mt-1 font-bold text-[#0d1b35]">{a.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{a.description}</p>
                <p className="mt-2 text-xs text-slate-500">Pass score: {a.pass_score}%</p>
                {a.passed ? (
                  <p className="mt-3 text-sm font-semibold text-[#0d9488]">
                    ✓ Passed {a.score != null ? `(${a.score}%)` : ""}
                  </p>
                ) : (
                  <Link
                    href={a.href}
                    className="mt-4 inline-block rounded-xl bg-[#0d1b35] px-4 py-2 text-sm font-bold text-white hover:opacity-95"
                  >
                    Take test →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
