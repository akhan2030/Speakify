import {
  getCefrLevel,
  CEFR_SUB_LEVELS,
  normalizeCefrSlug,
} from "@/lib/course/cefrLevels";
import { PATHWAY_DAYS } from "@/lib/pathway/dayStructure";
import { dayTypeToQuery, resolveDayType } from "@/lib/pathway/dayMapping";
import { getPathwayLevelDisplay } from "@/lib/pathway/levelDisplay";
import { normalizeLevelSlug } from "@/lib/pathway/resolveLevel";

export function pathwayProgressFallback() {
  return {
    fallback: true,
    progress: null,
    student: { name: null, cefrLevel: "B1.1" },
    summary: {
      currentLevelCode: "B1.1",
      currentLevelName: "Intermediate I",
      currentWeek: 1,
      levelsCompleted: 0,
      totalLevels: 10,
      estimatedWeeksRemaining: 30,
      activeSlug: "b1-1",
      lessonHref: "/dashboard/pathway/student/weekly-plan",
    },
    levels: CEFR_SUB_LEVELS.map((l, i) => ({
      id: l.slug,
      slug: l.slug,
      orderIndex: i + 1,
      code: l.code,
      name: getPathwayLevelDisplay(l.code, l.description).displayName,
      focusAreas: getPathwayLevelDisplay(l.code, l.description).focusAreas,
      weekCount: getPathwayLevelDisplay(l.code, l.description).weekCount,
      status: i === 4 ? "active" : "locked",
      currentWeek: i === 4 ? 1 : null,
      overallScore: null,
      certificate: null,
      href: `/dashboard/pathway/student/weekly-plan`,
    })),
  };
}

function syntheticDays(levelSlug, weekNum) {
  return PATHWAY_DAYS.map((day) => ({
    dayType: day.dayType,
    dayName: day.dayName,
    dayLabel: day.dayLabel,
    icon: day.icon,
    theme: day.theme,
    lessonId: null,
    lessonTitle: `${day.dayLabel}: ${day.theme}`,
    estimatedMinutes: day.defaultMinutes,
    contentBadge: day.contentBadge,
    completed: false,
    href: `/dashboard/student/pathway/${levelSlug}/lesson?week=${weekNum}&day=${dayTypeToQuery(day.dayType)}`,
  }));
}

export function pathwayLevelFallback(levelId = "b1-1") {
  const slug =
    normalizeLevelSlug(levelId) ||
    normalizeCefrSlug(levelId) ||
    "b1-1";
  const meta =
    getCefrLevel(levelId) ??
    getCefrLevel(slug) ??
    CEFR_SUB_LEVELS[4];
  const code = meta.code ?? "B1.1";
  const display = getPathwayLevelDisplay(code, meta.description);
  const weekCount = display.weekCount ?? 3;

  const weeks = Array.from({ length: weekCount }, (_, i) => {
    const weekNum = i + 1;
    return {
      id: `fallback-week-${weekNum}`,
      weekNumber: weekNum,
      title: `${display.displayName} — Week ${weekNum}`,
      state: weekNum === 1 ? "current" : "future",
      locked: weekNum > 1,
      expanded: weekNum === 1,
      daysCompleted: 0,
      totalDays: 5,
      complete: false,
      days: syntheticDays(slug, weekNum),
    };
  });

  return {
    fallback: true,
    level: {
      id: slug,
      slug,
      code,
      displayName: display.displayName,
      headerTitle: `${code} — ${display.displayName}`,
      description: display.focusAreas,
      weekCount,
      focusAreas: display.focusAreas,
    },
    progress: {
      currentWeek: 1,
      weeksComplete: 0,
      weekCount,
      progressPercent: 0,
      overallScore: null,
      levelStatus: "active",
    },
    weeks,
    tests: {
      showMidLevelTest: false,
      showGraduationTest: false,
      midLevelPassed: false,
      midLevelHref: `/dashboard/student/pathway/${slug}/mid-level-test`,
      graduationHref: `/dashboard/student/pathway/${slug}/graduation-test`,
    },
  };
}

export function pathwayLessonFallback(levelId, week, dayParam) {
  const slug =
    normalizeLevelSlug(levelId) ||
    normalizeCefrSlug(levelId) ||
    "b1-1";
  const meta =
    getCefrLevel(levelId) ??
    getCefrLevel(slug) ??
    CEFR_SUB_LEVELS[4];
  const code = meta.code ?? "B1.1";
  const display = getPathwayLevelDisplay(code, meta.description);
  const dayType = resolveDayType(dayParam) ?? "input";

  return {
    fallback: true,
    error: "Sign in to load AI-generated lesson content.",
    level: {
      slug,
      code,
      name: `${code} — ${display.displayName}`,
    },
    week: Number.isFinite(week) ? week : 1,
    day: dayParam ?? "monday",
    dayType,
    content: null,
    completed: false,
    weeklyScore: null,
  };
}

export function pathwayGenericFallback(extra = {}) {
  return {
    fallback: true,
    progress: null,
    levels: [],
    ...extra,
  };
}
