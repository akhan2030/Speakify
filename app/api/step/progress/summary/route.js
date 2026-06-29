import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureStepEnrollment, getStepSupabase } from "@/lib/step/enrollmentService";
import { fetchProgressSummary } from "@/lib/step/progressSummary";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const studentId =
    session?.user?.id ?? new URL(request.url).searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getStepSupabase();
    await ensureStepEnrollment(supabase, studentId);
    const summary = await fetchProgressSummary(supabase, studentId);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[step/progress/summary]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load progress" },
      { status: 500 }
    );
  }
}
