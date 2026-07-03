import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyPlacementBankFilters } from "@/lib/placement/placementBankFilters";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** GET /api/placement/questions — valid MCQs from placement_question_bank only */
export async function GET(request) {
  try {
    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ questions: [], source: "none" });
    }

    const url = new URL(request.url);
    const section = url.searchParams.get("section")?.trim();
    const band = url.searchParams.get("band");

    const supabase = getSupabase();
    let query = applyPlacementBankFilters(
      supabase.from("placement_question_bank").select("*")
    );

    if (section) query = query.eq("section", section);
    if (band) query = query.eq("band", Number(band));

    const { data, error } = await query;

    if (error) {
      console.error("[placement/questions]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const questions = (data ?? []).filter((row) => {
      const o = row.options;
      if (!o || typeof o !== "object") return false;
      return ["A", "B", "C", "D"].every(
        (k) => typeof o[k] === "string" && o[k].trim().length > 0
      );
    });

    return NextResponse.json({
      questions,
      count: questions.length,
      source: "placement_question_bank",
    });
  } catch (err) {
    console.error("[placement/questions]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load questions" },
      { status: 500 }
    );
  }
}
