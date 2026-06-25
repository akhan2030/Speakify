import { LESSONS_TABLE, UNITS_TABLE } from "@/lib/db/courseTables";
import { CEFR_SUB_LEVELS } from "@/lib/course/cefrLevels";
import { ensureLevelUnits } from "@/lib/pathway/generateLevelUnits";

/**
 * Find the lesson row for a level week + day type. Ensures units/lessons exist first.
 */
export async function resolvePathwayLesson(supabase, level, week, dayType) {
  console.log("[resolvePathwayLesson] Ensuring units exist for level:", level.id);
  await ensureLevelUnits(supabase, level);
  console.log("[resolvePathwayLesson] Units ready, fetching lesson row");

  const { data: unit, error: unitError } = await supabase
    .from(UNITS_TABLE)
    .select("id")
    .eq("level_id", level.id)
    .eq("week_number", week)
    .maybeSingle();

  if (unitError) {
    console.warn("[resolvePathwayLesson] unit", unitError.message);
    return null;
  }
  if (!unit?.id) return null;

  const { data: lesson, error: lessonError } = await supabase
    .from(LESSONS_TABLE)
    .select("id, title, content, day_type, content_generated_at")
    .eq("unit_id", unit.id)
    .eq("day_type", dayType)
    .maybeSingle();

  if (lessonError) {
    console.warn("[resolvePathwayLesson] lesson", lessonError.message);
    return null;
  }

  return lesson;
}

/** Persist generated lesson JSON to the lessons table. */
export async function cacheLessonContent(supabase, lessonId, content) {
  if (!lessonId || !content) return false;

  const { error } = await supabase
    .from(LESSONS_TABLE)
    .update({
      content,
      content_generated_at: new Date().toISOString(),
    })
    .eq("id", lessonId);

  if (error) {
    console.warn("[cacheLessonContent]", error.message);
    return false;
  }
  return true;
}

/** Pull vocabulary from cached input lessons on the previous level (for review day). */
export async function fetchPreviousLevelVocab(supabase, levelSlug) {
  const normalized = String(levelSlug ?? "").toLowerCase().replace(/_/g, "-");
  const idx = CEFR_SUB_LEVELS.findIndex(
    (l) => l.slug === normalized || l.code.toLowerCase().replace(".", "-") === normalized
  );
  if (idx <= 0) return [];

  const prev = CEFR_SUB_LEVELS[idx - 1];
  const prevId = prev.slug.replace(/-/g, "_");

  const { data: units } = await supabase
    .from(UNITS_TABLE)
    .select("id")
    .eq("level_id", prevId)
    .limit(3);

  if (!units?.length) return [];

  const unitIds = units.map((u) => u.id);
  const { data: lessons } = await supabase
    .from(LESSONS_TABLE)
    .select("content")
    .in("unit_id", unitIds)
    .eq("day_type", "input")
    .not("content", "is", null)
    .limit(3);

  const words = [];
  for (const row of lessons ?? []) {
    const vocab = row.content?.vocabulary;
    if (Array.isArray(vocab)) {
      for (const v of vocab) {
        if (v?.word) words.push(v);
      }
    }
  }
  return words.slice(0, 15);
}
