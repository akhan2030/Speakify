import type { AcceleratorTrackId } from "./tracks";
import type { AcceleratorSectionId } from "./practiceMeta";
import { getSectionMeta, TARGET_BAND_LABEL } from "./practiceMeta";

export type JourneyStepStatus = "completed" | "current" | "locked";

export type JourneyStep = {
  id: string;
  title: string;
  status: JourneyStepStatus;
  section?: AcceleratorSectionId | null;
};

export type MicroSkill = {
  id: string;
  label: string;
  status: JourneyStepStatus;
};

export type WeeklyPlanItem = {
  id: string;
  label: string;
  section: AcceleratorSectionId | "vocabulary";
  estimatedMinutes: number;
  completed: boolean;
};

export type SkillReadiness = {
  section: AcceleratorSectionId;
  label: string;
  readinessPercent: number;
  lastScore: number | null;
  lastBand: number | null;
  color: "red" | "amber" | "gold" | "teal";
};

export type ContinueActivity = {
  label: string;
  section: AcceleratorSectionId;
  testType: "section_practice" | "full_mock";
  testId: string | null;
  scorePercent: number | null;
  completedAt: string | null;
};

export type NextActivity = {
  label: string;
  section: AcceleratorSectionId;
  testType: "section_practice" | "full_mock";
  testId: string | null;
  estimatedMinutes: number;
  reason: string;
};

export type DailyPractice = {
  items: { label: string; minutes: number; section: AcceleratorSectionId | "vocabulary" }[];
  totalMinutes: number;
};

export type Gamification = {
  level: number;
  xp: number;
  xpToNext: number;
  nextBadge: string;
  xpProgressPercent: number;
};

export type LearningJourney = {
  track: AcceleratorTrackId;
  trackTitle: string;
  targetBandLabel: string;
  overallReadiness: number;
  graduationTarget: number;
  graduationLabel: string;
  nextActivity: NextActivity;
  continueActivity: ContinueActivity | null;
  journeySteps: JourneyStep[];
  weeklyPlan: WeeklyPlanItem[];
  weeklyCompleted: number;
  skillReadiness: SkillReadiness[];
  microSkills: Record<AcceleratorSectionId, MicroSkill[]>;
  dailyPractice: DailyPractice;
  gamification: Gamification;
};

type DashboardInput = {
  fullMock: {
    testId: string | null;
    topic: string | null;
    hasFresh: boolean;
    previous: { bandScore: number | null; completedAt: string } | null;
  };
  sections: Record<
    AcceleratorSectionId,
    { hasFresh: boolean; testId: string | null; topic: string | null }
  >;
  lastBySection: Record<
    AcceleratorSectionId,
    {
      accuracy: number | null;
      bandScore: number | null;
      score: number | null;
      completedAt: string | null;
    } | null
  >;
  seenCount?: number;
  poolCount?: number;
};

const TRACK_TITLES: Record<AcceleratorTrackId, string> = {
  foundation: "IELTS Foundation",
  plus: "IELTS Plus",
  elite: "IELTS Elite",
};

const GRADUATION_TARGET: Record<AcceleratorTrackId, number> = {
  foundation: 70,
  plus: 75,
  elite: 80,
};

const JOURNEY_STEPS: Record<AcceleratorTrackId, { id: string; title: string; section?: AcceleratorSectionId }[]> = {
  foundation: [
    { id: "diagnostic", title: "Diagnostic" },
    { id: "listening_basics", title: "Listening Essentials", section: "listening" },
    { id: "reading_basics", title: "Reading Essentials", section: "reading" },
    { id: "vocabulary", title: "Vocabulary Builder" },
    { id: "writing_fundamentals", title: "Writing Fundamentals", section: "writing" },
    { id: "speaking_fundamentals", title: "Speaking Fundamentals", section: "speaking" },
    { id: "integrated", title: "Integrated Practice" },
    { id: "mini_mock", title: "Mini Mock Tests" },
    { id: "full_mock", title: "Full Mock Tests", section: "listening" },
    { id: "graduation", title: "Track completion check" },
  ],
  plus: [
    { id: "diagnostic", title: "Diagnostic" },
    { id: "listening", title: "Listening Mastery", section: "listening" },
    { id: "reading", title: "Reading Mastery", section: "reading" },
    { id: "vocabulary", title: "Academic Vocabulary" },
    { id: "writing", title: "Writing Task 1 & 2", section: "writing" },
    { id: "speaking", title: "Speaking Fluency", section: "speaking" },
    { id: "integrated", title: "Integrated Practice" },
    { id: "full_mock_1", title: "Full Mock #1" },
    { id: "full_mock_2", title: "Full Mock #2" },
    { id: "graduation", title: "Band 6.5 readiness check" },
  ],
  elite: [
    { id: "diagnostic", title: "Diagnostic" },
    { id: "listening", title: "Advanced Listening", section: "listening" },
    { id: "reading", title: "Advanced Reading", section: "reading" },
    { id: "writing", title: "Band 7+ Writing", section: "writing" },
    { id: "speaking", title: "Band 7+ Speaking", section: "speaking" },
    { id: "integrated", title: "Timed Integration" },
    { id: "full_mock_1", title: "Full Mock #1" },
    { id: "full_mock_2", title: "Full Mock #2" },
    { id: "graduation", title: "Elite track completion check" },
  ],
};

const MICRO_SKILLS: Record<AcceleratorTrackId, Record<AcceleratorSectionId, string[]>> = {
  foundation: {
    listening: ["Form Completion", "Note Completion", "Multiple Choice", "Matching", "Map Labelling"],
    reading: ["T/F/NG", "Sentence Completion", "Matching Headings", "Summary Completion"],
    writing: ["Task 1 Structure", "Overview Writing", "Data Comparison", "Task Response"],
    speaking: ["Part 1 Fluency", "Cue Card Structure", "Part 3 Opinions", "Pronunciation"],
  },
  plus: {
    listening: ["Academic Discussion", "Campus Maps", "Matching", "Lecture Notes"],
    reading: ["Matching Headings", "Y/N/NG", "Summary Completion", "Inference"],
    writing: ["Graph Combo", "Process Diagram", "Balanced Essay", "Cohesion"],
    speaking: ["Extended Part 1", "Cue Card Examples", "Abstract Part 3", "Fluency Drills"],
  },
  elite: {
    listening: ["Fast Lecture", "Multi-speaker Panel", "Complex Notes", "Inference"],
    reading: ["Author Attitude", "Implicit Meaning", "All Question Types", "Speed Reading"],
    writing: ["Complex Data", "Nuanced Argument", "Lexical Range", "Task Achievement"],
    speaking: ["Idiomatic Part 1", "Nuanced Cue Card", "Speculation", "C1 Discourse"],
  },
};

const BADGES: Record<AcceleratorTrackId, string[]> = {
  foundation: ["First Steps", "Listening Explorer", "Reading Explorer", "Writing Starter", "Foundation Graduate"],
  plus: ["Plus Achiever", "Reading Strategist", "Essay Architect", "Plus Graduate"],
  elite: ["Elite Scholar", "Band 7 Writer", "Fluent Speaker", "Elite Graduate"],
};

function clamp(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function readinessColor(p: number): SkillReadiness["color"] {
  if (p >= 70) return "teal";
  if (p >= 50) return "gold";
  if (p >= 35) return "amber";
  return "red";
}

function sectionReadiness(
  last: DashboardInput["lastBySection"][AcceleratorSectionId],
  placementFallback: number
): number {
  if (last?.accuracy != null) return clamp(Number(last.accuracy) * 100);
  if (last?.bandScore != null) return clamp((Number(last.bandScore) / 9) * 100);
  return placementFallback;
}

function buildJourneySteps(
  track: AcceleratorTrackId,
  lastBySection: DashboardInput["lastBySection"],
  fullMockDone: boolean
): JourneyStep[] {
  const defs = JOURNEY_STEPS[track];
  const sectionAttempts = (s?: AcceleratorSectionId) => (s ? !!lastBySection[s] : false);
  const anyAttempt = Object.values(lastBySection).some(Boolean) || fullMockDone;

  let foundCurrent = false;
  return defs.map((def, idx) => {
    let completed = false;
    if (def.id === "diagnostic") completed = anyAttempt;
    else if (def.id === "vocabulary") completed = anyAttempt;
    else if (def.id.startsWith("full_mock")) completed = fullMockDone;
    else if (def.id === "graduation") completed = fullMockDone && Object.values(lastBySection).filter(Boolean).length >= 3;
    else if (def.section) completed = sectionAttempts(def.section);
    else if (def.id === "integrated") {
      completed = ["listening", "reading", "writing", "speaking"].filter((s) => sectionAttempts(s as AcceleratorSectionId)).length >= 2;
    } else completed = idx > 0 && anyAttempt;

    if (completed) return { ...def, status: "completed" as const };

    if (!foundCurrent) {
      foundCurrent = true;
      return { ...def, status: "current" as const };
    }
    return { ...def, status: "locked" as const };
  });
}

function buildMicroSkills(
  track: AcceleratorTrackId,
  lastBySection: DashboardInput["lastBySection"]
): Record<AcceleratorSectionId, MicroSkill[]> {
  const out = {} as Record<AcceleratorSectionId, MicroSkill[]>;
  for (const section of ["listening", "reading", "writing", "speaking"] as AcceleratorSectionId[]) {
    const skills = MICRO_SKILLS[track][section];
    const hasSectionAttempt = !!lastBySection[section];
    out[section] = skills.map((label, i) => {
      if (hasSectionAttempt && i < 2) return { id: `${section}_${i}`, label, status: "completed" as const };
      if (!hasSectionAttempt && i === 0) return { id: `${section}_${i}`, label, status: "current" as const };
      if (hasSectionAttempt && i === 2) return { id: `${section}_${i}`, label, status: "current" as const };
      if (hasSectionAttempt && i < 3) return { id: `${section}_${i}`, label, status: "completed" as const };
      return { id: `${section}_${i}`, label, status: "locked" as const };
    });
  }
  return out;
}

function buildWeeklyPlan(
  track: AcceleratorTrackId,
  lastBySection: DashboardInput["lastBySection"]
): WeeklyPlanItem[] {
  const items: WeeklyPlanItem[] = [
    { id: "w_listening", label: "Listening Practice", section: "listening", estimatedMinutes: getSectionMeta(track, "listening").estimatedMinutes, completed: !!lastBySection.listening },
    { id: "w_reading", label: "Reading Practice", section: "reading", estimatedMinutes: getSectionMeta(track, "reading").estimatedMinutes, completed: !!lastBySection.reading },
    { id: "w_vocab", label: "Vocabulary Set", section: "vocabulary", estimatedMinutes: 15, completed: false },
    { id: "w_writing", label: "Writing Task 1", section: "writing", estimatedMinutes: 25, completed: !!lastBySection.writing },
    { id: "w_speaking", label: "Speaking Drill", section: "speaking", estimatedMinutes: 15, completed: !!lastBySection.speaking },
  ];
  return items;
}

function pickNextActivity(
  track: AcceleratorTrackId,
  dashboard: DashboardInput,
  skillReadiness: SkillReadiness[]
): NextActivity {
  const weakest = [...skillReadiness].sort((a, b) => a.readinessPercent - b.readinessPercent)[0];
  const section = weakest?.section ?? "listening";
  const meta = getSectionMeta(track, section);
  const avail = dashboard.sections[section];
  const attemptNum = (dashboard.seenCount ?? 0) + 1;

  return {
    label: `${meta.name} Practice #${Math.min(attemptNum, 12)}`,
    section,
    testType: "section_practice",
    testId: avail?.testId ?? null,
    estimatedMinutes: meta.estimatedMinutes,
    reason: weakest
      ? `Lowest readiness: ${weakest.label} (${weakest.readinessPercent}%)`
      : "Start your first practice session",
  };
}

function pickContinue(dashboard: DashboardInput, track: AcceleratorTrackId): ContinueActivity | null {
  let best: ContinueActivity | null = null;
  let bestTime = 0;

  for (const section of ["listening", "reading", "writing", "speaking"] as AcceleratorSectionId[]) {
    const last = dashboard.lastBySection[section];
    if (!last?.completedAt) continue;
    const t = new Date(last.completedAt).getTime();
    if (t > bestTime) {
      bestTime = t;
      const meta = getSectionMeta(track, section);
      best = {
        label: `${meta.name} Practice`,
        section,
        testType: "section_practice",
        testId: dashboard.sections[section]?.testId ?? null,
        scorePercent: last.accuracy != null ? clamp(Number(last.accuracy) * 100) : null,
        completedAt: last.completedAt,
      };
    }
  }
  return best;
}

function buildGamification(
  track: AcceleratorTrackId,
  dashboard: DashboardInput
): Gamification {
  const sectionsDone = Object.values(dashboard.lastBySection).filter(Boolean).length;
  const xp =
    (dashboard.seenCount ?? 0) * 40 +
    sectionsDone * 120 +
    (dashboard.fullMock.previous ? 250 : 0);
  const level = Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  const badges = BADGES[track];
  const badgeIdx = Math.min(badges.length - 1, Math.floor(sectionsDone / 1.5));

  return {
    level,
    xp,
    xpToNext: 1000 - xpInLevel,
    nextBadge: badges[badgeIdx] ?? badges[0],
    xpProgressPercent: clamp((xpInLevel / 1000) * 100),
  };
}

export function buildLearningJourney(
  track: AcceleratorTrackId,
  dashboard: DashboardInput,
  options?: { placementBand?: number | null; globalReadiness?: number | null }
): LearningJourney {
  const placementFallback = options?.placementBand
    ? clamp((options.placementBand / 9) * 100)
    : 25;

  const skillReadiness: SkillReadiness[] = (
    ["listening", "reading", "writing", "speaking"] as AcceleratorSectionId[]
  ).map((section) => {
    const meta = getSectionMeta(track, section);
    const last = dashboard.lastBySection[section];
    const readinessPercent = sectionReadiness(last, placementFallback);
    return {
      section,
      label: meta.name,
      readinessPercent,
      lastScore: last?.accuracy != null ? clamp(Number(last.accuracy) * 100) : null,
      lastBand: last?.bandScore != null ? Number(last.bandScore) : null,
      color: readinessColor(readinessPercent),
    };
  });

  const overallReadiness =
    options?.globalReadiness ??
    clamp(skillReadiness.reduce((s, r) => s + r.readinessPercent, 0) / skillReadiness.length);

  const fullMockDone = !!dashboard.fullMock.previous;

  return {
    track,
    trackTitle: TRACK_TITLES[track],
    targetBandLabel: TARGET_BAND_LABEL[track],
    overallReadiness,
    graduationTarget: GRADUATION_TARGET[track],
    graduationLabel:
      track === "foundation"
        ? "Foundation track completion"
        : track === "plus"
          ? "Plus track completion"
          : "Elite track completion",
    nextActivity: pickNextActivity(track, dashboard, skillReadiness),
    continueActivity: pickContinue(dashboard, track),
    journeySteps: buildJourneySteps(track, dashboard.lastBySection, fullMockDone),
    weeklyPlan: buildWeeklyPlan(track, dashboard.lastBySection),
    weeklyCompleted: buildWeeklyPlan(track, dashboard.lastBySection).filter((w) => w.completed).length,
    skillReadiness,
    microSkills: buildMicroSkills(track, dashboard.lastBySection),
    dailyPractice: {
      items: [
        { label: "Vocabulary", minutes: 5, section: "vocabulary" },
        { label: "Listening", minutes: 5, section: "listening" },
        { label: "Reading", minutes: 5, section: "reading" },
      ],
      totalMinutes: 15,
    },
    gamification: buildGamification(track, dashboard),
  };
}

export function readinessBarColor(p: number): string {
  if (p >= 70) return "#0d9488";
  if (p >= 50) return "#c9972c";
  if (p >= 35) return "#f59e0b";
  return "#ef4444";
}
