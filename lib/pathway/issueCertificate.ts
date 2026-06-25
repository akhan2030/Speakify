import type { SupabaseClient } from "@supabase/supabase-js";
import { getNextLevelSlug, CEFR_SUB_LEVELS } from "@/lib/course/cefrLevels";
import { getPathwayLevelDisplay } from "@/lib/pathway/levelDisplay";
import {
  generateCertificateId,
  gradeFromScore,
  type GraduationSkill,
} from "@/lib/pathway/graduationTestConfig";
import { fetchLevelById } from "@/lib/db/levels";

export type IssueCertificateInput = {
  studentId: string;
  studentName: string;
  levelId: string;
  levelSlug: string;
  cefrCode: string;
  levelName: string;
  overallScore: number;
  sectionScores: Record<GraduationSkill, number>;
};

export async function issuePathwayCertificate(
  supabase: SupabaseClient,
  input: IssueCertificateInput
) {
  const certificateCode = generateCertificateId(input.cefrCode);
  const display = getPathwayLevelDisplay(input.cefrCode);
  const nextSlug = getNextLevelSlug(input.levelSlug);
  const nextMeta = nextSlug
    ? CEFR_SUB_LEVELS.find((l) => l.slug === nextSlug)
    : null;
  const nextDisplay = nextMeta
    ? getPathwayLevelDisplay(nextMeta.code)
    : null;

  const sectionGrades = Object.fromEntries(
    Object.entries(input.sectionScores).map(([skill, score]) => [
      skill,
      { score, grade: gradeFromScore(Number(score)) },
    ])
  );

  const issuedAt = new Date().toISOString();

  await supabase.from("certificates").insert({
    student_id: input.studentId,
    level_id: input.levelId,
    certificate_code: certificateCode,
    title: `${input.cefrCode} — ${display.displayName} Graduation`,
    metadata: {
      type: "pathway_graduation",
      overallScore: input.overallScore,
      sectionScores: input.sectionScores,
      sectionGrades,
      levelName: `${input.cefrCode} — ${display.displayName}`,
      nextLevel: nextMeta?.code ?? null,
      nextLevelName: nextDisplay
        ? `${nextMeta?.code} — ${nextDisplay.displayName}`
        : null,
    },
  });

  await supabase
    .from("student_level_progress")
    .update({
      status: "completed",
      overall_score: input.overallScore,
      completed_at: issuedAt,
    })
    .eq("student_id", input.studentId)
    .eq("level_id", input.levelId);

  if (nextSlug && nextMeta) {
    const { level: nextLevel } = await fetchLevelById(supabase, nextSlug);

    if (nextLevel?.id) {
      await supabase.from("student_level_progress").upsert(
        {
          student_id: input.studentId,
          level_id: nextLevel.id,
          status: "active",
          current_week: 1,
          started_at: issuedAt,
        },
        { onConflict: "student_id,level_id" }
      );

      await supabase
        .from("users")
        .update({ cefr_level: nextMeta.code })
        .eq("id", input.studentId);
    }
  }

  return {
    certificateCode,
    title: `${input.cefrCode} — ${display.displayName}`,
    levelName: `${input.cefrCode} — ${display.displayName}`,
    studentName: input.studentName,
    overallScore: input.overallScore,
    sectionGrades,
    issuedDate: new Date(issuedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    nextLevel: nextMeta?.code ?? null,
    nextLevelName: nextDisplay
      ? `${nextMeta?.code} — ${nextDisplay.displayName}`
      : null,
    nextLevelSlug: nextSlug,
  };
}
