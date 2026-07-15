/**
 * Soft Zod schemas for classroom filesystem content (pilot-tolerant).
 * Unknown keys are preserved via .passthrough().
 */

import { z } from "zod";

const looseRecord = z.record(z.string(), z.unknown());

export const unitMetaSchema = z
  .object({
    levelCode: z.string().optional(),
    unitNumber: z.coerce.number().int().positive().optional(),
    slug: z.string().optional(),
    title: z.string().optional(),
    theme: z.string().optional(),
    grammarPoint1: z.string().optional(),
    grammarPoint2: z.string().optional(),
    grammarFocus: z.string().optional(),
    objectives: z.array(z.string()).optional().default([]),
    learningObjectives: z.array(z.string()).optional(),
    status: z
      .enum(["draft", "published", "archived", "placeholder"])
      .optional()
      .default("draft"),
    lessons: z
      .array(
        z
          .object({
            lessonNumber: z.coerce.number().int().optional(),
            title: z.string().optional(),
            type: z
              .enum(["lesson", "extra_activities", "quiz"])
              .optional()
              .default("lesson"),
            file: z.string().optional(),
          })
          .passthrough()
      )
      .optional()
      .default([]),
  })
  .passthrough();

export type UnitMetaJson = z.infer<typeof unitMetaSchema>;

export const lessonSectionSchema = z
  .object({
    sectionType: z.string().optional(),
    type: z.string().optional(),
    orderIndex: z.coerce.number().int().optional(),
    title: z.string().optional(),
    content: looseRecord.optional().default({}),
  })
  .passthrough();

export const lessonJsonSchema = z
  .object({
    lessonNumber: z.coerce.number().int().optional(),
    title: z.string().optional(),
    type: z
      .enum(["lesson", "extra_activities", "quiz"])
      .optional()
      .default("lesson"),
    sections: z.array(lessonSectionSchema).optional().default([]),
  })
  .passthrough();

export type LessonJson = z.infer<typeof lessonJsonSchema>;

export const quizQuestionSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    type: z
      .enum(["mcq", "true_false", "gap_fill", "fill_blank", "matching"])
      .or(z.string()),
    prompt: z.string().optional().default(""),
    options: z.array(z.string()).optional(),
    answer: z.union([z.string(), z.array(z.string())]).optional(),
    pairs: z
      .array(
        z.object({
          left: z.string(),
          right: z.string(),
        })
      )
      .optional(),
    points: z.coerce.number().optional(),
  })
  .passthrough();

export const quizJsonSchema = z
  .object({
    title: z.string().optional().default("Unit Quiz"),
    questions: z.array(quizQuestionSchema).optional().default([]),
  })
  .passthrough();

export type QuizJson = z.infer<typeof quizJsonSchema>;

export function parseUnitMeta(data: unknown): UnitMetaJson {
  return unitMetaSchema.parse(data);
}

export function safeParseUnitMeta(data: unknown) {
  return unitMetaSchema.safeParse(data);
}

export function parseLessonJson(data: unknown): LessonJson {
  return lessonJsonSchema.parse(data);
}

export function safeParseLessonJson(data: unknown) {
  return lessonJsonSchema.safeParse(data);
}

export function parseQuizJson(data: unknown): QuizJson {
  return quizJsonSchema.parse(data);
}

export function safeParseQuizJson(data: unknown) {
  return quizJsonSchema.safeParse(data);
}
