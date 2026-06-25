import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { buildRecommendations } from "@/lib/course/recommendationEngine";
import { computeReadinessMeter } from "@/lib/course/readinessMeter";
import { getSupabase } from "@/lib/course/enrollment";

const AVG_LESSON_MINUTES = 45;

export async function persistIeltsReadiness(studentId: string) {
  if (!process.env.SUPABASE_SERVICE_KEY) return null;

  const profile = await fetchStudentProfile(studentId);
  const recommendations = buildRecommendations(profile);
  const meter = computeReadinessMeter(profile, recommendations);

  const hoursStudied = Math.round(
    ((profile.lessonsCompleted ?? 0) * AVG_LESSON_MINUTES) / 60 * 10
  ) / 10;

  const skillBands = Object.fromEntries(
    meter.skills.map((s) => [s.skill, s.band])
  );

  const projectedDate = meter.projectedAchievement?.projectedDate
    ? meter.projectedAchievement.projectedDate.slice(0, 10)
    : null;

  const supabase = getSupabase();
  const row = {
    student_id: studentId,
    readiness_percent: meter.readinessPercent,
    overall_band: profile.currentBand,
    target_band: profile.targetBand,
    skill_bands: skillBands,
    hours_studied: hoursStudied,
    projected_date: projectedDate,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("ielts_readiness").upsert(row, {
    onConflict: "student_id",
  });

  if (error) {
    console.warn("[persistIeltsReadiness]", error.message);
  }

  return { ...meter, hoursStudied };
}

export { AVG_LESSON_MINUTES };
