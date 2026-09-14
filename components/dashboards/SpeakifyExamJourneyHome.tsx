"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import {
  journeyStepMap,
  type ProgramJourney,
} from "@/lib/dashboards/programJourneys";

export type ExamSkillRow = {
  key: string;
  label: string;
  href: string;
  band: number | null;
  target: number;
  gap: number | null;
  onTarget: boolean;
  needsWork: boolean;
  percent: number;
  attempted: boolean;
};

export type ExamDashboardData = {
  user: {
    name: string;
    examDate: string | null;
    studyDaysPerWeek: number;
  };
  greeting: string;
  todayDate: string;
  today: {
    dayName: string;
    subtitle: string;
    tasks: Array<{
      id: string;
      title: string;
      minutes: number;
      href: string;
      completed: boolean;
      taskType?: string;
    }>;
    completedCount: number;
    totalCount: number;
    remainingMinutes: number;
    allComplete: boolean;
    tomorrowDay: string;
  };
  streak: {
    current: number;
    longest: number;
    calendar: Array<{ label: string; status: string }>;
  };
  bands: {
    current: number | null;
    target: number;
    gap: number | null;
    skills: ExamSkillRow[];
    coverage?: {
      attempted: number;
      total: number;
      provisional: boolean;
      basedOnLabel: string;
    };
  };
  projection: {
    projectedBand: number | null;
    weeklyBandGain: number;
    onTrack: boolean;
    message: string;
  };
  weakestSkill: {
    key: string;
    label: string;
    showAlert: boolean;
    actions: Array<{ title: string; minutes: number; href: string }>;
  };
  exam: {
    daysRemaining: number | null;
    examDateLabel: string | null;
    datePassed?: boolean;
    paceWarning?: boolean;
    examReadinessPercent?: number;
  };
  mock: {
    nextNumber: number;
    recommendedDay: string;
    duration: string;
    previous: {
      number: number;
      overallBand: number;
      dateLabel: string;
    } | null;
  };
};

export type ExamDashboardEndpoints = {
  load: string;
  mission: string;
  mockHref: string;
  homeHref: string;
  mockDuration: string;
};

const WEEK_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatBand(band: number | null | undefined): string {
  if (band == null || !Number.isFinite(band)) return "—";
  return band.toFixed(1);
}

function skillStatus(skill: ExamSkillRow, weakestKey: string, showAlert: boolean) {
  if (!skill.attempted) return { label: "Not attempted", on: false };
  if (showAlert && skill.key === weakestKey) return { label: "Priority this week", on: false };
  if (skill.onTarget) return { label: `On target — ${formatBand(skill.band)}`, on: true };
  return { label: `Needs work — ${formatBand(skill.band)}`, on: false };
}

function skillNextCopy(
  skill: ExamSkillRow,
  weakest: ExamDashboardData["weakestSkill"],
  firstKey: string
): string {
  if (!skill.attempted) {
    if (skill.key === firstKey) {
      return "Start with a diagnostic section to set your baseline.";
    }
    return "Open from day one — the first step on the rail still gives the best exam-order baseline.";
  }
  if (weakest.key === skill.key && weakest.actions.length) {
    return weakest.actions
      .slice(0, 2)
      .map((a) => `${a.title} (${a.minutes} min)`)
      .join(" · ");
  }
  return `Continue ${skill.label.toLowerCase()} practice toward Band ${skill.target.toFixed(1)}.`;
}

export default function SpeakifyExamJourneyHome({
  journey,
  endpoints,
}: {
  journey: ProgramJourney;
  endpoints: ExamDashboardEndpoints;
}) {
  const [data, setData] = useState<ExamDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState(journey.steps[0]?.key ?? "");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [examDateInput, setExamDateInput] = useState("");
  const [editingExam, setEditingExam] = useState(false);
  const [savingExam, setSavingExam] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);

  const metaByKey = useMemo(() => journeyStepMap(journey), [journey]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(endpoints.load);
        const json = await res.json();
        if (!json.error) {
          setData(json);
          if (json.user?.examDate && json.exam?.daysRemaining != null) {
            setExamDateInput(json.user.examDate.slice(0, 10));
          }
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [endpoints.load]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function saveExamDate() {
    if (!examDateInput) return;
    if (examDateInput < todayIsoDate()) {
      setExamError("Exam date cannot be in the past");
      return;
    }
    setSavingExam(true);
    setExamError(null);
    try {
      const res = await fetch(endpoints.load, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ielts_exam_date: examDateInput }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setExamError(json.error || "Could not save exam date");
        return;
      }
      setEditingExam(false);
      await load(true);
    } finally {
      setSavingExam(false);
    }
  }

  async function toggleMissionTask(task: ExamDashboardData["today"]["tasks"][0]) {
    if (!data) return;
    setTogglingId(task.id);
    try {
      const res = await fetch(endpoints.mission, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          action: task.completed ? "uncomplete" : "complete",
          timeSpentMinutes: task.minutes,
        }),
      });
      const json = await res.json();
      if (json.error) return;
      setData((prev) =>
        prev
          ? {
              ...prev,
              today: {
                ...prev.today,
                tasks: prev.today.tasks.map((t) =>
                  t.id === task.id ? { ...t, completed: !t.completed } : t
                ),
                completedCount: json.completedCount,
                totalCount: json.totalCount,
                remainingMinutes: json.remainingMinutes,
                allComplete: json.allComplete,
              },
            }
          : prev
      );
    } finally {
      setTogglingId(null);
    }
  }

  const orderedSkills = useMemo(() => {
    if (!data) return [];
    const byKey = Object.fromEntries(data.bands.skills.map((s) => [s.key, s]));
    return journey.steps.map((step) => byKey[step.key]).filter(Boolean);
  }, [data, journey.steps]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <PageSpinner />
      </div>
    );
  }

  const nextTask = data.today.tasks.find((t) => !t.completed) ?? data.today.tasks[0];
  const sessionTitle = data.today.allComplete
    ? `Today's session complete`
    : nextTask?.title ?? data.today.subtitle;
  const sessionHref = nextTask?.href ?? endpoints.homeHref;
  const coverage = data.bands.coverage;
  const provisional =
    coverage?.provisional ?? orderedSkills.filter((s) => s.attempted).length < journey.steps.length;
  const basedOnLabel = coverage?.basedOnLabel ?? "No skill attempts yet";
  const gapLabel = provisional
    ? "Incomplete"
    : data.bands.gap != null
      ? data.bands.gap.toFixed(1)
      : "—";
  const hasExamDate = journey.hasExamDate && data.exam.daysRemaining != null;
  const showExamPicker = journey.hasExamDate && (editingExam || !hasExamDate);
  const projected = hasExamDate
    ? provisional
      ? "Provisional"
      : data.projection.projectedBand != null
        ? `${journey.scoreNoun} ${data.projection.projectedBand.toFixed(1)}`
        : "—"
    : "Waiting for a date";
  const attemptedCount = coverage?.attempted ?? orderedSkills.filter((s) => s.attempted).length;
  const readinessPct = data.exam.examReadinessPercent ?? 0;
  const readinessWhy =
    attemptedCount === 0
      ? "No skills attempted yet — start any section to begin."
      : hasExamDate
        ? `Based on ${attemptedCount} of ${journey.steps.length} skills attempted, weighted by band gap and days remaining.`
        : `Based on ${attemptedCount} of ${journey.steps.length} skills attempted and your band gap. Set an exam date to include pacing.`;
  const firstKey = journey.steps[0]?.key ?? "listening";

  function focusExamDate() {
    setEditingExam(true);
    requestAnimationFrame(() => {
      document.getElementById("exam-date")?.focus();
      document.getElementById("exam-date-field")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function jumpToSkill(id: string) {
    setActiveNode(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main className="dash-main">
      <div className="topbar">
        <div>
          <h1>
            {data.greeting}, {data.user.name}
          </h1>
          <div className="meta">
            {data.todayDate}
            {journey.hasExamDate
              ? hasExamDate && data.exam.examDateLabel
                ? ` · Exam day: ${data.exam.examDateLabel}`
                : data.exam.datePassed
                  ? " · Exam date has passed"
                  : " · Exam day: not set"
              : null}
          </div>
        </div>
        <div className="top-right">
          <div className="streak">🔥 {data.streak.current}-day streak</div>
          {journey.hasExamDate ? (
            showExamPicker ? (
              <div className="exam-set" id="exam-date-field">
                <label htmlFor="exam-date">
                  {data.exam.datePassed ? "Previous date passed — set a new exam date" : "Set your exam date"}
                </label>
                <input
                  id="exam-date"
                  type="date"
                  min={todayIsoDate()}
                  value={examDateInput}
                  onChange={(e) => {
                    setExamDateInput(e.target.value);
                    setExamError(null);
                  }}
                />
                <button type="button" className="exam-save" onClick={saveExamDate} disabled={!examDateInput || savingExam}>
                  {savingExam ? "Saving…" : "Save"}
                </button>
                {hasExamDate ? (
                  <button type="button" className="change-date" onClick={() => setEditingExam(false)}>
                    Cancel
                  </button>
                ) : null}
                {examError ? <div className="exam-error">{examError}</div> : null}
              </div>
            ) : (
              <div className="exam-set" id="exam-date-field">
                <div>
                  {data.exam.daysRemaining === 0 ? (
                    <>
                      Exam <b>today</b>
                    </>
                  ) : (
                    <>
                      Exam in <b>{data.exam.daysRemaining} days</b>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className="change-date"
                  onClick={() => {
                    setExamDateInput(data.user.examDate?.slice(0, 10) || todayIsoDate());
                    setEditingExam(true);
                    setExamError(null);
                  }}
                >
                  Change date
                </button>
              </div>
            )
          ) : null}
        </div>
      </div>

      <div className="journey">
        <div className="journey-head">
          <h2>{journey.title}</h2>
          <span>{journey.caption}</span>
        </div>
        <div className="rail">
          {orderedSkills.map((skill, i) => {
            const meta = metaByKey[skill.key];
            const next = orderedSkills[i + 1];
            const nextMeta = next ? metaByKey[next.key] : null;
            const connectorFill = next
              ? skill.attempted
                ? meta.hex
                : next.attempted
                  ? nextMeta?.hex
                  : null
              : null;
            return (
              <Fragment key={skill.key}>
                <button
                  type="button"
                  className={`node${activeNode === meta.key ? " active" : ""}${skill.attempted ? " attempted" : ""}`}
                  style={{ ["--c" as string]: meta.color }}
                  onClick={() => jumpToSkill(meta.key)}
                >
                  <div className="dot">{meta.icon}</div>
                  <div className="name">{meta.label}</div>
                  <div className="score">{formatBand(skill.band)}</div>
                </button>
                {next ? (
                  <div
                    className={`connector${connectorFill ? " done" : ""}`}
                    style={connectorFill ? { background: connectorFill } : undefined}
                  />
                ) : null}
              </Fragment>
            );
          })}
        </div>
        {journey.sourceNote ? <p className="ready-why" style={{ margin: "12px 0 0" }}>{journey.sourceNote}</p> : null}
      </div>

      <div className="overview">
        <div className={`band-card${provisional ? " provisional" : ""}`}>
          <div className="ready-line">
            <span className="ready-pct">{readinessPct}%</span>
            <span>
              ready for {journey.targetPrefix} {data.bands.target.toFixed(1)} at current pace
            </span>
          </div>
          <div className="band-track">
            <div className="band-fill" style={{ width: `${readinessPct}%` }} />
          </div>
          <p className="ready-why">{readinessWhy}</p>
          <div className="row">
            <div>
              <div className="lbl">Current estimate</div>
              <div className="big">{formatBand(data.bands.current)}</div>
              <div className="estimate-note">{basedOnLabel}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="lbl">Target</div>
              <div className="big" style={{ fontSize: 24 }}>
                {data.bands.target.toFixed(1)}
              </div>
            </div>
          </div>
          <div className="band-foot">
            <span>
              Gap remaining: <b>{gapLabel}</b>
            </span>
            {journey.hasExamDate ? (
              <span>
                Projected by exam day:{" "}
                {hasExamDate ? (
                  <b>{projected}</b>
                ) : (
                  <button type="button" className="jump-exam" onClick={focusExamDate}>
                    waiting — use the date field above
                  </button>
                )}
              </span>
            ) : null}
          </div>
          {data.exam.paceWarning ? (
            <div className="pace-warn">
              At this pace, you may not close the gap in time
              {data.projection.weeklyBandGain
                ? ` (~${data.projection.weeklyBandGain.toFixed(2)} band/week).`
                : "."}
              {provisional && coverage
                ? ` ${coverage.total - coverage.attempted} skill${coverage.total - coverage.attempted === 1 ? "" : "s"} still need a first attempt.`
                : ""}
            </div>
          ) : null}
        </div>

        <div className="today-card">
          <div className="tag">TODAY&apos;S SESSION</div>
          <h3>{sessionTitle}</h3>
          {data.today.tasks.map((task) => (
            <label key={task.id} className="task">
              <input
                type="checkbox"
                checked={task.completed}
                disabled={togglingId === task.id}
                onChange={() => toggleMissionTask(task)}
              />
              {task.title}
              <span className="time">{task.minutes} min</span>
            </label>
          ))}
          <Link href={sessionHref} className="primary-btn">
            Continue today&apos;s session →
          </Link>
        </div>
      </div>

      {orderedSkills.map((skill) => {
        const meta = metaByKey[skill.key];
        const status = skillStatus(skill, data.weakestSkill.key, data.weakestSkill.showAlert);
        return (
          <div key={skill.key} id={meta.key} className="skill-card" style={{ ["--c" as string]: meta.color }}>
            <div className="skill-top">
              <div className="n">
                <span className="skill-order">{meta.order}</span>
                <h3>{meta.label}</h3>
              </div>
              <span className={`skill-status${status.on ? " on" : ""}`}>{status.label}</span>
            </div>
            <div className="skill-bar">
              <div className="skill-bar-fill" style={{ width: `${skill.percent}%` }} />
            </div>
            <div className="skill-foot">
              <span>{skillNextCopy(skill, data.weakestSkill, firstKey)}</span>
              <Link href={skill.href}>{skill.attempted ? "Practice →" : "Start →"}</Link>
            </div>
          </div>
        );
      })}

      <div className="bottom">
        <div className="side-card">
          <h3>Next mock exam</h3>
          <div className="mock-row">
            <span>
              Full Mock #{data.mock.nextNumber} · {endpoints.mockDuration}
            </span>
            <Link href={endpoints.mockHref} className="mock-cta">
              Schedule →
            </Link>
          </div>
          <div className="mock-row">
            <span>Recommended: {data.mock.recommendedDay.toLowerCase()}</span>
            <span style={{ color: "var(--ink-soft)" }}>
              {data.mock.previous
                ? `Mock #${data.mock.previous.number} — ${data.mock.previous.overallBand?.toFixed?.(1)}`
                : "No mocks completed yet"}
            </span>
          </div>
        </div>
        <div className="side-card">
          <h3>This week&apos;s streak</h3>
          <div className="week-dots">
            {(data.streak.calendar.length
              ? data.streak.calendar
              : WEEK_LETTERS.map((label) => ({ label, status: "future" }))
            ).map((day, i) => {
              const on = day.status === "studied" || day.status === "today" || day.status === "completed";
              return (
                <div key={`${day.label}-${i}`} className={`week-dot${on ? " on" : ""}`}>
                  {WEEK_LETTERS[i] ?? day.label.charAt(0)}
                  <i />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
