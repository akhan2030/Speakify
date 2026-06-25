import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCefrLevel } from "@/lib/course/cefrLevels";
import { getSupabase } from "@/lib/course/enrollment";
import { getPathwayLevelDisplay } from "@/lib/pathway/levelDisplay";
import { issuePathwayCertificate } from "@/lib/pathway/issueCertificate";
import { GRADUATION_PASS_SCORE } from "@/lib/pathway/graduationTestConfig";
import { fetchLevelById } from "@/lib/db/levels";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const studentName = session?.user?.name ?? "Student";

    if (!studentId) {
      return NextResponse.json({ success: false, fallback: true, error: "Not signed in" });
    }

    const body = await request.json().catch(() => ({}));
    const levelId = body.levelId ?? body.levelSlug;
    const overallScore = Number(body.overallScore);
    const sectionScores = body.sectionScores ?? {};

    if (!levelId || !Number.isFinite(overallScore)) {
      return NextResponse.json(
        { error: "levelId and overallScore required" },
        { status: 400 }
      );
    }

    if (overallScore < GRADUATION_PASS_SCORE) {
      return NextResponse.json(
        { error: `Score must be at least ${GRADUATION_PASS_SCORE}% to issue certificate` },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { level, error: levelError } = await fetchLevelById(supabase, levelId);

    if (levelError && !level) {
      console.warn("[pathway/certificate] level lookup", levelError);
    }

    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    const code = level.cefr_sub_level ?? getCefrLevel(level.slug)?.code ?? "";
    const display = getPathwayLevelDisplay(code, level.description);

    const certificate = await issuePathwayCertificate(supabase, {
      studentId,
      studentName,
      levelId: level.id,
      levelSlug: level.slug,
      cefrCode: code,
      levelName: `${code} — ${display.displayName}`,
      overallScore,
      sectionScores,
    });

    return NextResponse.json({
      success: true,
      message: `Certificate issued for ${certificate.levelName}.`,
      certificate,
    });
  } catch (err) {
    console.error("[pathway/certificate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Certificate failed" },
      { status: 500 }
    );
  }
}
