import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import {
  ACCELERATOR_TRACKS,
} from "@/lib/accelerator/tracks";
import { getProfileAcceleratorTrack } from "@/lib/course/studentProfile";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await fetchStudentProfile(studentId);
    const placementBand =
      profile.placementBand ??
      profile.currentBand ??
      profile.skillBands?.reading ??
      null;

    const recommendedTrack = getProfileAcceleratorTrack(profile);

    return NextResponse.json({
      placementBand,
      targetBand: profile.targetBand,
      recommendedTrack,
      recommendedTrackName: ACCELERATOR_TRACKS[recommendedTrack].name,
      tracks: Object.values(ACCELERATOR_TRACKS).map((t) => ({
        id: t.id,
        name: t.name,
        target: t.target,
        entry: t.entry,
        duration: t.duration,
        price: t.price,
        weekCount: t.weekCount,
        badge: t.badge ?? null,
        bullets: t.bullets,
        href: `/dashboard/student/accelerator/${t.id}`,
        isRecommended: t.id === recommendedTrack,
      })),
    });
  } catch (err) {
    console.error("[student/accelerator]", err);
    return NextResponse.json({ error: "Failed to load accelerator data" }, { status: 500 });
  }
}
