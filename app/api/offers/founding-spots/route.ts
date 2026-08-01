import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  FOUNDING_50_FALLBACK_SPOTS_REMAINING,
  FOUNDING_50_TOTAL_SPOTS,
} from "@/lib/discounts";
import { getFoundingSpotStatus } from "@/lib/foundingOfferServer";

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

    const status = await getFoundingSpotStatus(supabase);
    if (status.source !== "database") {
      return NextResponse.json({ ...fallback, reason: status.reason });
    }

    return NextResponse.json({
      totalSpots: FOUNDING_50_TOTAL_SPOTS,
      spotsRemaining: status.spotsRemaining,
      claimed: status.claimed,
      source: "database" as const,
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
