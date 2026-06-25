import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bandToLevelSlug, isValidLevelSlug } from "@/lib/course/pathwayEngine";
import { enrollStudentInLevel } from "@/lib/course/enrollment";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Sign in to enroll" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const overallBand = Number(body.overallBand) || null;
    const targetBand = Number(body.targetBand) || null;
    const placementAttemptId = body.placementAttemptId?.trim() || null;
    const levelSlug =
      body.levelSlug && isValidLevelSlug(body.levelSlug)
        ? body.levelSlug
        : bandToLevelSlug(overallBand ?? 5);

    const result = await enrollStudentInLevel({
      studentId,
      overallBand,
      targetBand,
      placementAttemptId,
      levelSlug,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      enrollmentId: result.enrollmentId,
      levelSlug: result.levelSlug,
      levelName: result.levelName,
      dashboardHref: "/dashboard/student",
    });
  } catch (err) {
    console.error("[course/enroll]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Enrollment failed" },
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

    const { getSupabase, countCourseProgress } = await import("@/lib/course/enrollment");
    const supabase = getSupabase();

    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id, status, enrolled_at, target_band, recommended_from_band, levels(name, id)")
      .eq("student_id", studentId)
      .eq("status", "active")
      .order("enrolled_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ enrolled: false });
    }

    const level = enrollment.levels;
    const progress = await countCourseProgress(studentId, enrollment.level_id);

    return NextResponse.json({
      enrolled: true,
      levelName: level?.name ?? null,
      levelSlug: level?.id ?? null,
      targetBand: enrollment.target_band,
      recommendedFromBand: enrollment.recommended_from_band,
      enrolledAt: enrollment.enrolled_at,
      progress,
    });
  } catch (err) {
    console.error("[course/enroll] GET", err);
    return NextResponse.json({ enrolled: false });
  }
}
