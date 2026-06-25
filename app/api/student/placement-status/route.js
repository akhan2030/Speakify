import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { bandToCefr } from "@/lib/placement/scoring";
import { DEFAULT_CEFR_LEVEL } from "@/lib/vocabulary";

export const runtime = "nodejs";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function hasAnyAttempts(supabase, studentId) {
  const tables = [
    { table: "reading_attempts", column: "student_id" },
    { table: "listening_attempts", column: "student_id" },
    { table: "speaking_attempts", column: "student_id" },
    { table: "writing_attempts", column: "student_id" },
  ];

  for (const { table, column } of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(column, studentId);

    if (!error && (count ?? 0) > 0) return true;
  }

  const { count: vocabCount, error: vocabError } = await supabase
    .from("student_vocab_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId);

  if (!vocabError && (vocabCount ?? 0) > 0) return true;

  return false;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({
        needsPlacementBanner: true,
        cefrLevel: DEFAULT_CEFR_LEVEL,
        hasAttempts: false,
      });
    }

    const supabase = getSupabase();

    let cefrLevel = DEFAULT_CEFR_LEVEL;
    let placementCompleted = false;

    const userRes = await supabase
      .from("users")
      .select("cefr_level, placement_test_completed")
      .eq("id", studentId)
      .maybeSingle();

    if (!userRes.error && userRes.data) {
      cefrLevel = userRes.data.cefr_level?.trim() || DEFAULT_CEFR_LEVEL;
      placementCompleted = Boolean(userRes.data.placement_test_completed);
    } else {
      const fallback = await supabase
        .from("users")
        .select("cefr_level")
        .eq("id", studentId)
        .maybeSingle();
      if (!fallback.error && fallback.data) {
        cefrLevel = fallback.data.cefr_level?.trim() || DEFAULT_CEFR_LEVEL;
      }
    }

    let placementBand = null;
    let placementCefrLevel = null;
    let placementCefrName = null;

    if (placementCompleted) {
      const { data: placementRow } = await supabase
        .from("placement_attempts")
        .select("overall_band, cefr_level")
        .eq("student_id", studentId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (placementRow) {
        placementBand =
          placementRow.overall_band != null
            ? Number(placementRow.overall_band)
            : null;
        placementCefrLevel = placementRow.cefr_level ?? cefrLevel;
        if (placementBand != null) {
          const mapped = bandToCefr(placementBand);
          placementCefrName = mapped.label;
          if (!placementCefrLevel) placementCefrLevel = mapped.cefr;
        }
      }
    }

    const showBanner = !placementCompleted;

    return NextResponse.json({
      showBanner,
      needsPlacementBanner: showBanner,
      cefrLevel,
      hasAttempts: await hasAnyAttempts(supabase, studentId),
      placementCompleted,
      placementBand,
      placementCefrLevel,
      placementCefrName,
    });
  } catch (err) {
    console.error("[student/placement-status]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load status" },
      { status: 500 }
    );
  }
}
