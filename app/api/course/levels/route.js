import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase, countCourseProgress } from "@/lib/course/enrollment";
import { CEFR_SUB_LEVELS } from "@/lib/course/cefrLevels";
import { PROGRAM_TRACKS } from "@/lib/course/programTracks";
import {
  LEVELS_TABLE,
  normalizeLevelRow,
} from "@/lib/db/levels";

export const runtime = "nodejs";

function metaKey(slug) {
  return slug?.replace(/-/g, "_");
}

function findDbMatch(dbLevels, metaSlug) {
  return dbLevels?.find((d) => {
    const key = d.slug ?? d.id;
    return (
      key === metaSlug ||
      key === metaKey(metaSlug) ||
      key?.replace(/_/g, "-") === metaSlug
    );
  });
}

async function mapLevels(dbLevels, metaList, enrolledMap, studentId) {
  return Promise.all(
    (dbLevels ?? metaList.map((l) => ({ slug: l.slug, id: metaKey(l.slug) }))).map(
      async (lvl) => {
        const meta = metaList.find((c) => c.slug === lvl.slug);
        const dbMatch = findDbMatch(dbLevels, lvl.slug);
        const enrollment = dbMatch ? enrolledMap.get(dbMatch.id) : undefined;

        let progress = 0;
        if (dbMatch?.id && studentId) {
          const p = await countCourseProgress(studentId, dbMatch.id);
          progress = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
        }

        const levelKey = dbMatch?.slug ?? dbMatch?.id ?? lvl.slug;

        return {
          slug: levelKey,
          code: meta?.code ?? dbMatch?.cefr_sub_level ?? lvl.slug,
          name: meta?.name ?? dbMatch?.name ?? lvl.slug,
          description: meta?.description ?? dbMatch?.description ?? "",
          weekCount: dbMatch?.week_count ?? meta?.weekCount ?? 4,
          targetBands: meta?.targetBands ?? null,
          trackType: dbMatch?.track_type ?? meta?.trackType ?? "program",
          enrolled: Boolean(enrollment),
          status: enrollment?.status ?? null,
          progress,
        };
      }
    )
  );
}

async function fetchLevelsByTrack(supabase) {
  const { data, error } = await supabase
    .from(LEVELS_TABLE)
    .select("id, name, cefr, description, duration_weeks, order_index, focus")
    .order("order_index", { ascending: true });

  if (error || !data?.length) return [];
  return data.map(normalizeLevelRow);
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trackParam = new URL(request.url).searchParams.get("track");

    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({
        programTracks: PROGRAM_TRACKS.map((l) => ({
          ...l,
          enrolled: false,
          progress: 0,
        })),
        cefrLevels: CEFR_SUB_LEVELS.map((l) => ({ ...l, enrolled: false, progress: 0 })),
        levels: PROGRAM_TRACKS.map((l) => ({ ...l, enrolled: false, progress: 0 })),
        activeEnrollment: null,
      });
    }

    const supabase = getSupabase();

    const allLevels = await fetchLevelsByTrack(supabase);

    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("level_id, status")
      .eq("student_id", studentId);

    const levelById = new Map(allLevels.map((l) => [l.id, l]));
    const enrolledMap = new Map((enrollments ?? []).map((e) => [e.level_id, e]));

    const programTracks = await mapLevels(allLevels, PROGRAM_TRACKS, enrolledMap, studentId);
    const cefrLevels = await mapLevels(allLevels, CEFR_SUB_LEVELS, enrolledMap, studentId);

    const active = enrollments?.find((e) => e.status === "active");
    const activeLevel = active ? levelById.get(active.level_id) : null;

    const payload = {
      programTracks,
      cefrLevels,
      activeEnrollment: activeLevel
        ? {
            slug: activeLevel.id ?? activeLevel.slug,
            code: activeLevel.cefr_sub_level,
            name: activeLevel.name,
            trackType: activeLevel.track_type,
          }
        : null,
    };

    if (trackParam === "cefr") {
      return NextResponse.json({ ...payload, levels: cefrLevels });
    }

    return NextResponse.json({ ...payload, levels: programTracks });
  } catch (err) {
    console.error("[course/levels]", err);
    return NextResponse.json({ error: "Failed to load levels" }, { status: 500 });
  }
}
