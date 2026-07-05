import type { StudyDay } from "@/lib/ielts/studyWeek";
import type { AcceleratorTrackId } from "@/lib/accelerator/tracks";

const BASE = "/dashboard/ielts/student";

export type MissionTask = {
  id: string;
  title: string;
  minutes: number;
  href: string;
  taskType: string;
};

/** Foundation — core format, lighter drills, Part 1 speaking, Task 1 writing focus */
const FOUNDATION_DAY_TASKS: Record<StudyDay, MissionTask[]> = {
  sunday: [
    { id: "vocab-lesson", title: "Essential vocabulary set", minutes: 15, href: `${BASE}/vocabulary`, taskType: "vocabulary" },
    { id: "grammar-basics", title: "Core grammar for IELTS", minutes: 12, href: `${BASE}/grammar`, taskType: "grammar" },
    { id: "reading-intro", title: "IELTS reading format overview", minutes: 15, href: `${BASE}/reading`, taskType: "reading" },
    { id: "listening-s1", title: "Listening Section 1 warm-up", minutes: 12, href: `${BASE}/listening/section/1`, taskType: "listening" },
  ],
  monday: [
    { id: "grammar-tenses", title: "Present & past tenses in context", minutes: 15, href: `${BASE}/grammar/practice`, taskType: "grammar" },
    { id: "listening-gist", title: "Listening for gist & detail", minutes: 18, href: `${BASE}/listening`, taskType: "listening" },
    { id: "speaking-part1", title: "Speaking Part 1 confidence drill", minutes: 12, href: `${BASE}/speaking/part1`, taskType: "speaking" },
    { id: "vocab-core", title: "500-word core vocabulary set", minutes: 15, href: `${BASE}/vocabulary/study`, taskType: "vocabulary" },
  ],
  tuesday: [
    { id: "reading-mcq", title: "Multiple choice reading practice", minutes: 18, href: `${BASE}/reading/practice/multiple-choice`, taskType: "reading" },
    { id: "listening-form", title: "Form completion listening drill", minutes: 15, href: `${BASE}/listening/practice/form-completion`, taskType: "listening" },
    { id: "grammar-drill", title: "Grammar error correction", minutes: 10, href: `${BASE}/grammar`, taskType: "grammar" },
    { id: "vocab-quiz", title: "Vocabulary quiz", minutes: 10, href: `${BASE}/vocabulary/quiz`, taskType: "vocabulary" },
  ],
  wednesday: [
    { id: "writing-task1", title: "Writing Task 1 — charts & graphs", minutes: 25, href: `${BASE}/writing`, taskType: "writing" },
    { id: "speaking-part1-rec", title: "Speaking Part 1 recording", minutes: 10, href: `${BASE}/speaking/part1`, taskType: "speaking" },
    { id: "vocab-review", title: "Vocabulary review", minutes: 10, href: `${BASE}/vocabulary/review`, taskType: "vocabulary" },
  ],
  thursday: [
    { id: "weak-review", title: "Weak area review", minutes: 18, href: `${BASE}/readiness`, taskType: "review" },
    { id: "grammar-lesson", title: "Grammar lesson", minutes: 12, href: `${BASE}/grammar/lessons/tenses`, taskType: "grammar" },
    { id: "reading-short", title: "Short answer reading set", minutes: 15, href: `${BASE}/reading/practice/short-answer`, taskType: "reading" },
    { id: "listening-s2", title: "Listening Section 2 practice", minutes: 15, href: `${BASE}/listening/section/2`, taskType: "listening" },
  ],
  friday: [
    { id: "listening-mini", title: "Mini listening section (Sections 1–2)", minutes: 25, href: `${BASE}/listening/test`, taskType: "listening" },
    { id: "vocab-quiz-fri", title: "Weekly vocabulary quiz", minutes: 10, href: `${BASE}/vocabulary/quiz`, taskType: "vocabulary" },
    { id: "speaking-warmup", title: "Speaking warm-up", minutes: 10, href: `${BASE}/speaking`, taskType: "speaking" },
  ],
  saturday: [
    { id: "week-review", title: "Review this week's progress", minutes: 15, href: `${BASE}/history`, taskType: "review" },
    { id: "readiness-check", title: "IELTS readiness check", minutes: 10, href: `${BASE}/readiness`, taskType: "readiness" },
    { id: "plan-sunday", title: "Preview Sunday's mission", minutes: 5, href: `${BASE}/weekly-plan`, taskType: "planning" },
    { id: "light-practice", title: "Light skill practice", minutes: 12, href: `${BASE}/practice`, taskType: "practice" },
  ],
};

/** Plus — strategy drills, T/F/NG, full section mocks, Part 2/3 speaking */
const PLUS_DAY_TASKS: Record<StudyDay, MissionTask[]> = {
  sunday: [
    { id: "vocab-lesson", title: "Vocabulary lesson", minutes: 15, href: `${BASE}/vocabulary`, taskType: "vocabulary" },
    { id: "grammar-exercise", title: "Grammar exercise", minutes: 10, href: `${BASE}/grammar`, taskType: "grammar" },
    { id: "reading-set", title: "Reading practice set", minutes: 20, href: `${BASE}/reading`, taskType: "reading" },
    { id: "listening-warmup", title: "Listening warm-up", minutes: 10, href: `${BASE}/listening`, taskType: "listening" },
  ],
  monday: [
    { id: "reading-strategies", title: "Reading strategies — T/F/NG & headings", minutes: 15, href: `${BASE}/reading/strategies`, taskType: "reading" },
    { id: "listening-input", title: "Listening note-taking & prediction", minutes: 20, href: `${BASE}/listening`, taskType: "listening" },
    { id: "vocab-set", title: "Academic vocabulary expansion", minutes: 15, href: `${BASE}/vocabulary`, taskType: "vocabulary" },
    { id: "writing-structure", title: "Writing Task 1 & 2 structure", minutes: 20, href: `${BASE}/writing`, taskType: "writing" },
  ],
  tuesday: [
    { id: "reading-tfng", title: "T/F/NG timed passage", minutes: 20, href: `${BASE}/reading/practice/true-false-not-given`, taskType: "reading" },
    { id: "listening-practice", title: "Listening section practice", minutes: 20, href: `${BASE}/listening`, taskType: "listening" },
    { id: "speaking-part1", title: "Speaking Part 1 drill", minutes: 10, href: `${BASE}/speaking/part1`, taskType: "speaking" },
    { id: "grammar-drill", title: "Grammar drill", minutes: 10, href: `${BASE}/grammar`, taskType: "grammar" },
    { id: "daily-practice", title: "Daily practice tasks", minutes: 15, href: `${BASE}/practice`, taskType: "practice" },
  ],
  wednesday: [
    { id: "writing-task", title: "Writing Task 2 submission", minutes: 25, href: `${BASE}/writing`, taskType: "writing" },
    { id: "speaking-part2", title: "Speaking Part 2 cue card", minutes: 12, href: `${BASE}/speaking/part2`, taskType: "speaking" },
    { id: "vocab-review", title: "Vocabulary review", minutes: 10, href: `${BASE}/vocabulary/review`, taskType: "vocabulary" },
  ],
  thursday: [
    { id: "weak-skill-review", title: "Weak area review session", minutes: 20, href: `${BASE}/readiness`, taskType: "review" },
    { id: "vocab-booster", title: "Collocation & phrase bank", minutes: 15, href: `${BASE}/vocabulary/phrases`, taskType: "vocabulary" },
    { id: "grammar-fix", title: "Grammar error correction", minutes: 10, href: `${BASE}/grammar/practice`, taskType: "grammar" },
    { id: "reading-headings", title: "Matching headings drill", minutes: 15, href: `${BASE}/reading/practice/matching-headings`, taskType: "reading" },
  ],
  friday: [
    { id: "mini-mock", title: "Mini IELTS mock — 1 section", minutes: 30, href: `${BASE}/mock-exam`, taskType: "mock" },
    { id: "listening-section", title: "Full listening section timed", minutes: 20, href: `${BASE}/listening/test`, taskType: "listening" },
    { id: "vocab-quiz", title: "Vocabulary quiz", minutes: 10, href: `${BASE}/vocabulary/quiz`, taskType: "vocabulary" },
  ],
  saturday: [
    { id: "week-review", title: "Review this week's progress", minutes: 15, href: `${BASE}/history`, taskType: "review" },
    { id: "readiness-check", title: "IELTS readiness check", minutes: 10, href: `${BASE}/readiness`, taskType: "readiness" },
    { id: "plan-sunday", title: "Preview Sunday's mission", minutes: 5, href: `${BASE}/weekly-plan`, taskType: "planning" },
    { id: "speaking-part3", title: "Speaking Part 3 discussion", minutes: 12, href: `${BASE}/speaking/part3`, taskType: "speaking" },
  ],
};

/** Elite — timed full sections, advanced inference, high-band writing & speaking mock */
const ELITE_DAY_TASKS: Record<StudyDay, MissionTask[]> = {
  sunday: [
    { id: "vocab-precision", title: "Advanced lexical resource set", minutes: 15, href: `${BASE}/vocabulary/phrases`, taskType: "vocabulary" },
    { id: "reading-attitude", title: "Reading — inference & author attitude", minutes: 20, href: `${BASE}/reading/strategies`, taskType: "reading" },
    { id: "listening-attitude", title: "Listening — attitude & implied meaning", minutes: 18, href: `${BASE}/listening/section/3`, taskType: "listening" },
    { id: "grammar-precision", title: "Advanced grammar precision", minutes: 12, href: `${BASE}/grammar`, taskType: "grammar" },
  ],
  monday: [
    { id: "reading-timed", title: "Timed reading passage — full section pace", minutes: 25, href: `${BASE}/reading/test/passage/multiple-choice`, taskType: "reading" },
    { id: "listening-s3-s4", title: "Sections 3 & 4 listening under time", minutes: 22, href: `${BASE}/listening/test`, taskType: "listening" },
    { id: "writing-nuance", title: "Band 7+ writing — nuance & argumentation", minutes: 30, href: `${BASE}/writing`, taskType: "writing" },
    { id: "vocab-collocation", title: "Collocation mastery set", minutes: 12, href: `${BASE}/vocabulary`, taskType: "vocabulary" },
  ],
  tuesday: [
    { id: "reading-tfng-timed", title: "T/F/NG under exam timing", minutes: 22, href: `${BASE}/reading/practice/true-false-not-given`, taskType: "reading" },
    { id: "reading-headings-timed", title: "Matching headings — timed", minutes: 20, href: `${BASE}/reading/practice/matching-headings`, taskType: "reading" },
    { id: "speaking-mock", title: "Full speaking mock (Parts 1–3)", minutes: 18, href: `${BASE}/speaking/mock`, taskType: "speaking" },
    { id: "grammar-advanced", title: "Complex sentence structures", minutes: 12, href: `${BASE}/grammar/practice`, taskType: "grammar" },
  ],
  wednesday: [
    { id: "writing-both-tasks", title: "Writing Task 1 + Task 2 timed block", minutes: 45, href: `${BASE}/writing`, taskType: "writing" },
    { id: "speaking-part2-3", title: "Part 2 cue card + Part 3 follow-up", minutes: 18, href: `${BASE}/speaking/part2`, taskType: "speaking" },
    { id: "vocab-review", title: "Advanced vocabulary review", minutes: 10, href: `${BASE}/vocabulary/review`, taskType: "vocabulary" },
  ],
  thursday: [
    { id: "weak-skill-push", title: "High-band weak-area push", minutes: 22, href: `${BASE}/readiness`, taskType: "review" },
    { id: "reading-full-passage", title: "Full reading passage — 20 min", minutes: 20, href: `${BASE}/reading/test`, taskType: "reading" },
    { id: "listening-full", title: "Full listening test simulation", minutes: 30, href: `${BASE}/listening/test`, taskType: "listening" },
    { id: "vocab-booster", title: "Precision vocabulary booster", minutes: 12, href: `${BASE}/vocabulary/quiz`, taskType: "vocabulary" },
  ],
  friday: [
    { id: "full-mock", title: "Full timed mock exam", minutes: 45, href: `${BASE}/mock-exam`, taskType: "mock" },
    { id: "exam-strategy", title: "Exam-day strategy review", minutes: 15, href: `${BASE}/reading/strategies`, taskType: "reading" },
    { id: "speaking-fluency", title: "Natural discourse & fluency drill", minutes: 15, href: `${BASE}/speaking/part3`, taskType: "speaking" },
  ],
  saturday: [
    { id: "week-review", title: "Intensive week review", minutes: 15, href: `${BASE}/history`, taskType: "review" },
    { id: "readiness-check", title: "Band 7+ readiness check", minutes: 12, href: `${BASE}/readiness`, taskType: "readiness" },
    { id: "mock-debrief", title: "Mock exam debrief", minutes: 15, href: `${BASE}/mock-exam`, taskType: "mock" },
    { id: "plan-sunday", title: "Preview next week", minutes: 5, href: `${BASE}/weekly-plan`, taskType: "planning" },
  ],
};

const TRACK_DAY_TASKS: Record<AcceleratorTrackId, Record<StudyDay, MissionTask[]>> = {
  foundation: FOUNDATION_DAY_TASKS,
  plus: PLUS_DAY_TASKS,
  elite: ELITE_DAY_TASKS,
};

export function getMissionTasksForDay(
  day: StudyDay,
  track: AcceleratorTrackId = "plus"
): MissionTask[] {
  const tasks = TRACK_DAY_TASKS[track]?.[day] ?? TRACK_DAY_TASKS.plus[day];
  return tasks ?? PLUS_DAY_TASKS.tuesday;
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
