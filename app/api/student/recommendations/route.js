import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { buildRecommendations } from "@/lib/course/recommendationEngine";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await fetchStudentProfile(studentId);
    const recommendations = buildRecommendations(profile);

    return NextResponse.json({
      profile: {
        currentBand: profile.currentBand,
        targetBand: profile.targetBand,
        bandGap: profile.bandGap,
        weakAreas: profile.weakAreas,
        strongAreas: profile.strongAreas,
        enrolledTrackSlug: profile.enrolledTrackSlug,
        enrolledTrackName: profile.enrolledTrackName,
        courseProgressPercent: profile.courseProgressPercent,
      },
      ...recommendations,
    });
  } catch (err) {
    console.error("[student/recommendations]", err);
    return NextResponse.json({ error: "Failed to load recommendations" }, { status: 500 });
  }
}
