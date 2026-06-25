import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/course/enrollment";
import { getCefrLevel } from "@/lib/course/cefrLevels";
import { getProgramTrack, getMidLevelUnlockWeek } from "@/lib/course/programTracks";
import { computeWeekProgress7030 } from "@/lib/course/progression7030";
import { fetchLevelById } from "@/lib/db/levels";
import {
  ASSESSMENTS_TABLE,
  LESSONS_TABLE,
  normalizeAssessmentRow,
  normalizeLessonRow,
  normalizeUnitRow,
  UNITS_TABLE,
} from "@/lib/db/courseTables";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const levelSlug = params.slug;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meta = getCefrLevel(levelSlug) ?? getProgramTrack(levelSlug);
    if (!meta && !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    const supabase = getSupabase();
    const { level: levelRow } = await fetchLevelById(supabase, levelSlug);
    const level = levelRow;

    if (!level) {
      if (meta) {
        const weekCount = meta.weekCount ?? 4;
        const midLevelUnlockWeek = getMidLevelUnlockWeek(weekCount);
        const empty7030 = {
          reviewPercent: 0,
          newUnlocked: false,
          reviewCompleted: 0,
          reviewTotal: 0,
          newCompleted: 0,
          newTotal: 0,
          newPercent: 0,
          overallPercent: 0,
        };
        const weeks = Array.from({ length: weekCount }, (_, i) => {
          const weekNum = i + 1;
          return {
            id: `week-${weekNum}`,
            week_number: weekNum,
            title: `Week ${weekNum} — ${meta.code}`,
            locked: weekNum > midLevelUnlockWeek,
            progress7030: { ...empty7030, weekNumber: weekNum },
            lessons: [],
          };
        });

        return NextResponse.json({
          level: {
            id: null,
            slug: levelSlug,
            code: meta.code,
            name: meta.name,
            description: meta.description,
            weekCount,
            trackType: meta.trackType ?? "cefr",
          },
          enrolled: false,
          midLevelPassed: false,
          midLevelUnlockWeek,
          weekCount,
          weeks,
          assessments: [
            {
              id: "mid_level",
              assessment_type: "mid_level",
              title: `${meta.code} Mid-Level Check`,
              description: `Covers Weeks 1–${midLevelUnlockWeek}. Pass to unlock later weeks.`,
              pass_score: 70,
              passed: false,
              score: null,
              href: `/dashboard/student/course/${levelSlug}/test/mid_level`,
            },
            {
              id: "graduation",
              assessment_type: "graduation",
              title: `${meta.code} Graduation Exam`,
              description: "Full level assessment. Pass to earn your certificate.",
              pass_score: 75,
              passed: false,
              score: null,
              href: `/dashboard/student/course/${levelSlug}/test/graduation`,
            },
          ],
          certificate: null,
          dbMissing: true,
        });
      }
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    const { data: units } = await supabase
      .from(UNITS_TABLE)
      .select("id, title, week_number, focus")
      .eq("level_id", level.id)
      .order("week_number");

    const { data: assessments } = await supabase
      .from(ASSESSMENTS_TABLE)
      .select("id, type, pass_score")
      .eq("level_id", level.id);

    const { data: progressRows } = await supabase
      .from("student_progress")
      .select("lesson_id, status")
      .eq("student_id", studentId);

    const progressMap = new Map(
      (progressRows ?? []).map((p) => [p.lesson_id, p.status])
    );

    const { data: attemptRows } = await supabase
      .from("assessment_attempts")
      .select("assessment_id, score, passed, completed_at")
      .eq("student_id", studentId);

    const attemptMap = new Map(
      (attemptRows ?? []).map((a) => [a.assessment_id, a])
    );

    const midLevelAssessment = (assessments ?? [])
      .map(normalizeAssessmentRow)
      .find((a) => a.assessment_type === "mid_level");
    const midLevelPassed = midLevelAssessment
      ? Boolean(attemptMap.get(midLevelAssessment.id)?.passed)
      : false;

    const weekCount = level.week_count ?? meta?.weekCount ?? 4;
    const midLevelUnlockWeek = getMidLevelUnlockWeek(weekCount);

    const weeks = await Promise.all(
      (units ?? []).map(normalizeUnitRow).map(async (unit) => {
        const { data: lessons } = await supabase
          .from(LESSONS_TABLE)
          .select("id, day_type, title, is_review, content")
          .eq("unit_id", unit.id)
          .order("day_type");

        const lessonProgress = (lessons ?? []).map(normalizeLessonRow).map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          skill: l.skill,
          contentType: l.content_type ?? "new",
          estimatedMinutes: l.estimated_minutes,
          status: progressMap.get(l.id) ?? "not_started",
          progressionWeight: l.progression_weight ?? 30,
        }));

        const week7030 = computeWeekProgress7030(
          lessonProgress.map((l) => ({
            id: l.id,
            slug: l.slug,
            title: l.title,
            contentType: l.contentType,
            status: l.status,
            progressionWeight: l.progressionWeight,
          }))
        );

        return {
          ...unit,
          lessons: lessonProgress,
          progress7030: { ...week7030, weekNumber: unit.week_number },
          locked: unit.week_number > midLevelUnlockWeek && !midLevelPassed,
        };
      })
    );

    const assessmentsWithStatus = (assessments ?? [])
      .map(normalizeAssessmentRow)
      .map((a) => {
        const attempt = attemptMap.get(a.id);
        return {
          ...a,
          attempted: Boolean(attempt),
          passed: attempt?.passed ?? false,
          score: attempt?.score ?? null,
          href: `/dashboard/student/course/${levelSlug}/test/${a.assessment_type}`,
        };
      });

    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id, status")
      .eq("student_id", studentId)
      .eq("level_id", level.id)
      .maybeSingle();

    const { data: cert } = await supabase
      .from("certificates")
      .select("certificate_code, title, issued_at")
      .eq("student_id", studentId)
      .eq("level_id", level.id)
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      level: {
        id: level.id,
        slug: level.slug,
        code: level.cefr_sub_level ?? meta?.code,
        name: level.name,
        description: level.description ?? meta?.description,
        weekCount: level.week_count ?? meta?.weekCount ?? 4,
        trackType: level.track_type ?? "program",
      },
      enrolled: enrollment?.status === "active",
      midLevelPassed,
      midLevelUnlockWeek,
      weekCount,
      weeks,
      assessments: assessmentsWithStatus,
      certificate: cert,
    });
  } catch (err) {
    console.error("[course/levels/slug]", err);
    return NextResponse.json({ error: "Failed to load level" }, { status: 500 });
  }
}
