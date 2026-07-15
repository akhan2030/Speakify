/**
 * Speakify in-person classroom textbook — shared TypeScript types.
 */

export type StudentType = "self_study" | "in_person";

export type ClassroomLevelCode =
  | "AB"
  | "A1.1"
  | "A1.2"
  | "A2.1"
  | "A2.2"
  | "B1.1"
  | "B1.2"
  | "B2.1"
  | "B2.2"
  | "C1.1"
  | "C1.2"
  | "C2.1"
  | "C2.2";

export type UnitStatus = "draft" | "published" | "archived";

export type LessonType = "lesson" | "extra_activities" | "quiz";

/** Content block kinds used inside lessons / unit JSON. */
export type SectionType =
  | "vocab"
  | "vocabulary"
  | "grammar"
  | "listening"
  | "speaking"
  | "reading"
  | "writing"
  | "mcq"
  | "fill_blank"
  | "gap_fill"
  | "matching"
  | "true_false"
  | "warm_up"
  | "objectives"
  | "task"
  | "post_task"
  | "pre_task"
  | "word_search"
  | "wordlist"
  | "reflection"
  | "discussion"
  | "comprehension"
  | "cultural_bridge"
  | "quiz"
  | "answer_key"
  | "teacher_notes"
  | "instructions"
  | "example"
  | "practice";

export type QuizQuestionType =
  | "mcq"
  | "true_false"
  | "gap_fill"
  | "fill_blank"
  | "matching";

export interface VocabItem {
  word: string;
  definition?: string;
  example?: string;
  collocation?: string;
  arabicHint?: string;
  partOfSpeech?: string;
  audioUrl?: string;
}

export interface Section {
  id?: string;
  sectionType: SectionType;
  orderIndex: number;
  title?: string;
  content: Record<string, unknown>;
}

export interface Lesson {
  id?: string;
  unitId?: string;
  lessonNumber: number;
  title: string;
  type: LessonType;
  sections?: Section[];
}

export interface QuizQuestion {
  id: string | number;
  type: QuizQuestionType;
  prompt: string;
  options?: string[];
  /** Canonical answer for mcq / true_false / gap_fill */
  answer?: string | string[];
  /** Matching pairs: left -> right */
  pairs?: { left: string; right: string }[];
  points?: number;
}

export interface Quiz {
  id?: string;
  unitId?: string;
  title: string;
  questions: QuizQuestion[];
}

export interface Unit {
  id?: string;
  levelId?: string;
  levelCode?: ClassroomLevelCode | string;
  unitNumber: number;
  slug: string;
  title: string;
  theme?: string;
  grammarPoint1?: string;
  grammarPoint2?: string;
  objectives?: string[];
  status?: UnitStatus;
  lessons?: Lesson[];
  quiz?: Quiz;
}

export interface ClassGroup {
  id?: string;
  name: string;
  levelId: string;
  levelCode?: ClassroomLevelCode | string;
  teacherId?: string | null;
  schedule?: string | null;
  studentIds?: string[];
}

export interface StudentProgress {
  studentId: string;
  unitId: string;
  lessonNumber: number;
  completedAt?: string;
}

export interface AttendanceRecord {
  classId: string;
  studentId: string;
  date: string;
  present: boolean;
}

export interface ClassroomMedia {
  id?: string;
  filename: string;
  url: string;
  mediaType: string;
  labels?: string[] | Record<string, unknown>;
  createdAt?: string;
}
