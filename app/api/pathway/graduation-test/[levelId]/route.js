import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCefrLevel } from "@/lib/course/cefrLevels";
import { getSupabase } from "@/lib/course/enrollment";
import { getPathwayLevelDisplay } from "@/lib/pathway/levelDisplay";
import { generateGraduationTestContent } from "@/lib/pathway/generateGraduationContent";
import { scoreGraduationAttempt } from "@/lib/pathway/scoreGraduation";
import { issuePathwayCertificate } from "@/lib/pathway/issueCertificate";
import { pathwayGenericFallback } from "@/lib/pathway/apiFallbacks";
import { resolvePathwayLevel } from "@/lib/pathway/resolveLevel";
import {
  GRADUATION_PASS_SCORE,
  GRADUATION_TOTAL_SECONDS,
  GRADUATION_SECTION_ORDER,
  SECTION_META,
  gradeFromScore,
  retestAvailableDate,
} from "@/lib/pathway/graduationTestConfig";

export const runtime = "nodejs";
export const maxDuration = 120;

async function getRetestLock(supabase, studentId, levelId) {
  const { data, error } = await supabase
    .from("pathway_graduation_attempts")
    .select("passed, retest_available_at, completed_at, overall_score, section_scores")
    .eq("student_id", studentId)
    .eq("level_id", levelId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error?.message?.includes("pathway_graduation_attempts")) {
    return { locked: false, lastAttempt: null };
  }

  if (!data || data.passed) {
    return { locked: false, lastAttempt: data };
  }

  const unlockAt = data.retest_available_at
    ? new Date(data.retest_available_at)
    : retestAvailableDate(new Date(data.completed_at));

  if (unlockAt > new Date()) {
    return { locked: true, retestAvailableAt: unlockAt.toISOString(), lastAttempt: data };
  }

  return { locked: false, lastAttempt: data };
}

export async function GET(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json(pathwayGenericFallback({ locked: true }));
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

    const retest = await getRetestLock(supabase, studentId, level.id);
    if (retest.locked) {
      return NextResponse.json({
        locked: true,
        retestAvailableAt: retest.retestAvailableAt,
        message: "Retest is not available yet.",
      });
    }

    const content = await generateGraduationTestContent({
      cefrCode: code,
      levelName: `${code} — ${display.displayName}`,
      focusAreas: display.focusAreas,
    });

    return NextResponse.json({
      locked: false,
      level: {
        id: level.id,
        slug: level.slug,
        code,
        name: `${code} — ${display.displayName}`,
      },
      totalSeconds: GRADUATION_TOTAL_SECONDS,
      passScore: GRADUATION_PASS_SCORE,
      sections: GRADUATION_SECTION_ORDER.map((key) => ({
        key,
        ...SECTION_META[key],
      })),
      content,
    });
  } catch (err) {
    console.error("[pathway/graduation-test] GET", err);
    return NextResponse.json({ error: "Failed to load test" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const studentName = session?.user?.name ?? "Student";
    if (!studentId) {
      return NextResponse.json({ success: false, fallback: true, error: "Not signed in" });
    }
    const answers = body.answers ?? {};
    const content = body.content;

    if (!content) {
      return NextResponse.json({ error: "Test content required" }, { status: 400 });
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

    const retest = await getRetestLock(supabase, studentId, level.id);
    if (retest.locked) {
      return NextResponse.json(
        { error: "Retest not available yet", retestAvailableAt: retest.retestAvailableAt },
        { status: 403 }
      );
    }

    const result = await scoreGraduationAttempt(content, answers, code);
    const now = new Date().toISOString();
    const retestAt = result.passed ? null : retestAvailableDate().toISOString();

    const { error: insertError } = await supabase
      .from("pathway_graduation_attempts")
      .insert({
        student_id: studentId,
        level_id: level.id,
        overall_score: result.overallScore,
        passed: result.passed,
        section_scores: result.scores,
        answers,
        retest_available_at: retestAt,
        completed_at: now,
      });
    if (insertError) {
      console.warn("[pathway/graduation-test] attempt insert", insertError.message);
    }

    let certificate = null;
    if (result.passed) {
      certificate = await issuePathwayCertificate(supabase, {
        studentId,
        studentName,
        levelId: level.id,
        levelSlug: level.slug,
        cefrCode: code,
        levelName: `${code} — ${display.displayName}`,
        overallScore: result.overallScore,
        sectionScores: result.scores,
      });
    }

    const sectionResults = Object.entries(result.scores).map(([skill, score]) => ({
      skill,
      score,
      grade: gradeFromScore(Number(score)),
      passed: Number(score) >= GRADUATION_PASS_SCORE,
    }));

    return NextResponse.json({
      success: true,
      passed: result.passed,
      overallScore: result.overallScore,
      passScore: GRADUATION_PASS_SCORE,
      sectionResults,
      weakAreas: result.weakAreas,
      retestAvailableAt: retestAt,
      certificate,
      levelName: `${code} — ${display.displayName}`,
    });
  } catch (err) {
    console.error("[pathway/graduation-test] POST", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submission failed" },
      { status: 500 }
    );
  }
}
