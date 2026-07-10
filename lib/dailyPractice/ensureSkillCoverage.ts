import type { DailyPracticeProgramme } from "@/lib/dailyPractice/programme";
import { isGeneralTrainingProgramme } from "@/lib/dailyPractice/programme";

export const PRACTICE_SKILLS = [
  "vocabulary",
  "reading",
  "listening",
  "speaking",
  "writing",
  "grammar",
] as const;

export type PracticeSkill = (typeof PRACTICE_SKILLS)[number];

export type PracticeTaskLike = {
  id: string;
  skill?: string;
  title?: string;
  topic?: string;
  task_type?: string;
  taskType?: string;
  cefr_level?: string;
  cefrLevel?: string;
  estimated_minutes?: number;
  estimatedMinutes?: number;
  wordCount?: number;
  source?: "published" | "draft" | "rotation";
  practiceHref?: string;
  focusReason?: string | null;
  isPersonalized?: boolean;
  priority?: number;
};

type RotationItem = {
  title: string;
  minutes: number;
  topic?: string;
  task_type?: string;
};

const ROTATION_POOLS: Record<PracticeSkill, RotationItem[]> = {
  vocabulary: [
    { title: "Travel & Culture", minutes: 12, topic: "travel_culture", task_type: "vocabulary_topic" },
    { title: "Work & Study", minutes: 12, topic: "work_study", task_type: "vocabulary_topic" },
    { title: "Health & Lifestyle", minutes: 12, topic: "health_lifestyle", task_type: "vocabulary_topic" },
    { title: "Environment", minutes: 12, topic: "environment", task_type: "vocabulary_topic" },
  ],
  reading: [
    { title: "Reading: True, False, Not Given", minutes: 20, task_type: "reading_passage" },
    { title: "Reading: Matching Headings", minutes: 18, task_type: "reading_passage" },
    { title: "Reading: Sentence Completion", minutes: 16, task_type: "reading_passage" },
    { title: "Reading: Summary Completion", minutes: 18, task_type: "reading_passage" },
  ],
  listening: [
    { title: "Listening: Section 1 — Form completion", minutes: 15, task_type: "listening_transcript" },
    { title: "Listening: Section 2 — Monologue", minutes: 15, task_type: "listening_transcript" },
    { title: "Listening: Section 3 — Discussion", minutes: 18, task_type: "listening_transcript" },
    { title: "Listening: Section 4 — Lecture", minutes: 18, task_type: "listening_transcript" },
  ],
  speaking: [
    { title: "Speaking: Daily practice with Sarah", minutes: 15, task_type: "speaking_session" },
    { title: "Speaking: Part 2 cue card drill", minutes: 12, task_type: "speaking_cue_card" },
    { title: "Speaking: Part 3 discussion practice", minutes: 14, task_type: "speaking_discussion" },
  ],
  writing: [
    { title: "Writing Task 1: Chart description", minutes: 25, task_type: "writing_task1" },
    { title: "Writing Task 2: Opinion essay", minutes: 40, task_type: "writing_task2" },
    { title: "Writing Task 1: Process diagram", minutes: 25, task_type: "writing_task1" },
    { title: "Writing Task 2: Discussion essay", minutes: 40, task_type: "writing_task2" },
  ],
  grammar: [
    { title: "Grammar: Present perfect for experience", minutes: 20, task_type: "grammar_lesson" },
    { title: "Grammar: Conditionals for IELTS", minutes: 20, task_type: "grammar_lesson" },
    { title: "Grammar: Relative clauses", minutes: 18, task_type: "grammar_lesson" },
    { title: "Grammar: Articles and determiners", minutes: 16, task_type: "grammar_lesson" },
  ],
};

const GT_ROTATION_POOLS: Record<PracticeSkill, RotationItem[]> = {
  vocabulary: [
    { title: "Vocabulary: Work & everyday English", minutes: 12, topic: "work", task_type: "vocabulary_topic" },
    { title: "Vocabulary: Travel & social life", minutes: 12, topic: "travel", task_type: "vocabulary_topic" },
    { title: "Vocabulary: Health & lifestyle", minutes: 12, topic: "health", task_type: "vocabulary_topic" },
    { title: "Vocabulary: Communication", minutes: 12, topic: "communication", task_type: "vocabulary_topic" },
  ],
  reading: [
    { title: "GT Reading: Section A — everyday texts", minutes: 18, topic: "section-a", task_type: "gt_reading_section" },
    { title: "GT Reading: Section B — workplace", minutes: 18, topic: "section-b", task_type: "gt_reading_section" },
    { title: "GT Reading: Section C — extended texts", minutes: 20, topic: "section-c", task_type: "gt_reading_section" },
  ],
  listening: [
    { title: "GT Listening: Form completion", minutes: 15, task_type: "listening_transcript", topic: "form-completion" },
    { title: "GT Listening: Everyday conversation", minutes: 15, task_type: "listening_transcript", topic: "multiple-choice" },
    { title: "GT Listening: Social monologue", minutes: 15, task_type: "listening_transcript", topic: "note-completion" },
  ],
  speaking: [
    { title: "GT Speaking: Daily practice with Sarah", minutes: 15, task_type: "speaking_session" },
    { title: "GT Speaking: Part 2 cue card", minutes: 12, task_type: "speaking_cue_card" },
    { title: "GT Speaking: Part 3 discussion", minutes: 14, task_type: "speaking_discussion" },
  ],
  writing: [
    { title: "GT Writing Task 1: Formal letter", minutes: 25, task_type: "gt_letter", topic: "formal" },
    { title: "GT Writing Task 1: Informal letter", minutes: 25, task_type: "gt_letter", topic: "informal" },
    { title: "GT Writing Task 2: Everyday essay", minutes: 40, task_type: "writing_task2" },
  ],
  grammar: [
    { title: "GT Grammar: Tenses for letters", minutes: 20, task_type: "grammar_lesson", topic: "tenses" },
    { title: "GT Grammar: Formal register", minutes: 18, task_type: "grammar_lesson", topic: "academic-structures" },
    { title: "GT Grammar: Articles & determiners", minutes: 16, task_type: "grammar_lesson", topic: "articles" },
    { title: "GT Grammar: Conditionals", minutes: 20, task_type: "grammar_lesson", topic: "conditionals" },
  ],
};

function rotationPoolsForProgramme(programme: DailyPracticeProgramme) {
  return isGeneralTrainingProgramme(programme) ? GT_ROTATION_POOLS : ROTATION_POOLS;
}

function hashIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return length > 0 ? hash % length : 0;
}

export function getTodayDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function skillKey(task: PracticeTaskLike): string {
  return String(task.skill ?? "").toLowerCase();
}

function hasSkill(tasks: PracticeTaskLike[], skill: PracticeSkill): boolean {
  return tasks.some((task) => skillKey(task) === skill);
}

function buildRotationTask(
  skill: PracticeSkill,
  cefrLevel: string,
  dateKey: string,
  programme: DailyPracticeProgramme = "ielts"
): PracticeTaskLike {
  const pool = rotationPoolsForProgramme(programme)[skill];
  const pick = pool[hashIndex(`${skill}-${cefrLevel}-${dateKey}`, pool.length)];
  return {
    id: `rotation-${skill}-${dateKey}`,
    skill,
    title: pick.title,
    topic: pick.topic,
    task_type: pick.task_type,
    taskType: pick.task_type,
    cefr_level: cefrLevel,
    cefrLevel: cefrLevel,
    estimated_minutes: pick.minutes,
    estimatedMinutes: pick.minutes,
    source: "rotation",
  };
}

/** Guarantee one card per IELTS skill so Daily Practice never shows empty tabs. */
export function ensureDailySkillCoverage(
  tasks: PracticeTaskLike[],
  options: { cefrLevel: string; dateKey?: string; programme?: DailyPracticeProgramme }
): PracticeTaskLike[] {
  const dateKey = options.dateKey ?? getTodayDateKey();
  const cefrLevel = options.cefrLevel || "B1.1";
  const programme = options.programme ?? "ielts";
  const result = [...tasks];

  for (const skill of PRACTICE_SKILLS) {
    if (!hasSkill(result, skill)) {
      result.push(buildRotationTask(skill, cefrLevel, dateKey, programme));
    }
  }

  const skillOrder = new Map(PRACTICE_SKILLS.map((skill, index) => [skill, index]));
  return result.sort((a, b) => {
    const aIndex = skillOrder.get(skillKey(a) as PracticeSkill) ?? 99;
    const bIndex = skillOrder.get(skillKey(b) as PracticeSkill) ?? 99;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return String(a.title ?? "").localeCompare(String(b.title ?? ""));
  });
}
