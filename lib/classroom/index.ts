/**
 * Speakify In-Person Classroom Textbook
 *
 * Routes (separate from /dashboard self-study LMS):
 * - /classroom                         Student home
 * - /classroom/[levelSlug]/[unitSlug]  Unit + lessons + quiz
 * - /classroom-teacher                 Teacher dashboard
 * - /admin/classroom                   CMS
 *
 * Content source of truth: content/classroom/<Level>/<unit-slug>/
 * Schema: supabase/migrations/classroom_schema.sql
 *
 * Tag in-person learners: users.student_type = 'in_person'
 */

export * from "./levels";
export * from "./types";
export * from "./studentTypeRouter";
export * from "./quizEngine";
export * from "./contentLoader";
export * from "./contentSchema";
export * from "./progressTracking";
export * from "./ttsHelper";
