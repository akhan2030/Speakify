import type { StudyDay } from "@/lib/ielts/studyWeek";

const BASE = "/dashboard/ielts/student";

export type MissionTask = {
  id: string;
  title: string;
  minutes: number;
  href: string;
  taskType: string;
};

const DAY_TASKS: Record<StudyDay, MissionTask[]> = {
  sunday: [
    {
      id: "vocab-lesson",
      title: "Vocabulary lesson",
      minutes: 15,
      href: `${BASE}/vocabulary`,
      taskType: "vocabulary",
    },
    {
      id: "grammar-exercise",
      title: "Grammar exercise",
      minutes: 10,
      href: `${BASE}/grammar`,
      taskType: "grammar",
    },
    {
      id: "reading-set",
      title: "Reading practice set",
      minutes: 20,
      href: `${BASE}/reading`,
      taskType: "reading",
    },
    {
      id: "listening-warmup",
      title: "Listening warm-up",
      minutes: 10,
      href: `${BASE}/listening`,
      taskType: "listening",
    },
  ],
  monday: [
    {
      id: "reading-strategies",
      title: "Reading strategies lesson",
      minutes: 15,
      href: `${BASE}/reading`,
      taskType: "reading",
    },
    {
      id: "listening-input",
      title: "Listening skill input",
      minutes: 20,
      href: `${BASE}/listening`,
      taskType: "listening",
    },
    {
      id: "vocab-set",
      title: "Academic vocabulary set",
      minutes: 15,
      href: `${BASE}/vocabulary`,
      taskType: "vocabulary",
    },
    {
      id: "writing-structure",
      title: "Writing structure lesson",
      minutes: 20,
      href: `${BASE}/writing`,
      taskType: "writing",
    },
  ],
  tuesday: [
    {
      id: "reading-practice",
      title: "Reading practice set",
      minutes: 20,
      href: `${BASE}/reading`,
      taskType: "reading",
    },
    {
      id: "listening-practice",
      title: "Listening section practice",
      minutes: 20,
      href: `${BASE}/listening`,
      taskType: "listening",
    },
    {
      id: "speaking-part1",
      title: "Speaking Part 1 drill",
      minutes: 10,
      href: `${BASE}/speaking/part1`,
      taskType: "speaking",
    },
    {
      id: "grammar-drill",
      title: "Grammar drill",
      minutes: 10,
      href: `${BASE}/grammar`,
      taskType: "grammar",
    },
    {
      id: "daily-practice",
      title: "Daily practice tasks",
      minutes: 15,
      href: `${BASE}/practice`,
      taskType: "practice",
    },
  ],
  wednesday: [
    {
      id: "writing-task",
      title: "Writing task submission",
      minutes: 25,
      href: `${BASE}/writing`,
      taskType: "writing",
    },
    {
      id: "speaking-recording",
      title: "Speaking recording",
      minutes: 10,
      href: `${BASE}/speaking/part2`,
      taskType: "speaking",
    },
    {
      id: "vocab-review",
      title: "Vocabulary review",
      minutes: 10,
      href: `${BASE}/vocabulary`,
      taskType: "vocabulary",
    },
  ],
  thursday: [
    {
      id: "weak-skill-review",
      title: "Weak area review session",
      minutes: 20,
      href: `${BASE}/readiness`,
      taskType: "review",
    },
    {
      id: "vocab-booster",
      title: "Vocabulary booster set",
      minutes: 15,
      href: `${BASE}/vocabulary`,
      taskType: "vocabulary",
    },
    {
      id: "grammar-fix",
      title: "Grammar error correction",
      minutes: 10,
      href: `${BASE}/grammar`,
      taskType: "grammar",
    },
    {
      id: "reading-drill",
      title: "Reading question-type drill",
      minutes: 15,
      href: `${BASE}/reading`,
      taskType: "reading",
    },
  ],
  friday: [
    {
      id: "mini-mock",
      title: "Mini IELTS mock — 1 section",
      minutes: 30,
      href: `${BASE}/mock-exam`,
      taskType: "mock",
    },
    {
      id: "listening-section",
      title: "Listening section timed",
      minutes: 20,
      href: `${BASE}/listening`,
      taskType: "listening",
    },
    {
      id: "vocab-quiz",
      title: "Vocabulary quiz",
      minutes: 10,
      href: `${BASE}/vocabulary`,
      taskType: "vocabulary",
    },
  ],
  saturday: [
    {
      id: "week-review",
      title: "Review this week's progress",
      minutes: 15,
      href: `${BASE}/history`,
      taskType: "review",
    },
    {
      id: "readiness-check",
      title: "IELTS readiness check",
      minutes: 10,
      href: `${BASE}/readiness`,
      taskType: "readiness",
    },
    {
      id: "plan-sunday",
      title: "Preview Sunday's mission",
      minutes: 5,
      href: `${BASE}/weekly-plan`,
      taskType: "planning",
    },
    {
      id: "light-practice",
      title: "Light skill practice",
      minutes: 15,
      href: `${BASE}/practice`,
      taskType: "practice",
    },
  ],
};

export function getMissionTasksForDay(day: StudyDay): MissionTask[] {
  return DAY_TASKS[day] ?? DAY_TASKS.tuesday;
}

export function getWeakestSkillActions(
  skill: string,
  gap: number
): { title: string; minutes: number; href: string }[] {
  const base = `${BASE}/${skill}`;
  if (skill === "writing") {
    return [
      { title: "Essay structure lesson", minutes: 12, href: base },
      { title: "Opinion essay practice", minutes: 20, href: base },
      { title: "Vocabulary booster set 4", minutes: 10, href: `${BASE}/vocabulary` },
    ];
  }
  if (skill === "speaking") {
    return [
      { title: "Part 2 cue card practice", minutes: 15, href: `${BASE}/speaking/part2` },
      { title: "Fluency drill", minutes: 10, href: `${BASE}/speaking/part1` },
      { title: "Pronunciation tips", minutes: 10, href: `${BASE}/speaking` },
    ];
  }
  if (skill === "reading") {
    return [
      { title: "Matching headings drill", minutes: 15, href: base },
      { title: "T/F/NG practice set", minutes: 15, href: base },
      { title: "Timed reading section", minutes: 20, href: base },
    ];
  }
  return [
    { title: "Section 3 listening practice", minutes: 15, href: base },
    { title: "Note-taking drill", minutes: 10, href: base },
    { title: "Accent exposure set", minutes: 15, href: base },
  ];
}

export function estimateBandImprovement(gap: number): string {
  if (gap >= 1) return "+0.3";
  if (gap >= 0.5) return "+0.2";
  return "+0.1";
}
