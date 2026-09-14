"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "@/components/StudentSidebar";
import { getPhaseDefinition } from "@/lib/step/phases";
import { STEP_ROUTES } from "@/lib/step/paths";
import { PROGRAM_JOURNEYS, journeyStepMap } from "@/lib/dashboards/programJourneys";

type PhaseRow = {
  phase: number;
  title: string;
  status: string;
};

type ExitTestStatus = {
  phase: number;
  phaseTitle: string;
  ready: boolean;
  cooldownDays: number;
  week: number;
  weeksInPhase: number;
  previousAttempts: Array<{
    passed: boolean;
    date: string;
  }>;
};

type DashboardData = {
  user: { name: string };
  enrollment: {
    diagnosticDone: boolean;
    diagnostic_score?: number | null;
    estimated_score: number;
    target_score: number;
    gap: number;
    current_phase?: number;
  };
  header: {
    phaseLabel: string;
    estimatedScore: number;
    targetScore: number;
    gap: number;
  };
  todayMission: {
    day: string;
    title: string;
    description: string;
    minutes: number;
    href: string;
  };
  scoreMeter: {
    estimated: number;
    target: number;
    gap: number;
    progressPercent: number;
    trend: "on_track" | "needs_attention";
    trendLabel: string;
  };
  sectionBreakdown: Array<{
    id: string;
    label: string;
    maxPoints: number;
    estimatedPoints: number;
    targetPoints: number;
    status: "green" | "amber" | "red";
    href: string;
  }>;
  phaseProgress: {
    phases: PhaseRow[];
    currentPhase: number;
    weekLabel: string;
    overallCompletion: number;
  };
  mocks: {
    recent: Array<{
      mock_number: number;
      total_score: number;
      completed_at: string;
    }>;
    nextRecommended: string;
  };
};

function isWithinLastDays(iso: string, days: number): boolean {
  const d = new Date(iso);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return d.getTime() >= cutoff;
}

function deriveTodayMission(
  data: DashboardData,
  exitStatus: ExitTestStatus | null,
  questionsAnswered: number
) {
  const lastAttempt = exitStatus?.previousAttempts?.[0];
  if (lastAttempt?.passed && isWithinLastDays(lastAttempt.date, 7)) {
    const nextPhase = (exitStatus?.phase ?? 1) + 1;
    const nextTitle = getPhaseDefinition(nextPhase)?.title ?? "next phase";
    return {
      day: data.todayMission.day,
      title: `Phase ${exitStatus?.phase} complete — begin Phase ${nextPhase} content`,
      description: `You passed your exit test. Start ${nextTitle} practice sessions this week.`,
      minutes: 30,
      href: STEP_ROUTES.home,
      highlight: true,
    };
  }

  if (exitStatus?.ready) {
    return {
      day: data.todayMission.day,
      title: `Phase ${exitStatus.phase} Exit Test is ready — take it today`,
      description: `You are in the final week of ${exitStatus.phaseTitle}. Pass threshold unlocks the next phase.`,
      minutes: 45,
      href: STEP_ROUTES.exitTest,
      highlight: true,
    };
  }

  if (questionsAnswered < 5) {
    const diag = data.enrollment.diagnostic_score ?? 0;
    if (diag < 50) {
      return {
        day: data.todayMission.day,
        title: "Start Phase 1 — Foundation basics",
        description: "Build grammar accuracy and reading pace with short Structure and Reading sessions.",
        minutes: 25,
        href: "/dashboard/step/student/structure",
        highlight: false,
      };
    }
    if (diag <= 72) {
      return {
        day: data.todayMission.day,
        title: "Start Phase 2 — Development sessions",
        description: "Strengthen Reading comprehension and timed Structure practice.",
        minutes: 30,
        href: "/dashboard/step/student/reading",
        highlight: false,
      };
    }
    return {
      day: data.todayMission.day,
      title: "Start Phase 3 — Advancement practice",
      description: "Train Listening and Compositional analysis — the sections that surprise most students.",
      minutes: 30,
      href: "/dashboard/step/student/listening",
      highlight: false,
    };
  }

  return { ...data.todayMission, highlight: false };
}

export default function StepStudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [exitStatus, setExitStatus] = useState<ExitTestStatus | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, exitRes, progressRes] = await Promise.all([
          fetch("/api/step/dashboard"),
          fetch("/api/step/exit-test/status"),
          fetch("/api/step/progress/summary"),
        ]);
        const json = await dashRes.json();
        if (!dashRes.ok) throw new Error(json.error ?? "Failed to load");
        setData(json);
        if (!json.enrollment.diagnosticDone) {
          router.replace(STEP_ROUTES.diagnostic);
          return;
        }
        const exitJson = await exitRes.json();
        if (!exitJson.error) setExitStatus(exitJson);
        const progressJson = await progressRes.json();
        if (!progressJson.error) {
          setQuestionsAnswered(progressJson.studyHabits?.questions?.total ?? 0);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    })();
  }, [router]);

  const todayMission = useMemo(
    () => (data ? deriveTodayMission(data, exitStatus, questionsAnswered) : null),
    [data, exitStatus, questionsAnswered]
  );

  const phaseDisplay = useMemo(() => {
    if (!data) return "";
    const phase = data.phaseProgress.currentPhase;
    const title = getPhaseDefinition(phase)?.title ?? "Foundation";
    return `Phase ${phase} · ${title}`;
  }, [data]);

  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error}
        <p className="mt-2 text-sm text-slate-500">
          Run supabase/step_accelerator_setup.sql in Supabase first.
        </p>
      </div>
    );
  }

  if (!data || !todayMission) return <PageSpinner />;

  const firstName = data.user.name.split(" ")[0] ?? "there";
  const { header, scoreMeter, sectionBreakdown, phaseProgress, mocks } = data;
  const hasMeasuredScore = questionsAnswered >= 5;
  const estimatedDisplay = hasMeasuredScore ? header.estimatedScore : "—";
  const journey = PROGRAM_JOURNEYS.step;
  const metaByKey = journeyStepMap(journey);
  const orderedSections = journey.steps
    .map((step) => sectionBreakdown.find((s) => s.id === step.key))
    .filter(Boolean) as typeof sectionBreakdown;
  const readinessPct = hasMeasuredScore ? scoreMeter.progressPercent : 0;
  const attemptedCount = orderedSections.filter((s) => s.estimatedPoints > 0).length;

  return (
    <main className="dash-main">
      <div className="topbar">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <div className="meta">
            {phaseDisplay}
            {hasMeasuredScore
              ? ` · Estimated ${estimatedDisplay}/100 · target ${header.targetScore}+`
              : " · Not yet assessed — complete practice to see your score"}
          </div>
        </div>
      </div>

      <div className="journey">
        <div className="journey-head">
          <h2>{journey.title}</h2>
          <span>{journey.caption}</span>
        </div>
        <div className="rail">
          {orderedSections.map((section, i) => {
            const meta = metaByKey[section.id];
            const next = orderedSections[i + 1];
            const nextMeta = next ? metaByKey[next.id] : null;
            const attempted = section.estimatedPoints > 0;
            const nextAttempted = next ? next.estimatedPoints > 0 : false;
            const connectorFill = next
              ? attempted
                ? meta.hex
                : nextAttempted
                  ? nextMeta?.hex
                  : null
              : null;
            return (
              <Fragment key={section.id}>
                <Link
                  href={section.href}
                  className={`node${attempted ? " attempted" : ""}`}
                  style={{ ["--c" as string]: meta.color }}
                >
                  <div className="dot">{meta.icon}</div>
                  <div className="name">
                    {meta.label.replace(" Comprehension", "").replace(" Analysis", "")}
                  </div>
                  <div className="score">
                    {hasMeasuredScore ? `${section.estimatedPoints}/${section.maxPoints}` : "—"}
                  </div>
                </Link>
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
        {journey.sourceNote ? (
          <p className="ready-why" style={{ margin: "12px 0 0" }}>
            {journey.sourceNote}
          </p>
        ) : null}
      </div>

      <div className="overview">
        <div className={`band-card${hasMeasuredScore ? "" : " provisional"}`}>
          <div className="ready-line">
            <span className="ready-pct">{readinessPct}%</span>
            <span>ready for {header.targetScore}+ at current pace</span>
          </div>
          <div className="band-track">
            <div className="band-fill" style={{ width: `${readinessPct}%` }} />
          </div>
          <p className="ready-why">
            {hasMeasuredScore
              ? `Based on ${attemptedCount} of 4 STEP sections. Score is 0-100, not an IELTS band.`
              : "Complete practice in any section to begin a measured estimate."}
          </p>
          <div className="row">
            <div>
              <div className="lbl">Current estimate</div>
              <div className="big">{hasMeasuredScore ? estimatedDisplay : "—"}</div>
              <div className="estimate-note">
                {hasMeasuredScore ? "From STEP practice attempts" : "No section attempts yet"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="lbl">Target</div>
              <div className="big" style={{ fontSize: 24 }}>
                {header.targetScore}
              </div>
            </div>
          </div>
          <div className="band-foot">
            <span>
              Gap remaining: <b>{hasMeasuredScore ? header.gap : "Incomplete"}</b>
            </span>
            <span>{scoreMeter.trendLabel}</span>
          </div>
        </div>

        <div className="today-card">
          <div className="tag">TODAY&apos;S SESSION</div>
          <h3>{todayMission.title}</h3>
          <p className="ready-why" style={{ color: "var(--ink-soft)", margin: "0 0 12px" }}>
            {todayMission.description}
          </p>
          <div className="task">
            <span>{todayMission.day}</span>
            <span className="time">{todayMission.minutes} min</span>
          </div>
          <Link href={todayMission.href} className="primary-btn">
            Continue today&apos;s session →
          </Link>
        </div>
      </div>

      {orderedSections.map((section) => {
        const meta = metaByKey[section.id];
        const pct = section.maxPoints > 0 ? Math.round((section.estimatedPoints / section.maxPoints) * 100) : 0;
        const on = section.status === "green";
        return (
          <div key={section.id} id={section.id} className="skill-card" style={{ ["--c" as string]: meta.color }}>
            <div className="skill-top">
              <div className="n">
                <span className="skill-order">{meta.order}</span>
                <h3>{meta.label}</h3>
              </div>
              <span className={`skill-status${on ? " on" : ""}`}>
                {hasMeasuredScore ? `${section.estimatedPoints}/${section.maxPoints} pts` : "Not attempted"}
              </span>
            </div>
            <div className="skill-bar">
              <div className="skill-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="skill-foot">
              <span>
                Worth {section.maxPoints}% of the STEP paper · target {section.targetPoints} pts
              </span>
              <Link href={section.href}>{section.estimatedPoints > 0 ? "Practice →" : "Start →"}</Link>
            </div>
          </div>
        );
      })}

      {exitStatus?.ready ? (
        <div className="side-card" style={{ marginBottom: 14 }}>
          <h3>Phase {exitStatus.phase} exit test is ready</h3>
          <div className="mock-row">
            <span>
              Week {exitStatus.week} of {exitStatus.weeksInPhase}
            </span>
            <Link href={STEP_ROUTES.exitTest} className="mock-cta">
              Take exit test →
            </Link>
          </div>
        </div>
      ) : null}

      <div className="bottom">
        <div className="side-card">
          <h3>Next full mock</h3>
          <div className="mock-row">
            <span>100 MCQs · ~150 min · score 0-100</span>
            <Link href={STEP_ROUTES.mockExam} className="mock-cta">
              Schedule →
            </Link>
          </div>
          <div className="mock-row">
            <span>Recommended: {mocks.nextRecommended}</span>
            <span style={{ color: "var(--ink-soft)" }}>
              {mocks.recent[0] ? `Last mock ${mocks.recent[0].total_score}/100` : "No mocks completed yet"}
            </span>
          </div>
        </div>
        <div className="side-card">
          <h3>Phase progress</h3>
          <div className="mock-row">
            <span>{phaseProgress.weekLabel}</span>
            <span>{phaseProgress.overallCompletion}%</span>
          </div>
          <div className="skill-bar">
            <div
              className="skill-bar-fill"
              style={{ width: `${phaseProgress.overallCompletion}%`, background: "var(--gold)" }}
            />
          </div>
          <Link href={STEP_ROUTES.myJourney} className="mock-cta" style={{ marginTop: 12, display: "inline-block" }}>
            View phases →
          </Link>
        </div>
      </div>
    </main>
  );
}
