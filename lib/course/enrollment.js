import { createClient } from "@supabase/supabase-js";
import { bandToLevelSlug } from "@/lib/course/pathwayEngine";
import { bandToProgramTrackSlug } from "@/lib/course/programTracks";
import { fetchLevelById, normalizeLevelRow } from "@/lib/db/levels";
import {
  LESSONS_TABLE,
  UNITS_TABLE,
} from "@/lib/db/courseTables";

export function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

export function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY || "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function enrollStudentInLevel({
  studentId,
  overallBand,
  targetBand,
  placementAttemptId,
  levelSlug,
}) {
  if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
    return { ok: false, error: "Database not configured" };
  }

  const supabase = getSupabase();
  const slug =
    levelSlug ||
    (overallBand != null ? bandToProgramTrackSlug(Number(overallBand)) : bandToLevelSlug(5));

  const { level: levelRow, error: levelError } = await fetchLevelById(supabase, slug);

  if (levelError && !levelRow) {
    return { ok: false, error: levelError };
  }

  const level = normalizeLevelRow(levelRow);
  if (!level) {
    return { ok: false, error: "Course level not found" };
  }

  const { data: enrollment, error: enrollError } = await supabase
    .from("course_enrollments")
    .upsert(
      {
        student_id: studentId,
        level_id: level.id,
        placement_attempt_id: placementAttemptId || null,
        status: "active",
        enrolled_at: new Date().toISOString(),
        recommended_from_band: overallBand ?? null,
        target_band: targetBand ?? null,
      },
      { onConflict: "student_id,level_id" }
    )
    .select("id, level_id")
    .single();

  if (enrollError) {
    return { ok: false, error: enrollError.message };
  }

  const certCode = `SPK-CERT-${new Date().getFullYear()}-${String(Math.abs(studentId.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)) % 100000).padStart(5, "0")}`;

  await supabase.from("certificates").upsert(
    {
      student_id: studentId,
      level_id: level.id,
      certificate_code: certCode,
      title: `${level.name} — Pathway Enrollment`,
      placement_band: overallBand ?? null,
      target_band: targetBand ?? null,
      metadata: { type: "pathway_enrollment" },
    },
    { onConflict: "certificate_code" }
  );

  return {
    ok: true,
    enrollmentId: enrollment.id,
    levelId: level.id,
    levelSlug: level.slug,
    levelName: level.name,
  };
}

export async function countCourseProgress(studentId, levelId) {
  const supabase = getSupabase();

  const { data: units } = await supabase
    .from(UNITS_TABLE)
    .select("id")
    .eq("level_id", levelId);

  const unitIds = (units ?? []).map((u) => u.id);
  if (!unitIds.length) return { completed: 0, total: 0 };

  const { data: lessons } = await supabase
    .from(LESSONS_TABLE)
    .select("id")
    .in("unit_id", unitIds);

  const lessonIds = (lessons ?? []).map((l) => l.id);
  const total = lessonIds.length;
  if (!total) return { completed: 0, total: 0 };

  const { count } = await supabase
    .from("student_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("status", "completed")
    .in("lesson_id", lessonIds);

  return { completed: count ?? 0, total };
}
