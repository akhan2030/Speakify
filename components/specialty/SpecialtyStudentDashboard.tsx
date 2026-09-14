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
import SpeakifyDashChrome from "@/components/dashboards/SpeakifyDashChrome";
import CourseJourneyStrip from "@/components/dashboards/CourseJourneyStrip";
import { PROGRAM_JOURNEYS, type ProgramJourneyId } from "@/lib/dashboards/programJourneys";

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
  const journey = PROGRAM_JOURNEYS[programId as ProgramJourneyId];

  return (
    <SpeakifyDashChrome>
    <div className="dash-main" style={{ paddingTop: 8 }}>
      <div className="topbar">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <div className="meta">
            {program.name} · {program.duration} · {mission.weekLabel}
          </div>
        </div>
      </div>

      {journey ? (
        <CourseJourneyStrip
          journey={journey}
          nodes={journey.steps.map((step, index) => {
            const skill = program.skills.find((s) => s.id === step.key);
            const attempted = program.currentWeek > index;
            const percent = attempted
              ? Math.min(100, Math.round((program.currentWeek / program.weekCount) * 100))
              : 0;
            return {
              key: step.key,
              score: attempted ? `${percent}%` : "—",
              attempted,
              href: `${base}/modules#${step.key}`,
              percent,
              status: attempted ? "In this level" : "Coming up",
              nextCopy: skill?.description ?? `Continue ${step.label.toLowerCase()} in this programme.`,
            };
          })}
        />
      ) : null}

      <div className="overview">
        <div className="band-card">
          <div className="ready-line">
            <span className="ready-pct">{program.progressPercent}%</span>
            <span>through {program.name}</span>
          </div>
          <div className="band-track">
            <div className="band-fill" style={{ width: `${program.progressPercent}%` }} />
          </div>
          <p className="ready-why">
            Programme progress from curriculum completion — not an IELTS exam-order score.
          </p>
          <div className="row">
            <div>
              <div className="lbl">Current focus</div>
              <div className="big" style={{ fontSize: 22 }}>{mission.focusTitle}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="lbl">Entry</div>
              <div className="big" style={{ fontSize: 22 }}>{program.entryLevel}</div>
            </div>
          </div>
        </div>
        <div className="today-card">
          <div className="tag">TODAY&apos;S SESSION</div>
          <h3>{mission.focusTitle}</h3>
          {mission.tasks.map((task) => (
            <div key={task.title} className="task">
              {task.title}
              <span className="time">{task.minutes} min</span>
            </div>
          ))}
          <Link href={`${base}/practice`} className="primary-btn">
            Continue today&apos;s session →
          </Link>
        </div>
      </div>

      <div className="bottom">
        <div className="side-card">
          <h3>What you&apos;ll achieve</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink-soft)", fontSize: 13.5 }}>
            {outcomes.map((item) => (
              <li key={item} style={{ marginBottom: 8 }}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="side-card">
          <h3>Programme timeline</h3>
          {curriculum.slice(0, 4).map((item) => (
            <div key={`${item.week}-${item.title}`} className="mock-row">
              <span>
                {item.week}: {item.title}
              </span>
            </div>
          ))}
          <Link href={`${base}/weekly-plan`} className="mock-cta" style={{ marginTop: 12, display: "inline-block" }}>
            Full plan →
          </Link>
        </div>
      </div>
    </div>
    </SpeakifyDashChrome>
  );
}
