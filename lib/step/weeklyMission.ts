/**
 * Day-of-week missions for the STEP Accelerator (single adaptive course).
 */

import { STEP_ROUTES } from "./paths";

export type StepDayMission = {
  day: string;
  dayIndex: number;
  title: string;
  description: string;
  minutes: number;
  href: string;
};

const BASE = STEP_ROUTES.home;

export const WEEKLY_STEP_MISSIONS: StepDayMission[] = [
  {
    day: "Sunday",
    dayIndex: 0,
    title: "STEP format review",
    description: "Review Qiyas format, section weights, timing rules, and exam-day strategy.",
    minutes: 30,
    href: `${BASE}/weekly-plan`,
  },
  {
    day: "Monday",
    dayIndex: 1,
    title: "Reading — 2 passages + questions",
    description: "Skimming, inference, and vocabulary-in-context practice.",
    minutes: 45,
    href: STEP_ROUTES.practice("reading"),
  },
  {
    day: "Tuesday",
    dayIndex: 2,
    title: "Structure — 20 grammar drills",
    description: "Tenses, prepositions, subject–verb agreement under time pressure.",
    minutes: 35,
    href: `${BASE}/grammar-drills`,
  },
  {
    day: "Wednesday",
    dayIndex: 3,
    title: "Listening — 2 recordings + questions",
    description: "One-play dialogues — numbers, idioms, and detail questions.",
    minutes: 40,
    href: STEP_ROUTES.practice("listening"),
  },
  {
    day: "Thursday",
    dayIndex: 4,
    title: "Compositional + weak area review",
    description: "Punctuation, word order, plus targeted review of your weakest section.",
    minutes: 35,
    href: STEP_ROUTES.practice("compositional_analysis"),
  },
  {
    day: "Friday",
    dayIndex: 5,
    title: "Mini mock — 40 questions timed",
    description: "Timed mixed-section drill simulating exam pressure.",
    minutes: 60,
    href: `${BASE}/mini-mocks`,
  },
  {
    day: "Saturday",
    dayIndex: 6,
    title: "Review week + prepare Sunday",
    description: "Review mistakes, revisit weak items, and preview next week's focus.",
    minutes: 30,
    href: `${BASE}/progress`,
  },
];

export function todayStepMission(date = new Date()): StepDayMission {
  const idx = date.getDay();
  return WEEKLY_STEP_MISSIONS[idx] ?? WEEKLY_STEP_MISSIONS[0];
}

export function nextFridayLabel(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  if (daysUntilFriday === 0) return "this Friday";
  d.setDate(d.getDate() + daysUntilFriday);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
