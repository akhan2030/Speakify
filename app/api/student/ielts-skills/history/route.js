import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skill = new URL(request.url).searchParams.get("skill");
    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ items: [] });
    }

    const supabase = getSupabase();

    if (skill === "writing") {
      const { data, error } = await supabase
        .from("writing_attempts")
        .select(
          "id, task_type, band_overall, band_ta, band_cc, band_lr, band_gra, created_at"
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return NextResponse.json({
        items: (data ?? []).map((row) => ({
          id: row.id,
          taskType: row.task_type,
          overallBand: row.band_overall,
          breakdown: {
            ta: row.band_ta,
            cc: row.band_cc,
            lr: row.band_lr,
            gra: row.band_gra,
          },
          date: row.created_at,
          dateLabel: formatDate(row.created_at),
        })),
      });
    }

    if (skill === "speaking") {
      const { data, error } = await supabase
        .from("speaking_attempts")
        .select(
          "id, part, task_type, band_overall, band_fc, band_lr, band_gra, band_p, created_at"
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return NextResponse.json({
        items: (data ?? []).map((row) => ({
          id: row.id,
          part: row.part,
          taskType: row.task_type,
          overallBand: row.band_overall,
          breakdown: {
            fc: row.band_fc,
            lr: row.band_lr,
            gra: row.band_gra,
            p: row.band_p,
          },
          date: row.created_at,
          dateLabel: formatDate(row.created_at),
        })),
      });
    }

    return NextResponse.json({ error: "Invalid skill" }, { status: 400 });
  } catch (err) {
    console.error("[ielts-skills/history]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load history" },
      { status: 500 }
    );
  }
}
