import {
  getCefrLevel,
  CEFR_SUB_LEVELS,
  defaultSubLevelForBand,
  normalizeCefrSlug,
} from "@/lib/course/cefrLevels";
import { cefrCodeToSlug } from "@/lib/pathway/levelDisplay";
import { LEVELS_TABLE } from "./courseTables";

export { LEVELS_TABLE } from "./courseTables";

/** Legacy FK embed name — no PostgREST relationship on student_level_progress; use level_id + fetchLevelById */
export const LEVELS_FK = "levels";

export function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function parseParentBand(levelId) {
  const m = String(levelId).toLowerCase().match(/^([abc][12])$/);
  return m ? m[1].toUpperCase() : null;
}

/** Build id candidates: b1_1, b1-1, b2 → b2_1, etc. */
export function levelIdCandidates(levelId) {
  if (!levelId || typeof levelId !== "string") return [];
  const lower = levelId.toLowerCase();
  const hyphen = lower.replace(/_/g, "-");
  const underscore = lower.replace(/-/g, "_");
  const candidates = [underscore, hyphen, lower, levelId];

  const meta = getCefrLevel(levelId);
  if (meta) {
    candidates.push(
      meta.slug,
      meta.slug.replace(/-/g, "_"),
      meta.code.toLowerCase().replace(".", "_"),
      meta.code.toLowerCase().replace(".", "-")
    );
  }

  const parent = parseParentBand(lower);
  if (parent) {
    const sub = defaultSubLevelForBand(parent);
    if (sub) {
      candidates.push(sub.slug, sub.slug.replace(/-/g, "_"));
    }
  }

  return [...new Set(candidates.filter(Boolean))];
}

export function cefrCodeToLevelId(code) {
  if (!code?.trim()) return "b1_1";
  const trimmed = code.trim();
  if (/^[abc][12]$/i.test(trimmed)) {
    return getCefrLevel(trimmed)?.slug.replace(/-/g, "_") ?? `${trimmed.toLowerCase()}_1`;
  }
  return trimmed.toLowerCase().replace(".", "_");
}

/** Map DB row (id, cefr, duration_weeks, …) to fields expected by pathway/course APIs */
export function normalizeLevelRow(row) {
  if (!row) return null;
  const id = row.id ?? row.slug;
  return {
    ...row,
    id,
    slug: row.slug ?? id,
    cefr_sub_level: row.cefr_sub_level ?? row.cefr ?? null,
    week_count: row.week_count ?? row.duration_weeks ?? 4,
    sort_order: row.sort_order ?? row.order_index ?? 0,
    description: row.description ?? row.focus ?? null,
    track_type: row.track_type ?? "cefr",
  };
}

export function levelMatchesPlacement(level, placementCode) {
  if (!level || !placementCode) return false;
  const key = String(level.slug ?? level.id ?? "").toLowerCase();
  const hyphenSlug = cefrCodeToSlug(placementCode).toLowerCase();
  const underscoreId = cefrCodeToLevelId(placementCode);
  const cefr = String(level.cefr_sub_level ?? level.cefr ?? "").toUpperCase();
  return (
    cefr === placementCode.toUpperCase() ||
    level.cefr_sub_level === placementCode ||
    key === hyphenSlug ||
    key === underscoreId ||
    key === hyphenSlug.replace(/-/g, "_")
  );
}

export async function fetchLevelById(supabase, levelId) {
  if (!levelId) return { level: null, error: "Level id required" };

  for (const id of levelIdCandidates(levelId)) {
    const { data, error } = await supabase
      .from(LEVELS_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return { level: null, error: error.message };
    }
    if (data) return { level: normalizeLevelRow(data), error: null };
  }

  const normalized = normalizeCefrSlug(levelId);
  const subMatch = normalized.match(/^([abc][12])-([12])$/i);
  if (subMatch) {
    const cefrCode = `${subMatch[1].toUpperCase()}.${subMatch[2]}`;
    const { data, error } = await supabase
      .from(LEVELS_TABLE)
      .select("*")
      .eq("cefr", cefrCode)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return { level: null, error: error.message };
    }
    if (data) return { level: normalizeLevelRow(data), error: null };
  }

  const parentBand = parseParentBand(levelId);
  if (parentBand) {
    const { data: byBand, error: bandError } = await supabase
      .from(LEVELS_TABLE)
      .select("*")
      .ilike("cefr", `${parentBand}.%`)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (bandError && bandError.code !== "PGRST116") {
      return { level: null, error: bandError.message };
    }
    if (byBand) return { level: normalizeLevelRow(byBand), error: null };
  }

  const meta = getCefrLevel(levelId);
  if (meta) {
    return {
      level: null,
      error: `Level "${levelId}" is not in the database yet.`,
      meta,
    };
  }

  return { level: null, error: `Level not found: ${levelId}` };
}

export async function fetchAllLevels(supabase) {
  const { data, error } = await supabase
    .from(LEVELS_TABLE)
    .select("*")
    .order("order_index", { ascending: true });

  if (error || !data?.length) {
    return CEFR_SUB_LEVELS.map((l, i) =>
      normalizeLevelRow({
        id: l.slug.replace(/-/g, "_"),
        slug: l.slug.replace(/-/g, "_"),
        name: l.name,
        description: l.description,
        cefr: l.code,
        cefr_sub_level: l.code,
        week_count: l.weekCount,
        duration_weeks: l.weekCount,
        sort_order: l.sortOrder,
        order_index: i + 1,
      })
    );
  }

  return data.map((row, i) =>
    normalizeLevelRow({
      ...row,
      order_index: row.order_index ?? i + 1,
    })
  );
}

/** @deprecated No FK embed on student_level_progress — select level_id and resolve via fetchLevelById */
export function levelJoinSelect(fields = "id, cefr, name") {
  return `${LEVELS_FK}(${fields})`;
}
