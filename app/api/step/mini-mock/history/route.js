import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStepSupabase } from "@/lib/step/enrollmentService";

export async function GET() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getStepSupabase();

    const { data: mocks } = await supabase
      .from("step_mini_mock_results")
      .select("*")
      .eq("student_id", studentId)
      .order("completed_at", { ascending: false })
      .limit(5);

    const { count } = await supabase
      .from("step_mini_mock_results")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId);

    return NextResponse.json({
      mocks: mocks ?? [],
      nextMockNumber: (count ?? 0) + 1,
    });
  } catch (err) {
    console.error("[step/mini-mock/history]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load history" },
      { status: 500 }
    );
  }
}
