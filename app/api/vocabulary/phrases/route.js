import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BAND_FILTERS } from "@/lib/vocabulary";
import { getSupabase, getSupabaseUrl, mapPhraseRow } from "@/lib/vocabularySupabase";

export const runtime = "nodejs";

function bandMatches(filterId, bandLevel) {
  const filter = BAND_FILTERS.find((b) => b.id === filterId);
  if (!filter) return true;
  const normalized = String(bandLevel ?? "").trim();
  return filter.match.some(
    (m) => normalized === m || normalized.startsWith(m.replace("+", ""))
  );
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const skill = searchParams.get("skill") || "";
    const band = searchParams.get("band") || "";

    if (!getSupabaseUrl() || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ phrases: [] });
    }

    const supabase = getSupabase();
    let query = supabase
      .from("ielts_phrases")
      .select(
        "id, phrase, skill, function, band_level, example_sentence, avoid_phrase, memory_hook"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (skill) {
      query = query.eq("skill", skill);
    }

    const { data, error } = await query;
    if (error) throw error;

    let phrases = (data ?? []).map(mapPhraseRow);
    if (band) {
      phrases = phrases.filter((p) => bandMatches(band, p.band_level));
    }

    return NextResponse.json({ phrases });
  } catch (err) {
    console.error("[vocabulary/phrases]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load phrases" },
      { status: 500 }
    );
  }
}
