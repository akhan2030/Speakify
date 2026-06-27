import type { StudyDay } from "@/lib/ielts/studyWeek";

const BASE = "/dashboard/ielts-general/student";

export type GeneralMissionTask = {
  id: string;
  title: string;
  minutes: number;
  href: string;
  taskType: string;
};

const DAY_TASKS: Record<StudyDay, GeneralMissionTask[]> = {
  sunday: [
    {
      id: "vocab-lesson",
      title: "General vocabulary lesson",
      minutes: 15,
      href: `${BASE}/vocabulary`,
      taskType: "vocabulary",
    },
    {
      id: "grammar-exercise",
      title: "Grammar for letters & essays",
      minutes: 10,
      href: `${BASE}/grammar`,
      taskType: "grammar",
    },
    {
      id: "reading-section-a",
      title: "Reading Section A — social notices",
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
      id: "letter-formal",
      title: "Formal letter — structure lesson",
      minutes: 15,
      href: `${BASE}/letter-practice`,
      taskType: "letter",
    },
    {
      id: "reading-section-b",
      title: "Reading Section B — workplace texts",
      minutes: 20,
      href: `${BASE}/reading`,
      taskType: "reading",
    },
    {
      id: "vocab-set",
      title: "Everyday vocabulary set",
      minutes: 15,
      href: `${BASE}/vocabulary`,
      taskType: "vocabulary",
    },
    {
      id: "essay-structure",
      title: "Essay structure — General Task 2",
      minutes: 20,
      href: `${BASE}/writing`,
      taskType: "writing",
    },
  ],
  tuesday: [
    {
      id: "reading-section-c",
      title: "Reading Section C — long passage",
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
      id: "letter-semi-formal",
      title: "Semi-formal letter practice",
      minutes: 15,
      href: `${BASE}/letter-practice`,
      taskType: "letter",
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
      id: "writing-letter",
      title: "Letter writing submission",
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
      id: "letter-informal",
      title: "Informal letter practice",
      minutes: 15,
      href: `${BASE}/letter-practice`,
      taskType: "letter",
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
      title: "Reading Sections A–C drill",
      minutes: 15,
      href: `${BASE}/reading`,
      taskType: "reading",
    },
  ],
  friday: [
    {
      id: "mini-mock",
      title: "Mini General mock — 1 section",
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
      id: "essay-practice",
      title: "Essay practice — General Task 2",
      minutes: 25,
      href: `${BASE}/writing`,
      taskType: "writing",
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
      title: "General Training readiness check",
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
      title: "Light letter & essay practice",
      minutes: 15,
      href: `${BASE}/letter-practice`,
      taskType: "letter",
    },
  ],
};

export function getGeneralMissionTasksForDay(day: StudyDay): GeneralMissionTask[] {
  return DAY_TASKS[day] ?? DAY_TASKS.tuesday;
}

export function getGeneralWeakestSkillActions(
  skill: string,
  _gap: number
): { title: string; minutes: number; href: string }[] {
  const base = `${BASE}/${skill === "writing" ? "writing" : skill}`;
  if (skill === "writing") {
    return [
      { title: "Formal letter structure", minutes: 12, href: `${BASE}/letter-practice` },
      { title: "General Task 2 essay practice", minutes: 20, href: `${BASE}/writing` },
      { title: "Letter tone & register drill", minutes: 10, href: `${BASE}/letter-practice` },
    ];
  }
  if (skill === "speaking") {
    return [
      { title: "Part 2 cue card practice", minutes: 15, href: `${BASE}/speaking/part2` },
      { title: "Fluency drill", minutes: 10, href: `${BASE}/speaking/part1` },
      { title: "Everyday topic vocabulary", minutes: 10, href: `${BASE}/vocabulary` },
    ];
  }
  if (skill === "reading") {
    return [
      { title: "Section A — notices & ads", minutes: 15, href: `${BASE}/reading` },
      { title: "Section B — workplace texts", minutes: 15, href: `${BASE}/reading` },
      { title: "Section C — timed long passage", minutes: 20, href: `${BASE}/reading` },
    ];
  }
  return [
    { title: "Section 3 listening practice", minutes: 15, href: `${BASE}/listening` },
    { title: "Note-taking drill", minutes: 10, href: `${BASE}/listening` },
    { title: "Everyday conversation listening", minutes: 15, href: `${BASE}/listening` },
  ];
}

export function estimateGeneralBandImprovement(gap: number): string {
  if (gap >= 1) return "+0.3";
  if (gap >= 0.5) return "+0.2";
  return "+0.1";
}
