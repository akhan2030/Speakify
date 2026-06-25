import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { buildRecommendations } from "@/lib/course/recommendationEngine";
import { computeReadinessMeter } from "@/lib/course/readinessMeter";
import { persistIeltsReadiness } from "@/lib/pathway/persistReadiness";

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
    const meter = computeReadinessMeter(profile, recommendations);
    await persistIeltsReadiness(studentId);

    return NextResponse.json(meter);
  } catch (err) {
    console.error("[student/readiness]", err);
    return NextResponse.json({ error: "Failed to load readiness" }, { status: 500 });
  }
}
