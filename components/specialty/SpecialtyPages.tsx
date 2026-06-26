"use client";

import { useSession } from "next-auth/react";
import {
  getSpecialtyProgram,
  specialtyCurriculum,
  type SpecialtyProgramId,
} from "@/lib/specialtyPrograms";

export default function SpecialtyModulesPage({
  programId,
}: {
  programId: SpecialtyProgramId;
}) {
  const program = getSpecialtyProgram(programId);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0d1b35]">Skill modules</h1>
        <p className="mt-2 text-slate-600">
          Focus areas for {program.name}. Complete lessons and practice tasks in each module.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {program.skills.map((skill, index) => (
          <article
            key={skill.id}
            id={skill.id}
            className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Module {index + 1}
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#0d1b35]">
                  {skill.icon} {skill.label}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{skill.description}</p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: program.accentLight, color: program.accent }}
              >
                {index === 0 ? "In progress" : "Up next"}
              </span>
            </div>

            <ul className="mt-5 space-y-2">
              {[
                "Guided lesson with examples",
                "Vocabulary & phrase bank",
                "Practice task with feedback",
              ].map((step) => (
                <li key={step} className="flex gap-2 text-sm text-slate-700">
                  <span style={{ color: program.accent }}>✓</span>
                  {step}
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-5 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: program.accent }}
            >
              Open {skill.label} lesson
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SpecialtyWeeklyPlanPage({
  programId,
}: {
  programId: SpecialtyProgramId;
}) {
  const program = getSpecialtyProgram(programId);
  const curriculum = specialtyCurriculum(programId);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0d1b35]">Weekly plan</h1>
        <p className="mt-2 text-slate-600">
          Your structured {program.duration} schedule for {program.name}.
        </p>
      </div>

      <div className="space-y-4">
        {curriculum.map((item, index) => {
          const isCurrent = index + 1 === program.currentWeek;
          const isComplete = index + 1 < program.currentWeek;
          return (
            <div
              key={`${item.week}-${item.title}`}
              className={`rounded-2xl border p-5 ${
                isCurrent
                  ? "border-2 bg-white shadow-md"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
              style={isCurrent ? { borderColor: program.accent } : undefined}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {item.week}
                </p>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: isComplete
                      ? "#dcfce7"
                      : isCurrent
                        ? program.accentLight
                        : "#f1f5f9",
                    color: isComplete ? "#166534" : isCurrent ? program.accent : "#64748b",
                  }}
                >
                  {isComplete ? "Complete" : isCurrent ? "This week" : "Upcoming"}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-bold text-[#0d1b35]">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SpecialtyPracticePage({ programId }: { programId: SpecialtyProgramId }) {
  const program = getSpecialtyProgram(programId);
  const mission = specialtyCurriculum(programId)[program.currentWeek - 1];

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0d1b35]">Practice</h1>
        <p className="mt-2 text-slate-600">
          Focused tasks for this week&apos;s {program.name} content.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: program.headerGradient }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
          This week
        </p>
        <h2 className="mt-2 text-xl font-bold">{mission?.title ?? program.name}</h2>
        <p className="mt-2 text-sm text-white/80">{mission?.detail}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {program.skills.slice(0, 4).map((skill) => (
          <div
            key={skill.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <span className="text-2xl">{skill.icon}</span>
            <h3 className="mt-3 font-bold text-[#0d1b35]">{skill.label} practice</h3>
            <p className="mt-1 text-sm text-slate-500">15–20 min guided task</p>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border py-2 text-sm font-semibold"
              style={{ borderColor: program.accent, color: program.accent }}
            >
              Start task
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpecialtyProgressPage({ programId }: { programId: SpecialtyProgramId }) {
  const program = getSpecialtyProgram(programId);

  const stats = [
    { label: "Programme progress", value: `${program.progressPercent}%` },
    { label: "Modules started", value: `${Math.max(1, program.skills.length - 2)} / ${program.skills.length}` },
    { label: "Practice hours", value: programId === "kids_english" ? "3.5h" : "6h" },
    { label: "Current week", value: `${program.currentWeek} / ${program.weekCount}` },
  ];

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0d1b35]">My progress</h1>
        <p className="mt-2 text-slate-600">Track your journey through {program.name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-extrabold text-[#0d1b35]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0d1b35]">Module completion</h2>
        <div className="mt-5 space-y-4">
          {program.skills.map((skill, index) => {
            const percent = index === 0 ? 45 : index === 1 ? 20 : 0;
            return (
              <div key={skill.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-[#0d1b35]">{skill.label}</span>
                  <span className="text-slate-500">{percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${percent}%`, backgroundColor: program.accent }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SpecialtySettingsPage({ programId }: { programId: SpecialtyProgramId }) {
  const program = getSpecialtyProgram(programId);
  const { data: session } = useSession();

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0d1b35]">Settings</h1>
        <p className="mt-2 text-slate-600">Your {program.name} account preferences.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-[#0d1b35]">{session?.user?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-[#0d1b35]">{session?.user?.email ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Programme</dt>
            <dd className="font-medium text-[#0d1b35]">{program.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Entry level</dt>
            <dd className="font-medium text-[#0d1b35]">{program.entryLevel}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
