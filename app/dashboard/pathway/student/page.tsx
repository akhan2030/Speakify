"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getContentEngine,
} from "@/lib/programs";
import {
  getProgramTerminology,
  normalizePathwayLevelId,
  PATHWAY_LEVEL_NAMES,
  type PathwaySkill,
} from "@/lib/programs/terminology";

const pathwayEngine = getContentEngine("english_pathway");

const LEVEL_SEQUENCE = [
  "a1_1",
  "a1_2",
  "a2_1",
  "a2_2",
  "b1_1",
  "b1_2",
  "b2_1",
  "b2_2",
  "c1_1",
  "c1_2",
];

const TODAY_TASKS: Record<string, { title: string; tasks: string[]; time: number }> =
  {
    sunday: {
      title: "Fresh Start — Review & Preview",
      tasks: [
        "Review last week summary",
        "Preview this week vocabulary",
        "Set weekly study goal",
        "Warm-up reading (10 min)",
      ],
      time: 30,
    },
    monday: {
      title: "Input Day — Grammar + Vocabulary",
      tasks: [
        "Grammar lesson (15 min)",
        "New vocabulary set — 15 words (15 min)",
        "Reading passage in context (20 min)",
        "Vocabulary quiz (10 min)",
      ],
      time: 60,
    },
    tuesday: {
      title: "Practice Day — Exercises",
      tasks: [
        "Grammar exercises (15 min)",
        "Vocabulary practice (15 min)",
        "Listening comprehension (20 min)",
        "Error correction (10 min)",
      ],
      time: 60,
    },
    wednesday: {
      title: "Application Day — Speaking + Writing",
      tasks: [
        "Speaking recording task (15 min)",
        "Writing task submission (25 min)",
        "Vocabulary in sentences (10 min)",
        "Peer review (10 min)",
      ],
      time: 60,
    },
    thursday: {
      title: "Review Day — Consolidation",
      tasks: [
        "Mixed practice — previous content (20 min)",
        "Spaced repetition vocabulary quiz (15 min)",
        "Reading comprehension (15 min)",
        "Grammar review (10 min)",
      ],
      time: 60,
    },
    friday: {
      title: "Assessment Day — Weekly Quiz",
      tasks: [
        "Weekly quiz — 20 questions (25 min)",
        "Speaking review (10 min)",
        "Writing feedback review (10 min)",
        "Progress check (5 min)",
      ],
      time: 50,
    },
    saturday: {
      title: "Reflection Day — Review + Prepare",
      tasks: [
        "Review week performance (15 min)",
        "Vocabulary consolidation (15 min)",
        "Plan next week goals (10 min)",
        "Optional bonus reading (20 min)",
      ],
      time: 40,
    },
  };

const STREAK_MESSAGES: Record<number, string> = {
  1: "Day one — every journey starts here",
  3: "Building momentum — keep going",
  7: "One week strong — you are in the habit",
  14: "Two weeks — this is becoming automatic",
  21: "Three weeks — you are serious about this",
  30: "30 days — this is what C1 students do",
};

function getStreakMessage(streak: number): string {
  if (streak >= 30) return STREAK_MESSAGES[30];
  if (streak >= 21) return STREAK_MESSAGES[21];
  if (streak >= 14) return STREAK_MESSAGES[14];
  if (streak >= 7) return STREAK_MESSAGES[7];
  if (streak >= 3) return STREAK_MESSAGES[3];
  return STREAK_MESSAGES[1];
}

type LevelProgress = {
  level_id: string;
  status: string;
  overall_score?: number;
  week_current?: number;
};

type PathwayDashboardData = {
  programType?: string;
  levelId?: string;
  skillProgress?: Record<PathwaySkill, number>;
  graduationReadiness?: number;
  recommendedFocus?: ReturnType<typeof pathwayEngine.getRecommendedFocus>;
  currentLevel?: LevelProgress | null;
  allLevels?: LevelProgress[];
  todayTasks?: Array<{ completed?: boolean }>;
  streak?: {
    current_streak?: number;
    total_hours?: number;
    total_tasks_completed?: number;
    longest_streak?: number;
  } | null;
};

export default function PathwayDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<PathwayDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const terms = getProgramTerminology("pathway");

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const todayPlan = TODAY_TASKS[today];
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
        ? "Good afternoon"
        : "Good evening";
  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    fetch("/api/pathway/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, status]);

  const currentLevelId = normalizePathwayLevelId(data?.levelId ?? data?.currentLevel?.level_id);
  const currentLevelName = PATHWAY_LEVEL_NAMES[currentLevelId];
  const currentWeek = data?.currentLevel?.week_current || 3;
  const skillProgress =
    data?.skillProgress ?? pathwayEngine.getDefaultSkillProgress(currentLevelId);
  const graduationReadiness =
    data?.graduationReadiness ?? pathwayEngine.getGraduationReadiness(skillProgress);
  const recommendedFocus =
    data?.recommendedFocus ??
    pathwayEngine.getRecommendedFocus(currentLevelId, currentWeek, skillProgress);
  const skillHref: Record<PathwaySkill, string> = {
    grammar: "/dashboard/pathway/student/grammar",
    vocabulary: "/dashboard/pathway/student/vocabulary",
    reading: "/dashboard/pathway/student/reading",
    listening: "/dashboard/pathway/student/listening",
    speaking: "/dashboard/pathway/student/speaking",
    writing: "/dashboard/pathway/student/writing",
    pronunciation: "/dashboard/pathway/student/pronunciation",
  };
  const completedLevels =
    data?.allLevels?.filter((l) => l.status === "completed")?.length || 4;
  const overallProgress = Math.round((completedLevels / 10) * 100);
  const streakDays = data?.streak?.current_streak || 0;
  const todayTasksCompleted =
    data?.todayTasks?.filter((t) => t.completed)?.length || 0;
  const todayTasksTotal = todayPlan?.tasks?.length || 4;
  const todayProgress =
    todayTasksTotal > 0 ? todayTasksCompleted / todayTasksTotal : 0;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <p style={{ color: "#888" }}>Loading your pathway...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 600,
              color: "#0d1b35",
              margin: 0,
            }}
          >
            {greeting}, {firstName}
          </h1>
          <p style={{ color: "#888", fontSize: "14px", margin: "2px 0 0" }}>
            {dateStr}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {streakDays > 0 ? (
            <span
              style={{
                background: "#fff7ed",
                color: "#c9972c",
                fontSize: "13px",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "20px",
                border: "1px solid #fcd34d",
              }}
            >
              🔥 {streakDays} day streak
            </span>
          ) : null}
          <span
            style={{
              background: "#f0fdf4",
              color: "#0d9488",
              fontSize: "13px",
              fontWeight: 500,
              padding: "6px 12px",
              borderRadius: "20px",
              border: "1px solid #0d9488",
            }}
          >
            Graduation assessment in 8 days
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              borderLeft: "4px solid #c9972c",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#c9972c",
                    fontWeight: 600,
                    letterSpacing: "2px",
                    margin: 0,
                  }}
                >
                  {terms.missionLabel.toUpperCase()}
                </p>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#0d1b35",
                    margin: "4px 0 0",
                  }}
                >
                  {todayPlan?.title}
                </h2>
              </div>
              <span
                style={{
                  background: "#f0fdf4",
                  color: "#0d9488",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "20px",
                }}
              >
                {todayTasksCompleted}/{todayTasksTotal} done
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "1rem",
              }}
            >
              {todayPlan?.tasks?.map((task, i) => (
                <div
                  key={task}
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: i < todayTasksCompleted ? "#0d9488" : "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {i < todayTasksCompleted ? (
                      <span style={{ color: "white", fontSize: "11px" }}>✓</span>
                    ) : null}
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: i < todayTasksCompleted ? "#888" : "#0d1b35",
                      textDecoration:
                        i < todayTasksCompleted ? "line-through" : "none",
                      margin: 0,
                    }}
                  >
                    {task}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "#f1f5f9",
                borderRadius: "4px",
                height: "6px",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: `${todayProgress * 100}%`,
                  height: "6px",
                  background: "#c9972c",
                  borderRadius: "4px",
                  transition: "width 0.3s",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
                ~
                {Math.round(
                  (todayPlan?.time ?? 0) * (1 - todayProgress)
                )}{" "}
                min remaining
              </p>
              <Link
                href={skillHref[recommendedFocus.skill]}
                style={{
                  background: "#c9972c",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Continue Learning →
              </Link>
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    letterSpacing: "2px",
                    margin: 0,
                  }}
                >
                  {terms.currentLevelLabel.toUpperCase()}
                </p>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#0d1b35",
                    margin: "4px 0 0",
                  }}
                >
                  {currentLevelName}
                </h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "11px", color: "#888", margin: 0 }}>
                  Week progress
                </p>
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#c9972c",
                    margin: 0,
                  }}
                >
                  {currentWeek}/5
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                  Overall pathway progress
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0d1b35",
                    margin: 0,
                  }}
                >
                  {overallProgress}%
                </p>
              </div>
              <div
                style={{
                  background: "#f1f5f9",
                  borderRadius: "4px",
                  height: "8px",
                }}
              >
                <div
                  style={{
                    width: `${overallProgress}%`,
                    height: "8px",
                    background: "#0d9488",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <p style={{ fontSize: "11px", color: "#888", margin: "4px 0 0" }}>
                {completedLevels}/10 levels completed
              </p>
            </div>

            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#888",
                margin: "0 0 8px",
              }}
            >
              {terms.progressLabel}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px",
              }}
            >
              {(
                [
                  { key: "grammar", label: "Grammar" },
                  { key: "vocabulary", label: "Vocabulary" },
                  { key: "reading", label: "Reading" },
                  { key: "listening", label: "Listening" },
                  { key: "writing", label: "Writing" },
                  { key: "speaking", label: "Speaking" },
                  { key: "pronunciation", label: "Pronunciation" },
                ] as { key: PathwaySkill; label: string }[]
              ).map((skill) => {
                const score = skillProgress[skill.key];
                return (
                  <Link
                    key={skill.key}
                    href={skillHref[skill.key]}
                    style={{
                      background: "#f8fafc",
                      borderRadius: "8px",
                      padding: "10px",
                      textAlign: "center",
                      textDecoration: "none",
                    }}
                  >
                    <p style={{ fontSize: "11px", color: "#888", margin: "0 0 4px" }}>
                      {skill.label}
                    </p>
                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color:
                          score >= 80
                            ? "#0d9488"
                            : score >= 70
                              ? "#c9972c"
                              : "#ef4444",
                        margin: 0,
                      }}
                    >
                      {score}%
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "#888",
                letterSpacing: "2px",
                margin: "0 0 8px",
              }}
            >
              RECOMMENDED FOCUS
            </p>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#0d1b35",
                margin: "0 0 4px",
              }}
            >
              {recommendedFocus.label}
            </h2>
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 12px" }}>
              {recommendedFocus.reason}
            </p>
            <Link
              href={skillHref[recommendedFocus.skill]}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#0d9488",
                textDecoration: "none",
              }}
            >
              Open {recommendedFocus.skill} →
            </Link>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    letterSpacing: "2px",
                    margin: 0,
                  }}
                >
                  {terms.readinessLabel.toUpperCase()}
                </p>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#0d1b35",
                    margin: "4px 0 0",
                  }}
                >
                  Graduation Readiness
                </h2>
              </div>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#f0fdf4",
                  border: "3px solid #0d9488",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#0d9488",
                    margin: 0,
                  }}
                >
                  {graduationReadiness}%
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(
                [
                  { key: "grammar", label: "Grammar" },
                  { key: "vocabulary", label: "Vocabulary" },
                  { key: "reading", label: "Reading" },
                  { key: "listening", label: "Listening" },
                  { key: "writing", label: "Writing" },
                  { key: "speaking", label: "Speaking" },
                  { key: "pronunciation", label: "Pronunciation" },
                ] as { key: PathwaySkill; label: string }[]
              ).map((s) => {
                const pct = skillProgress[s.key];
                const target = 70;
                return (
                  <div
                    key={s.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "110px 1fr 40px",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <p style={{ fontSize: "13px", color: "#0d1b35", margin: 0 }}>
                      {s.label}
                    </p>
                    <div
                      style={{
                        background: "#f1f5f9",
                        borderRadius: "4px",
                        height: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "6px",
                          background: pct >= target ? "#0d9488" : "#c9972c",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: pct >= target ? "#0d9488" : "#c9972c",
                        margin: 0,
                        textAlign: "right",
                      }}
                    >
                      {pct}%
                    </p>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "1rem",
                padding: "10px",
                background: "#f0fdf4",
                borderRadius: "8px",
              }}
            >
              <p style={{ fontSize: "13px", color: "#0d9488", margin: 0 }}>
                {graduationReadiness >= 70
                  ? "✅ On track — graduation assessment unlocks in 8 days"
                  : "Keep building skill progress across all seven areas"}
              </p>
            </div>

            <Link
              href="/dashboard/pathway/student/graduation"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "12px",
                color: "#0d1b35",
                fontSize: "13px",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Preview {terms.assessmentLabel.toLowerCase()} →
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div
            style={{
              background: "#0d1b35",
              borderRadius: "12px",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "2px",
                margin: "0 0 8px",
              }}
            >
              {currentLevelName.split(" ")[0]} {terms.assessmentLabel.toUpperCase()}
            </p>
            <p
              style={{
                fontSize: "52px",
                fontWeight: 700,
                color: "#c9972c",
                margin: 0,
                lineHeight: 1,
              }}
            >
              8
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.7)",
                margin: "4px 0 12px",
              }}
            >
              days remaining
            </p>
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "10px",
                marginBottom: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                  margin: "0 0 4px",
                }}
              >
                Pass score required
              </p>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "white",
                  margin: 0,
                }}
              >
                70%
              </p>
            </div>
            <p style={{ fontSize: "13px", color: "#0d9488", margin: "0 0 12px" }}>
              ✓ Current readiness: {graduationReadiness}% —{" "}
              {graduationReadiness >= 70 ? "on track" : "building skills"}
            </p>
            <Link
              href="/dashboard/pathway/student/graduation"
              style={{
                display: "block",
                background: "#c9972c",
                color: "white",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Preview assessment →
            </Link>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "1rem",
              }}
            >
              <span style={{ fontSize: "32px" }}>🔥</span>
              <div>
                <p
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#0d1b35",
                    margin: 0,
                  }}
                >
                  {streakDays} days
                </p>
                <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                  current streak
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "4px",
                marginBottom: "1rem",
              }}
            >
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => {
                const isToday = i === new Date().getDay();
                const studied = i < new Date().getDay();
                return (
                  <div key={`${day}-${i}`} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "10px", color: "#888", margin: "0 0 4px" }}>
                      {day}
                    </p>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        margin: "0 auto",
                        background: isToday
                          ? "#0d1b35"
                          : studied
                            ? "#0d9488"
                            : "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {studied ? (
                        <span style={{ color: "white", fontSize: "12px" }}>✓</span>
                      ) : null}
                      {isToday ? (
                        <span
                          style={{
                            color: "#c9972c",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          •
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                textAlign: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#0d1b35",
                    margin: 0,
                  }}
                >
                  {data?.streak?.total_hours || 28}h
                </p>
                <p style={{ fontSize: "11px", color: "#888", margin: 0 }}>
                  total hours
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#0d1b35",
                    margin: 0,
                  }}
                >
                  {data?.streak?.total_tasks_completed || 84}
                </p>
                <p style={{ fontSize: "11px", color: "#888", margin: 0 }}>
                  tasks done
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#0d1b35",
                    margin: 0,
                  }}
                >
                  {data?.streak?.longest_streak || 15}
                </p>
                <p style={{ fontSize: "11px", color: "#888", margin: 0 }}>
                  best streak
                </p>
              </div>
            </div>

            <p
              style={{
                fontSize: "12px",
                color: "#0d9488",
                textAlign: "center",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              {getStreakMessage(streakDays)}
            </p>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                color: "#888",
                letterSpacing: "2px",
                margin: "0 0 12px",
              }}
            >
              QUICK ACCESS
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              {[
                {
                  label: "Grammar",
                  href: "/dashboard/pathway/student/grammar",
                  icon: "🔤",
                  color: "#eff6ff",
                },
                {
                  label: "Vocabulary",
                  href: "/dashboard/pathway/student/vocabulary",
                  icon: "📚",
                  color: "#f0fdf4",
                },
                {
                  label: "Reading",
                  href: "/dashboard/pathway/student/reading",
                  icon: "📖",
                  color: "#fefce8",
                },
                {
                  label: "Listening",
                  href: "/dashboard/pathway/student/listening",
                  icon: "🎧",
                  color: "#fdf4ff",
                },
                {
                  label: "Speaking",
                  href: "/dashboard/pathway/student/speaking",
                  icon: "🎤",
                  color: "#fff7ed",
                },
                {
                  label: "Writing",
                  href: "/dashboard/pathway/student/writing",
                  icon: "✍",
                  color: "#f0f9ff",
                },
                {
                  label: "Pronunciation",
                  href: "/dashboard/pathway/student/pronunciation",
                  icon: "🗣",
                  color: "#ecfdf5",
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: item.color,
                    textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{item.icon}</span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#0d1b35",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#888",
                  letterSpacing: "2px",
                  margin: 0,
                }}
              >
                MY PATHWAY
              </p>
              <Link
                href="/dashboard/pathway/student/my-pathway"
                style={{
                  fontSize: "12px",
                  color: "#0d9488",
                  textDecoration: "none",
                }}
              >
                View all →
              </Link>
            </div>
            {LEVEL_SEQUENCE.map((levelId, i) => {
              const levelData = data?.allLevels?.find(
                (l) => l.level_id === levelId
              );
              const isCompleted = levelData?.status === "completed";
              const isCurrent = levelData?.status === "active";
              return (
                <div
                  key={levelId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 0",
                    borderBottom: i < 9 ? "0.5px solid #f1f5f9" : "none",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>
                    {isCompleted ? "✅" : isCurrent ? "🔵" : "🔒"}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: isCurrent
                        ? "#0d1b35"
                        : isCompleted
                          ? "#0d9488"
                          : "#888",
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                  >
                    {PATHWAY_LEVEL_NAMES[levelId as keyof typeof PATHWAY_LEVEL_NAMES]}
                  </span>
                  {isCompleted && levelData?.overall_score ? (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "11px",
                        color: "#0d9488",
                        fontWeight: 600,
                      }}
                    >
                      {levelData.overall_score}%
                    </span>
                  ) : null}
                  {isCurrent ? (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "11px",
                        color: "#c9972c",
                        fontWeight: 600,
                      }}
                    >
                      Week {currentWeek}/5
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
