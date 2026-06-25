import { getCefrLevel } from "@/lib/course/cefrLevels";
import {
  fetchLevelById,
  isUuid,
  normalizeLevelRow,
  LEVELS_TABLE,
} from "@/lib/db/levels";

export { isUuid, normalizeLevelRow };

/** Normalize URL segment to hyphen form (b1_1 → b1-1) for static CEFR metadata lookup */
export function normalizeLevelSlug(levelId) {
  if (!levelId || typeof levelId !== "string") return levelId;
  if (isUuid(levelId)) return levelId;
  return levelId.toLowerCase().replace(/_/g, "-");
}

/**
 * Resolve a pathway level from the levels table by id (b1_1, a1_1, …).
 */
export async function resolvePathwayLevel(supabase, levelId) {
  const result = await fetchLevelById(supabase, levelId);
  if (result.level) return result;
  if (result.meta) {
    return {
      level: null,
      error: result.error,
      meta: result.meta ?? getCefrLevel(normalizeLevelSlug(levelId)),
    };
  }
  return result;
}

/** Re-export table constant for routes that need direct queries */
export { LEVELS_TABLE };
