import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { generatePersonalizedStudyPlan } from "@/lib/course/studyPlanGenerator";
import { computeProjectedAchievement } from "@/lib/course/projectedAchievement";
import { buildRecommendations } from "@/lib/course/recommendationEngine";
import { computeReadinessMeter } from "@/lib/course/readinessMeter";
import { getSupabase } from "@/lib/course/enrollment";
import { buildWeeklySchedule } from "@/lib/pathway/dailyStudyPlan";
import { buildStudentProfile } from "@/lib/course/studentProfile";
import { cefrCodeToLevelId, fetchLevelById } from "@/lib/db/levels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fallbackStudyPlan() {
  const profile = buildStudentProfile({ studentId: "", targetBand: 7 });
  const meter = computeReadinessMeter(profile);
  const weeklySchedule = buildWeeklySchedule({
    profile,
    meter,
    cefrLevel: "B1.1",
    currentWeek: 1,
    weeklyScores: {},
  });
  return {
    plan: generatePersonalizedStudyPlan(profile),
    projectedAchievement: computeProjectedAchievement(profile),
    weeklySchedule,
    readiness: meter,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ ...fallbackStudyPlan(), fallback: true });
    }

    let profile;
    try {
      profile = await fetchStudentProfile(studentId);
    } catch (profileErr) {
      console.warn("[student/study-plan] profile", profileErr);
      profile = buildStudentProfile({ studentId, targetBand: 7 });
    }

    const recommendations = buildRecommendations(profile);
    const meter = computeReadinessMeter(profile, recommendations);
    const plan = generatePersonalizedStudyPlan(profile);
    const projected = computeProjectedAchievement(profile);

    let userCefr = "B1.1";
    let weeklyScores = {};
    let currentWeek = 1;

    try {
      const supabase = getSupabase();
      const { data: userRow } = await supabase
        .from("users")
        .select("cefr_level")
        .eq("id", studentId)
        .maybeSingle();

      userCefr = userRow?.cefr_level ?? "B1.1";
      const levelId = cefrCodeToLevelId(userCefr);
      const { level: levelRow } = await fetchLevelById(supabase, levelId);

      if (levelRow?.id) {
        let { data: slp } = await supabase
          .from("student_level_progress")
          .select("weekly_scores, current_week")
          .eq("student_id", studentId)
          .eq("level_id", levelRow.id)
          .maybeSingle();

        if (!slp) {
          await supabase.from("student_level_progress").insert({
            student_id: studentId,
            level_id: levelRow.id,
            status: "active",
            current_week: 1,
            weekly_scores: {},
            started_at: new Date().toISOString(),
          });
          slp = { weekly_scores: {}, current_week: 1 };
        }

        weeklyScores = slp?.weekly_scores ?? {};
        currentWeek = slp?.current_week ?? 1;
      }
    } catch (dbErr) {
      console.warn("[student/study-plan] db", dbErr);
    }

    const weeklySchedule = buildWeeklySchedule({
      profile,
      meter,
      cefrLevel: userCefr,
      currentWeek,
      weeklyScores,
    });

    return NextResponse.json({
      plan,
      projectedAchievement: projected,
      weeklySchedule,
      readiness: meter,
    });
  } catch (err) {
    console.error("[student/study-plan]", err);
    return NextResponse.json({
      ...fallbackStudyPlan(),
      error: err instanceof Error ? err.message : "Failed to generate study plan",
    });
  }
}
