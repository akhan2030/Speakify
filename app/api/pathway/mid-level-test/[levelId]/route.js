import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCefrLevel } from "@/lib/course/cefrLevels";
import { getSupabase } from "@/lib/course/enrollment";
import { getPathwayLevelDisplay } from "@/lib/pathway/levelDisplay";
import { generateGraduationTestContent } from "@/lib/pathway/generateGraduationContent";
import { pathwayGenericFallback } from "@/lib/pathway/apiFallbacks";
import { resolvePathwayLevel } from "@/lib/pathway/resolveLevel";
import { ASSESSMENTS_TABLE } from "@/lib/db/courseTables";

export const runtime = "nodejs";
export const maxDuration = 90;

const MID_TOTAL_SECONDS = 45 * 60;

export async function GET(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(pathwayGenericFallback());
    }

    const supabase = getSupabase();
    const { level, error: levelError } = await resolvePathwayLevel(
      supabase,
      params.levelId
    );
    if (!level) {
      return NextResponse.json(
        { error: levelError ?? "Level not found" },
        { status: 404 }
      );
    }

    const code = level.cefr_sub_level ?? getCefrLevel(level.slug)?.code ?? "";
    const display = getPathwayLevelDisplay(code, level.description);
    const full = await generateGraduationTestContent({
      cefrCode: code,
      levelName: display.displayName,
      focusAreas: display.focusAreas,
    });

    return NextResponse.json({
      level: { slug: level.slug, code, name: `${code} — ${display.displayName}` },
      totalSeconds: MID_TOTAL_SECONDS,
      sections: {
        grammar: full.grammar.slice(0, 15),
        vocabulary: full.vocabulary.slice(0, 15),
        reading: {
          passage: full.reading.passage,
          questions: full.reading.questions.slice(0, 10),
        },
        speaking: full.speaking.slice(0, 1),
      },
    });
  } catch (err) {
    console.error("[pathway/mid-level-test] GET", err);
    return NextResponse.json({ error: "Failed to load test" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ success: false, fallback: true, error: "Not signed in" });
    }

    const body = await request.json().catch(() => ({}));
    const sectionScores = body.sectionScores ?? {};
    const weakAreas = body.weakAreas ?? [];

    const supabase = getSupabase();
    const { level, error: levelError } = await resolvePathwayLevel(
      supabase,
      params.levelId
    );
    if (!level) {
      return NextResponse.json(
        { error: levelError ?? "Level not found" },
        { status: 404 }
      );
    }

    const { data: assessment } = await supabase
      .from(ASSESSMENTS_TABLE)
      .select("id")
      .eq("level_id", level.id)
      .eq("type", "mid_level")
      .maybeSingle();

    if (assessment?.id) {
      await supabase.from("assessment_attempts").insert({
        student_id: studentId,
        assessment_id: assessment.id,
        score: body.overallScore ?? null,
        passed: null,
        answers: { sectionScores, weakAreas, formative: true },
        completed_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      diagnostic: true,
      sectionScores,
      weakAreas,
      message: "Areas to focus for second half of this level",
      lessonLinks: weakAreas.map((skill) => ({
        skill,
        href: `/dashboard/student/pathway/${level.slug}/lesson?week=2&day=monday`,
      })),
    });
  } catch (err) {
    console.error("[pathway/mid-level-test] POST", err);
    return NextResponse.json({ error: "Failed to save results" }, { status: 500 });
  }
}
