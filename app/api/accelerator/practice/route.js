import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidTrack } from "@/lib/accelerator/tracks";
import { buildLearningJourney } from "@/lib/accelerator/learningJourney";
import { getAcceleratorPracticeDashboard } from "@/lib/acceleratorTestPool";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { buildRecommendations } from "@/lib/course/recommendationEngine";
import { computeReadinessMeter } from "@/lib/course/readinessMeter";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const track = new URL(request.url).searchParams.get("track") ?? "";
    if (!isValidTrack(track)) {
      return NextResponse.json({ error: "Invalid track" }, { status: 400 });
    }

    const dashboard = await getAcceleratorPracticeDashboard(studentId, track);

    let placementBand = null;
    let globalReadiness = null;
    try {
      const profile = await fetchStudentProfile(studentId);
      const recommendations = buildRecommendations(profile);
      const meter = computeReadinessMeter(profile, recommendations);
      placementBand = profile.placementBand ?? profile.currentBand;
      globalReadiness = meter.readinessPercent;
    } catch {
      /* optional */
    }

    const journey = buildLearningJourney(track, dashboard, {
      placementBand,
      globalReadiness,
    });

    return NextResponse.json({ track, ...dashboard, journey });
  } catch (err) {
    console.error("[accelerator/practice GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load practice data" },
      { status: 500 }
    );
  }
}
