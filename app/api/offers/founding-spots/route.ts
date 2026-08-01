import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  FOUNDING_50_FALLBACK_SPOTS_REMAINING,
  FOUNDING_50_TOTAL_SPOTS,
} from "@/lib/discounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_KEY) return null;
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  const fallback = {
    totalSpots: FOUNDING_50_TOTAL_SPOTS,
    spotsRemaining: FOUNDING_50_FALLBACK_SPOTS_REMAINING,
    claimed: FOUNDING_50_TOTAL_SPOTS - FOUNDING_50_FALLBACK_SPOTS_REMAINING,
    source: "fallback" as const,
  };

  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(fallback);
    }

    const { count, error } = await supabase
      .from("founding_offer_claims")
      .select("id", { count: "exact", head: true });

    if (error || count == null) {
      return NextResponse.json(fallback);
    }

    const claimed = Math.max(0, Number(count));
    const spotsRemaining = Math.max(0, FOUNDING_50_TOTAL_SPOTS - claimed);

    return NextResponse.json({
      totalSpots: FOUNDING_50_TOTAL_SPOTS,
      spotsRemaining,
      claimed,
      source: "database" as const,
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
