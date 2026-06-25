import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CEFR_SUB_LEVELS } from "@/lib/course/cefrLevels";
import { getSupabase } from "@/lib/course/enrollment";
import {
  cefrCodeToSlug,
  getPathwayLevelDisplay,
  normalizeCefrCode,
} from "@/lib/pathway/levelDisplay";
import { pathwayProgressFallback } from "@/lib/pathway/apiFallbacks";
import {
  fetchAllLevels,
  levelIdCandidates,
  levelMatchesPlacement,
  LEVELS_TABLE,
} from "@/lib/db/levels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emptyPathway() {
  return {
    programType: "english_pathway",
    student: { name: null, cefrLevel: "B1.1" },
    summary: {
      currentLevelCode: "B1.1",
      currentWeek: 1,
      levelsCompleted: 0,
      totalLevels: 10,
      estimatedWeeksRemaining: 0,
      activeSlug: "b1_1",
    },
    levels: CEFR_SUB_LEVELS.map((l, i) => ({
      id: l.slug.replace(/-/g, "_"),
      slug: l.slug.replace(/-/g, "_"),
      orderIndex: i + 1,
      code: l.code,
      name: getPathwayLevelDisplay(l.code, l.description).displayName,
      focusAreas: getPathwayLevelDisplay(l.code, l.description).focusAreas,
      weekCount: getPathwayLevelDisplay(l.code, l.description).weekCount,
      status: i === 0 ? "active" : "locked",
      currentWeek: i === 0 ? 1 : null,
      overallScore: null,
      certificate: null,
      href: `/dashboard/pathway/student/weekly-plan`,
    })),
  };
}

async function fetchUserProfile(supabase, studentId) {
  const { data } = await supabase
    .from("users")
    .select("name, cefr_level")
    .eq("id", studentId)
    .maybeSingle();
  return data;
}

async function ensureDefaultLevelProgress(supabase, studentId) {
  try {
    const { count, error: countError } = await supabase
      .from("student_level_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId);

    if (countError) {
      if (
        countError.message?.includes("student_level_progress") ||
        countError.code === "42P01"
      ) {
        return { tableMissing: true };
      }
      console.warn("[pathway/progress] count", countError.message);
      return { tableMissing: false };
    }

    if ((count ?? 0) > 0) return { tableMissing: false };

    for (const id of levelIdCandidates("b1_1")) {
      const { data: level } = await supabase
        .from(LEVELS_TABLE)
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (level?.id) {
        const { error: insertError } = await supabase
          .from("student_level_progress")
          .insert({
            student_id: studentId,
            level_id: level.id,
            status: "active",
            current_week: 1,
            weekly_scores: {},
            started_at: new Date().toISOString(),
          });

        if (insertError) {
          console.warn("[pathway/progress] default insert", insertError.message);
        }
        break;
      }
    }

    return { tableMissing: false };
  } catch (err) {
    console.warn("[pathway/progress] ensureDefaultLevelProgress", err);
    return { tableMissing: false };
  }
}

async function ensurePathwayProgress(supabase, studentId, levels, placementCode) {
  const { count, error: countError } = await supabase
    .from("student_level_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId);

  if (countError) {
    if (
      countError.message?.includes("student_level_progress") ||
      countError.code === "42P01"
    ) {
      return { rows: null, tableMissing: true };
    }
    throw countError;
  }

  const progressSelect =
    "level_id, status, current_week, overall_score, completed_at";

  if ((count ?? 0) > 0) {
    const { data: rows } = await supabase
      .from("student_level_progress")
      .select(progressSelect)
      .eq("student_id", studentId);
    return { rows: rows ?? [], tableMissing: false };
  }

  const now = new Date().toISOString();

  const inserts = levels
    .filter((l) => l.id)
    .map((level) => {
      const isActive = levelMatchesPlacement(level, placementCode);
      return {
        student_id: studentId,
        level_id: level.id,
        status: isActive ? "active" : "locked",
        current_week: isActive ? 1 : null,
        started_at: isActive ? now : null,
      };
    });

  if (!inserts.length) {
    return { rows: null, tableMissing: false, synthetic: true, placementCode };
  }

  const { error: insertError } = await supabase
    .from("student_level_progress")
    .insert(inserts);

  if (insertError) {
    console.warn("[pathway/progress] auto-insert", insertError.message);
    return { rows: null, tableMissing: false, synthetic: true, placementCode };
  }

  const { data: rows } = await supabase
    .from("student_level_progress")
    .select(progressSelect)
    .eq("student_id", studentId);

  return { rows: rows ?? [], tableMissing: false };
}

function syntheticStatus(levels, placementCode, index) {
  const level = levels[index];
  if (!level) return "locked";
  if (levelMatchesPlacement(level, placementCode)) return "active";
  return "locked";
}

function levelKeyFromJoin(row) {
  return row.level_id ?? null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json(pathwayProgressFallback());
    }

    if (!process.env.SUPABASE_SERVICE_KEY) {
      console.warn("[pathway/progress] Supabase not configured");
      return NextResponse.json(emptyPathway());
    }

    const supabase = getSupabase();
    const [profile, levels] = await Promise.all([
      fetchUserProfile(supabase, studentId),
      fetchAllLevels(supabase),
    ]);

    const placementCode = normalizeCefrCode(profile?.cefr_level);
    const studentName = profile?.name ?? session.user.name ?? null;

    const defaultProgress = await ensureDefaultLevelProgress(supabase, studentId);

    const progressResult = await ensurePathwayProgress(
      supabase,
      studentId,
      levels,
      placementCode
    );

    const progressByLevelId = new Map(
      (progressResult.rows ?? []).map((row) => [row.level_id, row])
    );
    const progressBySlug = new Map(
      (progressResult.rows ?? []).map((row) => [levelKeyFromJoin(row), row])
    );

    const levelIds = levels.map((l) => l.id).filter(Boolean);

    let certificates = [];
    if (levelIds.length) {
      const { data: certs } = await supabase
        .from("certificates")
        .select("level_id, certificate_code, title, issued_at")
        .eq("student_id", studentId)
        .in("level_id", levelIds);
      certificates = certs ?? [];
    }

    const certByLevelId = new Map(
      certificates.map((c) => [c.level_id, c])
    );

    const pathwayLevels = levels.map((level, index) => {
      const code = level.cefr_sub_level ?? CEFR_SUB_LEVELS[index]?.code ?? "";
      const display = getPathwayLevelDisplay(code, level.description);
      const levelKey = level.slug ?? level.id;
      const progress =
        progressByLevelId.get(level.id) ?? progressBySlug.get(levelKey);

      let status =
        progress?.status ??
        (progressResult.synthetic
          ? syntheticStatus(levels, placementCode, index)
          : index === 0
            ? "active"
            : "locked");

      if (!progress && !progressResult.rows && !progressResult.synthetic) {
        status = syntheticStatus(levels, placementCode, index);
      }

      const cert = level.id ? certByLevelId.get(level.id) : null;

      return {
        id: level.id ?? levelKey,
        slug: levelKey,
        orderIndex: level.order_index ?? index + 1,
        code,
        name: display.displayName,
        focusAreas: display.focusAreas,
        weekCount: level.week_count ?? display.weekCount,
        status,
        currentWeek:
          status === "active" ? progress?.current_week ?? 1 : null,
        overallScore: progress?.overall_score ?? null,
        certificate: cert
          ? {
              certificateCode: cert.certificate_code,
              title: cert.title,
              issuedAt: cert.issued_at,
            }
          : null,
        href: `/dashboard/pathway/student/weekly-plan`,
      };
    });

    const completedCount = pathwayLevels.filter(
      (l) => l.status === "completed"
    ).length;
    const activeLevel =
      pathwayLevels.find((l) => l.status === "active") ??
      pathwayLevels.find((l) => l.code === placementCode) ??
      pathwayLevels[0];

    const activeIndex = pathwayLevels.findIndex(
      (l) => l.slug === activeLevel?.slug
    );

    const estimatedWeeksRemaining = pathwayLevels
      .slice(activeIndex >= 0 ? activeIndex : 0)
      .filter((l) => l.status !== "completed")
      .reduce((sum, l) => sum + (l.weekCount ?? 3), 0);

    return NextResponse.json({
      programType: "english_pathway",
      student: {
        name: studentName,
        cefrLevel: placementCode,
      },
      summary: {
        currentLevelCode: activeLevel?.code ?? placementCode,
        currentLevelName: activeLevel?.name ?? null,
        currentWeek: activeLevel?.currentWeek ?? 1,
        levelsCompleted: completedCount,
        totalLevels: pathwayLevels.length,
        estimatedWeeksRemaining,
        activeSlug: activeLevel?.slug ?? cefrCodeToSlug(placementCode).replace(/-/g, "_"),
        lessonHref: activeLevel
          ? `/dashboard/pathway/student/weekly-plan`
          : null,
      },
      levels: pathwayLevels,
      tableMissing:
        progressResult.tableMissing === true || defaultProgress.tableMissing === true,
    });
  } catch (err) {
    console.error("[pathway/progress]", err);
    const fallback = emptyPathway();
    return NextResponse.json({
      ...fallback,
      error: err instanceof Error ? err.message : "Failed to load pathway",
    });
  }
}
