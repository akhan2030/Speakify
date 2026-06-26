"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  getSpecialtyProgram,
  specialtyCurriculum,
  specialtyOutcomes,
  todayMissionForProgram,
  type SpecialtyProgramId,
} from "@/lib/specialtyPrograms";

function ProgressBar({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, percent)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function SpecialtyStudentDashboard({
  programId,
}: {
  programId: SpecialtyProgramId;
}) {
  const { data: session } = useSession();
  const program = getSpecialtyProgram(programId);
  const mission = todayMissionForProgram(programId);
  const outcomes = specialtyOutcomes(programId);
  const curriculum = specialtyCurriculum(programId);
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const base = program.dashboardBase;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <section
        className="overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: program.headerGradient }}
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
          {program.tagline}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">
          {program.name} · {program.duration} · Target: {program.targetLabel}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs text-white/70">Current focus</p>
            <p className="mt-1 text-lg font-bold">{mission.weekLabel}</p>
            <p className="mt-1 text-sm text-white/80">{mission.focusTitle}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs text-white/70">Programme progress</p>
            <p className="mt-1 text-lg font-bold">{program.progressPercent}%</p>
            <div className="mt-2">
              <ProgressBar percent={program.progressPercent} color={program.accent} />
            </div>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs text-white/70">Entry level</p>
            <p className="mt-1 text-lg font-bold">{program.entryLevel}</p>
            <p className="mt-1 text-sm text-white/80">
              Week {program.currentWeek} of {program.weekCount}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0d1b35]">Today&apos;s mission</h2>
            <p className="mt-1 text-sm text-slate-500">{mission.focusDetail}</p>
          </div>
          <Link
            href={`${base}/practice`}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: program.accent }}
          >
            Start practice
          </Link>
        </div>
        <ul className="mt-5 space-y-3">
          {mission.tasks.map((task, index) => (
            <li
              key={task.title}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: program.accent }}
                >
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-[#0d1b35]">{task.title}</span>
              </div>
              <span className="text-xs font-semibold text-slate-500">{task.minutes} min</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0d1b35]">Skill modules</h2>
          <Link
            href={`${base}/modules`}
            className="text-sm font-semibold hover:underline"
            style={{ color: program.accent }}
          >
            View all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {program.skills.map((skill) => (
            <Link
              key={skill.id}
              href={`${base}/modules#${skill.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-2xl">{skill.icon}</span>
              <p className="mt-3 font-bold text-[#0d1b35]">{skill.label}</p>
              <p className="mt-1 text-sm text-slate-500">{skill.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0d1b35]">What you&apos;ll achieve</h2>
          <ul className="mt-4 space-y-3">
            {outcomes.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-slate-700">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: program.accent }}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0d1b35]">Programme timeline</h2>
            <Link
              href={`${base}/weekly-plan`}
              className="text-sm font-semibold hover:underline"
              style={{ color: program.accent }}
            >
              Full plan →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {curriculum.slice(0, 4).map((item) => (
              <div
                key={`${item.week}-${item.title}`}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {item.week}
                </p>
                <p className="mt-1 font-semibold text-[#0d1b35]">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
