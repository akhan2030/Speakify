import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCefrLevel } from "@/lib/course/cefrLevels";
import { getSupabase } from "@/lib/course/enrollment";
import { PATHWAY_DAYS } from "@/lib/pathway/dayStructure";
import { dayTypeToQuery } from "@/lib/pathway/dayMapping";
import { ensureLevelUnits } from "@/lib/pathway/generateLevelUnits";
import { getPathwayLevelDisplay } from "@/lib/pathway/levelDisplay";
import {
  fetchLevelById,
  levelIdCandidates,
  LEVELS_TABLE,
  normalizeLevelRow,
} from "@/lib/db/levels";
import {
  ASSESSMENTS_TABLE,
  LESSONS_TABLE,
  normalizeAssessmentRow,
  normalizeLessonRow,
  normalizeUnitRow,
  UNITS_TABLE,
} from "@/lib/db/courseTables";
import { pathwayLevelFallback } from "@/lib/pathway/apiFallbacks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveLevel(supabase, levelId) {
  for (const id of levelIdCandidates(levelId)) {
    const { data, error } = await supabase
      .from(LEVELS_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return { level: null, meta: null, resolveError: error.message };
    }
    if (data) {
      return { level: normalizeLevelRow(data), meta: null, resolveError: null };
    }
  }

  const result = await fetchLevelById(supabase, levelId);
  if (result.level) {
    return { level: result.level, meta: null, resolveError: null };
  }

  const meta = result.meta ?? getCefrLevel(levelId) ?? null;
  return {
    level: null,
    meta,
    resolveError: result.error ?? "Level not found",
  };
}

function mapLessonsToDays(lessons) {
  const pathwaySlugs = new Set(PATHWAY_DAYS.map((d) => d.dayType));
  const hasPathway = (lessons ?? []).some((l) => pathwaySlugs.has(l.slug));
  const legacyIndexes = [7, 8, 2, 6, 9];

  return PATHWAY_DAYS.map((day, i) => {
    let lesson = null;
    if (hasPathway) {
      lesson = (lessons ?? []).find((l) => l.slug === day.dayType) ?? null;
    } else {
      lesson = (lessons ?? [])[legacyIndexes[i]] ?? (lessons ?? [])[i] ?? null;
    }

    const completed = lesson?.status === "completed";
    const title =
      lesson?.title ??
      `${day.dayLabel}: ${day.theme}`;

    return {
      dayType: day.dayType,
      dayName: day.dayName,
      dayLabel: day.dayLabel,
      icon: day.icon,
      theme: day.theme,
      lessonId: lesson?.id ?? null,
      lessonTitle: title,
      estimatedMinutes: lesson?.estimatedMinutes ?? day.defaultMinutes,
      contentBadge: day.contentBadge,
      completed,
    };
  });
}

function weekIsComplete(days) {
  return days.length > 0 && days.every((d) => d.completed);
}

function buildSyntheticWeeks(level, weekCount, display, currentWeek, levelSlug, levelLocked, midLevelPassed) {
  return Array.from({ length: weekCount }, (_, i) => {
    const weekNum = i + 1;
    const days = mapLessonsToDays([]).map((day) => ({
      ...day,
      href: `/dashboard/student/pathway/${levelSlug}/lesson?week=${weekNum}&day=${dayTypeToQuery(day.dayType)}`,
    }));

    let state = "future";
    if (weekNum < currentWeek) state = "past";
    else if (weekNum === currentWeek) state = "current";

    const locked =
      levelLocked ||
      weekNum > currentWeek ||
      (weekNum > Math.ceil(weekCount / 2) && !midLevelPassed);

    return {
      id: `synthetic-week-${weekNum}`,
      weekNumber: weekNum,
      title: `${display.displayName} — Week ${weekNum}`,
      state,
      locked,
      expanded: state === "current",
      daysCompleted: 0,
      totalDays: days.length,
      complete: false,
      days,
    };
  });
}

async function ensureLevelProgress(supabase, studentId, levelId) {
  try {
    const { data: existing, error } = await supabase
      .from("student_level_progress")
      .select("id, status, current_week, overall_score")
      .eq("student_id", studentId)
      .eq("level_id", levelId)
      .maybeSingle();

    if (error) {
      console.warn("[pathway/level] progress read", error.message);
      return { status: "active", current_week: 1, overall_score: null };
    }

    if (existing) return existing;

    const { data: inserted, error: insertError } = await supabase
      .from("student_level_progress")
      .insert({
        student_id: studentId,
        level_id: levelId,
        status: "active",
        current_week: 1,
        weekly_scores: {},
        started_at: new Date().toISOString(),
      })
      .select("status, current_week, overall_score")
      .maybeSingle();

    if (insertError) {
      console.warn("[pathway/level] progress insert", insertError.message);
      return { status: "active", current_week: 1, overall_score: null };
    }

    return inserted ?? { status: "active", current_week: 1, overall_score: null };
  } catch (err) {
    console.warn("[pathway/level] ensureLevelProgress", err);
    return { status: "active", current_week: 1, overall_score: null };
  }
}

export async function GET(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const levelId = params.levelId;

    if (!studentId) {
      return NextResponse.json(pathwayLevelFallback(levelId));
    }

    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json(pathwayLevelFallback(levelId));
    }

    const supabase = getSupabase();
    const { level, meta, resolveError } = await resolveLevel(supabase, levelId);

    if (!level) {
      if (meta) {
        const resolvedId = meta.slug.replace(/-/g, "_");
        console.warn(
          "[pathway/level] DB row missing for",
          levelId,
          "— serving static content for",
          resolvedId
        );
        return NextResponse.json(pathwayLevelFallback(resolvedId));
      }
      return NextResponse.json(
        { error: resolveError ?? "Level not found" },
        { status: 404 }
      );
    }

    const code = level.cefr_sub_level ?? getCefrLevel(level.slug)?.code ?? "";
    const display = getPathwayLevelDisplay(code, level.description);
    const weekCount = level.week_count ?? display.weekCount ?? 3;

    const { data: unitProbe } = await supabase
      .from(UNITS_TABLE)
      .select("id")
      .eq("level_id", level.id)
      .limit(1);

    let wasGenerated = false;
    try {
      if (!unitProbe?.length) {
        const gen = await ensureLevelUnits(supabase, level);
        wasGenerated = gen.generated;
      }
    } catch (genErr) {
      console.warn("[pathway/level] ensureLevelUnits", genErr);
    }

    let units = [];
    try {
      const { data: unitRows, error: unitsError } = await supabase
        .from(UNITS_TABLE)
        .select("id, title, week_number, focus")
        .eq("level_id", level.id)
        .order("week_number", { ascending: true });
      if (!unitsError) units = (unitRows ?? []).map(normalizeUnitRow);
    } catch (unitsErr) {
      console.warn("[pathway/level] units fetch", unitsErr);
    }

    let progressRows = [];
    try {
      const { data: rows, error: progressError } = await supabase
        .from("student_progress")
        .select("lesson_id, status")
        .eq("student_id", studentId);
      if (!progressError) progressRows = rows ?? [];
    } catch (progressErr) {
      console.warn("[pathway/level] student_progress", progressErr);
    }

    const progressMap = new Map(progressRows.map((p) => [p.lesson_id, p.status]));

    const levelProgress = await ensureLevelProgress(supabase, studentId, level.id);

    const currentWeek = levelProgress?.current_week ?? 1;
    const overallScore = levelProgress?.overall_score ?? null;
    const levelLocked = levelProgress?.status === "locked";

    let assessments = [];
    let attempts = [];
    try {
      const { data: assessmentRows } = await supabase
        .from(ASSESSMENTS_TABLE)
        .select("id, type, pass_score")
        .eq("level_id", level.id);
      assessments = (assessmentRows ?? []).map(normalizeAssessmentRow);

      const { data: attemptRows } = await supabase
        .from("assessment_attempts")
        .select("assessment_id, passed, score")
        .eq("student_id", studentId);
      attempts = attemptRows ?? [];
    } catch (assessmentErr) {
      console.warn("[pathway/level] assessments", assessmentErr);
    }

    const attemptMap = new Map((attempts ?? []).map((a) => [a.assessment_id, a]));
    const midAssessment = (assessments ?? []).find(
      (a) => a.assessment_type === "mid_level"
    );
    const midLevelPassed = midAssessment
      ? Boolean(attemptMap.get(midAssessment.id)?.passed)
      : false;

    let weeks = [];
    if (units.length > 0) {
      weeks = await Promise.all(
        units.map(async (unit) => {
          let lessons = [];
          try {
            const { data: lessonRows } = await supabase
              .from(LESSONS_TABLE)
              .select("id, day_type, title, is_review, content")
              .eq("unit_id", unit.id)
              .order("day_type");
            lessons = (lessonRows ?? []).map(normalizeLessonRow);
          } catch (lessonErr) {
            console.warn("[pathway/level] lessons", lessonErr);
          }

          const lessonsWithStatus = lessons.map((l) => ({
            id: l.id,
            slug: l.slug,
            title: l.title,
            estimatedMinutes: l.estimated_minutes ?? 45,
            status: progressMap.get(l.id) ?? "not_started",
          }));

          const days = mapLessonsToDays(lessonsWithStatus).map((day) => ({
            ...day,
            href: `/dashboard/student/pathway/${level.slug}/lesson?week=${unit.week_number}&day=${dayTypeToQuery(day.dayType)}`,
          }));

          const completedDays = days.filter((d) => d.completed).length;
          const weekNum = unit.week_number ?? 1;

          let state = "future";
          if (weekNum < currentWeek) state = "past";
          else if (weekNum === currentWeek) state = "current";

          const locked =
            levelLocked ||
            weekNum > currentWeek ||
            (weekNum > Math.ceil(weekCount / 2) && !midLevelPassed);

          return {
            id: unit.id,
            weekNumber: weekNum,
            title: unit.title,
            state,
            locked,
            expanded: state === "current",
            daysCompleted: completedDays,
            totalDays: days.length,
            complete: weekIsComplete(days),
            days,
          };
        })
      );
    } else {
      weeks = buildSyntheticWeeks(
        level,
        weekCount,
        display,
        currentWeek,
        level.slug,
        levelLocked,
        midLevelPassed
      );
    }

    const weeksComplete = weeks.filter((w) => w.complete).length;
    const progressPercent =
      weekCount > 0
        ? Math.round(
            ((weeksComplete +
              (weeks.find((w) => w.weekNumber === currentWeek)?.daysCompleted ??
                0) /
                5) /
              weekCount) *
              100
          )
        : 0;

    const halfwayWeek = Math.ceil(weekCount / 2);
    const showMidLevelTest =
      !midLevelPassed &&
      (currentWeek >= halfwayWeek ||
        weeks.some((w) => w.weekNumber === halfwayWeek && w.daysCompleted > 0));

    const allWeeksComplete =
      weeks.length >= weekCount && weeks.every((w) => w.complete);
    const showGraduationTest = allWeeksComplete;

    const levelSlug = level.slug;

    return NextResponse.json({
      generating: false,
      level: {
        id: level.id,
        slug: levelSlug,
        code,
        displayName: display.displayName,
        headerTitle: `${code} — ${display.displayName}`,
        description: level.description ?? display.focusAreas,
        weekCount,
        focusAreas: display.focusAreas,
      },
      progress: {
        currentWeek,
        weeksComplete,
        weekCount,
        progressPercent: Math.min(100, progressPercent),
        overallScore,
        levelStatus: levelProgress?.status ?? "active",
      },
      weeks,
      tests: {
        showMidLevelTest,
        showGraduationTest,
        midLevelPassed,
        midLevelHref: `/dashboard/student/pathway/${levelSlug}/mid-level-test`,
        graduationHref: `/dashboard/student/pathway/${levelSlug}/graduation-test`,
      },
      wasGenerated,
    });
  } catch (err) {
    console.error("[pathway/level]", err);
    return NextResponse.json(pathwayLevelFallback(params?.levelId ?? "b1-1"));
  }
}
