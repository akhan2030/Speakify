/** Supabase table names (actual DB schema) */
export const LEVELS_TABLE = "levels";
export const UNITS_TABLE = "units";
export const LESSONS_TABLE = "lessons";
export const ASSESSMENTS_TABLE = "assessments";

/** Map DB lesson row → shape expected by pathway/course UI (day_type acts as slug) */
export function normalizeLessonRow(row) {
  if (!row) return null;
  return {
    ...row,
    slug: row.slug ?? row.day_type ?? null,
    content_type:
      row.content_type ?? (row.is_review ? "review" : "new"),
    estimated_minutes: row.estimated_minutes ?? 45,
    sort_order: row.sort_order ?? 0,
    skill: row.skill ?? null,
    progression_weight: row.progression_weight ?? 30,
  };
}

/** Map DB assessment row → shape expected by routes (type → assessment_type) */
export function normalizeAssessmentRow(row) {
  if (!row) return null;
  return {
    ...row,
    assessment_type: row.assessment_type ?? row.type ?? null,
    title: row.title ?? row.type ?? "Assessment",
    description: row.description ?? null,
    sort_order: row.sort_order ?? 0,
  };
}

export function normalizeUnitRow(row) {
  if (!row) return null;
  return {
    ...row,
    slug: row.slug ?? (row.week_number != null ? `week-${row.week_number}` : null),
    description: row.description ?? row.focus ?? null,
    unit_type: row.unit_type ?? "weekly",
    sort_order: row.sort_order ?? row.week_number ?? 0,
  };
}
