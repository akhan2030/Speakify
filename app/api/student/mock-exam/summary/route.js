import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

import { normalizeAttemptRow } from "@/lib/mock-test/attemptSchema";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ lastMock: null });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("mock_test_attempts")
      .select("id, overall_band, completed_at, status, exam_content, examiner_report")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ lastMock: null });
    }

    const normalized = normalizeAttemptRow(data);
    const confidence =
      normalized.report?.confidencePercent ??
      normalized.report?.bandPrediction?.probabilityPercent ??
      null;

    return NextResponse.json({
      lastMock: {
        attemptId: data.id,
        overallBand: data.overall_band,
        completedAt: data.completed_at,
        confidencePercent: confidence,
      },
    });
  } catch (err) {
    console.error("[student/mock-exam/summary]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load summary" },
      { status: 500 }
    );
  }
}
