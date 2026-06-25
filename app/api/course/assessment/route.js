import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/course/enrollment";
import { buildGraduationCertificate } from "@/lib/course/certificates";
import { getNextLevelSlug } from "@/lib/course/cefrLevels";
import { getNextProgramTrackSlug } from "@/lib/course/programTracks";
import { enrollStudentInLevel } from "@/lib/course/enrollment";
import { fetchLevelById } from "@/lib/db/levels";
import { ASSESSMENTS_TABLE } from "@/lib/db/courseTables";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const studentName = session?.user?.name ?? "Student";

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const levelSlug = body.levelSlug?.trim();
    const assessmentType = body.assessmentType?.trim();
    const score = Number(body.score) || 0;

    if (!levelSlug || !assessmentType) {
      return NextResponse.json(
        { error: "levelSlug and assessmentType required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { level: levelRow } = await fetchLevelById(supabase, levelSlug);
    const level = levelRow;

    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    const { data: assessment } = await supabase
      .from(ASSESSMENTS_TABLE)
      .select("id, pass_score, type")
      .eq("level_id", level.id)
      .eq("type", assessmentType)
      .maybeSingle();

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const passScore = Number(assessment.pass_score) || 70;
    const passed = score >= passScore;
    const now = new Date().toISOString();

    await supabase.from("assessment_attempts").insert({
      student_id: studentId,
      assessment_id: assessment.id,
      score,
      passed,
      completed_at: now,
    });

    let certificate = null;
    let graduationCertData = null;

    if (passed && assessmentType === "graduation") {
      graduationCertData = buildGraduationCertificate({
        studentId,
        studentName,
        cefrSubLevel: level.cefr_sub_level ?? levelSlug,
        levelName: level.name,
        levelSlug: level.slug,
        score,
      });

      const { data: savedCert } = await supabase
        .from("certificates")
        .insert({
          student_id: studentId,
          level_id: level.id,
          certificate_code: graduationCertData.certificateCode,
          title: graduationCertData.title,
          placement_band: null,
          target_band: null,
          metadata: {
            type: "graduation",
            score,
            cefr_sub_level: level.cefr_sub_level,
          },
        })
        .select("certificate_code, title, issued_at")
        .single();

      certificate = savedCert ?? graduationCertData;

      await supabase
        .from("course_enrollments")
        .update({ status: "completed", completed_at: now })
        .eq("student_id", studentId)
        .eq("level_id", level.id);

      const nextSlug =
        level.track_type === "program"
          ? getNextProgramTrackSlug(level.slug)
          : getNextLevelSlug(level.slug);
      if (nextSlug) {
        await enrollStudentInLevel({
          studentId,
          levelSlug: nextSlug,
          overallBand: null,
          targetBand: null,
          placementAttemptId: null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      passed,
      score,
      passScore,
      certificate: certificate
        ? {
            ...certificate,
            nextLevel: graduationCertData?.nextLevel ?? null,
            nextLevelSlug: graduationCertData?.nextLevelSlug ?? null,
          }
        : null,
      message: passed
        ? assessmentType === "graduation"
          ? "Congratulations! Graduation certificate issued."
          : "Mid-level test passed. Week 3–4 new content unlocked."
        : `Score ${score}% — need ${passScore}% to pass. Try again.`,
    });
  } catch (err) {
    console.error("[course/assessment]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Assessment failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data } = await supabase
      .from("certificates")
      .select("certificate_code, title, issued_at, metadata, level_id")
      .eq("student_id", studentId)
      .order("issued_at", { ascending: false });

    return NextResponse.json({ certificates: data ?? [] });
  } catch (err) {
    console.error("[course/assessment] GET", err);
    return NextResponse.json({ certificates: [] });
  }
}
