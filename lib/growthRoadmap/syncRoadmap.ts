import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionDeduction } from "@/lib/growthRoadmap/extractDeductions";
import {
  CRITERION_DISPLAY_LABELS,
  PRACTICE_RECOMMENDATION_SEEDS,
  type RoadmapSkill,
} from "@/lib/growthRoadmap/seedRecommendations";

const ACTIVE_STATUSES = ["pending", "in_progress", "completed", "still_present"] as const;

type PracticeRecommendationRow = {
  id: string;
  skill: string;
  criterion: string;
  trigger_pattern: string;
  task_title: string;
  task_description: string;
  task_type: string;
  estimated_band_impact: number;
  estimated_sessions_to_resolve: number;
  estimated_minutes: number;
  task_href: string | null;
};

let seedsEnsured = false;

export async function ensurePracticeRecommendationSeeds(
  supabase: SupabaseClient
): Promise<void> {
  if (seedsEnsured) return;

  const { error } = await supabase.from("practice_recommendations").upsert(
    PRACTICE_RECOMMENDATION_SEEDS.map((seed) => ({
      skill: seed.skill,
      criterion: seed.criterion,
      trigger_pattern: seed.trigger_pattern,
      task_title: seed.task_title,
      task_description: seed.task_description,
      task_type: seed.task_type,
      estimated_band_impact: seed.estimated_band_impact,
      estimated_sessions_to_resolve: seed.estimated_sessions_to_resolve,
      estimated_minutes: seed.estimated_minutes,
      task_href: seed.task_href ?? null,
    })),
    { onConflict: "skill,criterion,trigger_pattern", ignoreDuplicates: false }
  );

  if (error) {
    console.warn("[growthRoadmap] seed upsert:", error.message);
  } else {
    seedsEnsured = true;
  }
}

async function findRecommendation(
  supabase: SupabaseClient,
  skill: RoadmapSkill,
  criterion: string,
  triggerPattern: string
): Promise<PracticeRecommendationRow | null> {
  const { data, error } = await supabase
    .from("practice_recommendations")
    .select("*")
    .eq("skill", skill)
    .eq("criterion", criterion)
    .eq("trigger_pattern", triggerPattern)
    .maybeSingle();

  if (error) {
    console.warn("[growthRoadmap] findRecommendation:", error.message);
    return null;
  }
  return (data as PracticeRecommendationRow | null) ?? null;
}

async function findActiveRoadmapItem(
  supabase: SupabaseClient,
  studentId: string,
  skill: RoadmapSkill,
  triggerPattern: string
) {
  const { data, error } = await supabase
    .from("student_roadmap_items")
    .select("*")
    .eq("student_id", studentId)
    .eq("skill", skill)
    .eq("trigger_pattern", triggerPattern)
    .in("status", [...ACTIVE_STATUSES])
    .maybeSingle();

  if (error) {
    console.warn("[growthRoadmap] findActiveRoadmapItem:", error.message);
    return null;
  }
  return data;
}

export async function syncRoadmapFromSessionScore(input: {
  supabase: SupabaseClient;
  studentId: string;
  sourceSessionId: string;
  skill: RoadmapSkill;
  deductions: SessionDeduction[];
}): Promise<void> {
  const { supabase, studentId, sourceSessionId, skill, deductions } = input;

  try {
    await ensurePracticeRecommendationSeeds(supabase);
  } catch (err) {
    console.warn(
      "[growthRoadmap] ensure seeds failed:",
      err instanceof Error ? err.message : err
    );
    return;
  }

  const presentPatterns = new Set(deductions.map((d) => d.trigger_pattern));
  const now = new Date().toISOString();

  const { data: activeItems, error: listError } = await supabase
    .from("student_roadmap_items")
    .select("*")
    .eq("student_id", studentId)
    .eq("skill", skill)
    .in("status", [...ACTIVE_STATUSES]);

  if (listError) {
    console.warn("[growthRoadmap] list active:", listError.message);
    return;
  }

  for (const item of activeItems ?? []) {
    const pattern = String(item.trigger_pattern);
    const stillFlagged = presentPatterns.has(pattern);

    if (!stillFlagged && item.status === "completed") {
      await supabase
        .from("student_roadmap_items")
        .update({
          status: "resolved",
          resolved_at: now,
          last_seen_session_id: sourceSessionId,
          updated_at: now,
        })
        .eq("id", item.id);
      continue;
    }

    if (stillFlagged && item.status === "completed") {
      await supabase
        .from("student_roadmap_items")
        .update({
          status: "still_present",
          last_seen_session_id: sourceSessionId,
          source_session_id: sourceSessionId,
          updated_at: now,
        })
        .eq("id", item.id);
    }
  }

  for (const deduction of deductions) {
    const recommendation = await findRecommendation(
      supabase,
      skill,
      deduction.criterion,
      deduction.trigger_pattern
    );

    if (!recommendation) continue;

    const existing = await findActiveRoadmapItem(
      supabase,
      studentId,
      skill,
      deduction.trigger_pattern
    );

    if (existing) {
      const nextStatus =
        existing.status === "still_present" ? "still_present" : existing.status;

      await supabase
        .from("student_roadmap_items")
        .update({
          source_session_id: sourceSessionId,
          last_seen_session_id: sourceSessionId,
          practice_recommendation_id: recommendation.id,
          criterion: deduction.criterion,
          status: nextStatus,
          updated_at: now,
        })
        .eq("id", existing.id);
      continue;
    }

    const { error: insertError } = await supabase.from("student_roadmap_items").insert({
      student_id: studentId,
      source_session_id: sourceSessionId,
      last_seen_session_id: sourceSessionId,
      skill,
      criterion: deduction.criterion,
      trigger_pattern: deduction.trigger_pattern,
      practice_recommendation_id: recommendation.id,
      status: "pending",
      assigned_at: now,
      updated_at: now,
    });

    if (insertError) {
      console.warn("[growthRoadmap] insert item:", insertError.message);
    }
  }
}

export type RoadmapItemView = {
  id: string;
  skill: RoadmapSkill;
  criterion: string;
  trigger_pattern: string;
  status: string;
  assigned_at: string;
  completed_at: string | null;
  resolved_at: string | null;
  source_session_id: string | null;
  task_title: string;
  task_description: string;
  task_type: string;
  estimated_band_impact: number;
  estimated_sessions_to_resolve: number;
  estimated_minutes: number;
  task_href: string | null;
  criterion_label: string;
};

export async function fetchStudentRoadmapItems(
  supabase: SupabaseClient,
  studentId: string,
  options?: { activeOnly?: boolean; limit?: number }
): Promise<RoadmapItemView[]> {
  await ensurePracticeRecommendationSeeds(supabase);

  let query = supabase
    .from("student_roadmap_items")
    .select(
      `
      id,
      skill,
      criterion,
      trigger_pattern,
      status,
      assigned_at,
      completed_at,
      resolved_at,
      source_session_id,
      practice_recommendations (
        task_title,
        task_description,
        task_type,
        estimated_band_impact,
        estimated_sessions_to_resolve,
        estimated_minutes,
        task_href
      )
    `
    )
    .eq("student_id", studentId);

  if (options?.activeOnly !== false) {
    query = query.in("status", ["pending", "in_progress", "completed", "still_present"]);
  }

  query = query.limit(options?.limit ?? 50);

  const { data, error } = await query;
  if (error) {
    console.warn("[growthRoadmap] fetch items:", error.message);
    return [];
  }

  const mapped = (data ?? []).map((row) => {
    const rec = Array.isArray(row.practice_recommendations)
      ? row.practice_recommendations[0]
      : row.practice_recommendations;

    const criterion = String(row.criterion);
    return {
      id: String(row.id),
      skill: row.skill as RoadmapSkill,
      criterion,
      trigger_pattern: String(row.trigger_pattern),
      status: String(row.status),
      assigned_at: String(row.assigned_at),
      completed_at: row.completed_at ? String(row.completed_at) : null,
      resolved_at: row.resolved_at ? String(row.resolved_at) : null,
      source_session_id: row.source_session_id ? String(row.source_session_id) : null,
      task_title: String(rec?.task_title ?? "Practice task"),
      task_description: String(rec?.task_description ?? ""),
      task_type: String(rec?.task_type ?? "drill"),
      estimated_band_impact: Number(rec?.estimated_band_impact) || 0.25,
      estimated_sessions_to_resolve: Number(rec?.estimated_sessions_to_resolve) || 2,
      estimated_minutes: Number(rec?.estimated_minutes) || 10,
      task_href: rec?.task_href ? String(rec.task_href) : null,
      criterion_label:
        CRITERION_DISPLAY_LABELS[criterion as keyof typeof CRITERION_DISPLAY_LABELS] ??
        criterion,
    } satisfies RoadmapItemView;
  });

  return mapped.sort((a, b) => {
    const statusOrder = (s: string) => {
      if (s === "still_present") return 0;
      if (s === "pending") return 1;
      if (s === "in_progress") return 2;
      if (s === "completed") return 3;
      if (s === "resolved") return 4;
      return 5;
    };
    const diff = statusOrder(a.status) - statusOrder(b.status);
    if (diff !== 0) return diff;
    return b.estimated_band_impact - a.estimated_band_impact;
  });
}

export async function markRoadmapItemCompleted(
  supabase: SupabaseClient,
  studentId: string,
  itemId: string
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("student_roadmap_items")
    .update({
      status: "completed",
      completed_at: now,
      updated_at: now,
    })
    .eq("id", itemId)
    .eq("student_id", studentId)
    .in("status", ["pending", "in_progress", "still_present"])
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Item not found or already completed" };
  }
  return { ok: true };
}

export function roadmapItemsToDashboardRecs(
  items: RoadmapItemView[],
  programme: "ielts" | "ielts_general" = "ielts"
) {
  const prefix =
    programme === "ielts_general" ? "/dashboard/ielts-general/student" : "/dashboard/ielts/student";

  return items
    .filter((item) => item.status === "pending" || item.status === "still_present")
    .slice(0, 3)
    .map((item) => {
      const href =
        item.task_href ??
        (item.skill === "speaking"
          ? `${prefix}/speaking?mode=practice`
          : `${prefix}/writing`);

      return {
        title: item.task_title,
        minutes: item.estimated_minutes,
        href,
        estimatedBandGain: item.estimated_band_impact,
        subtitle: `${item.criterion_label} · from your last ${item.skill} session`,
        roadmapItemId: item.id,
      };
    });
}
