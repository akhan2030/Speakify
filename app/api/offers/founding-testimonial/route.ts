import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";

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

/** Should this founding buyer see the review prompt? */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const role = normalizeRole((session?.user as { role?: string })?.role);
    if (!userId || role !== "student") {
      return NextResponse.json({ shouldPrompt: false });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ shouldPrompt: false });
    }

    const { data: existing } = await (supabase as any)
      .from("founding_testimonials")
      .select("id, dismissed, rating")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ shouldPrompt: false, reason: "already_handled" });
    }

    const { data: claim } = await (supabase as any)
      .from("founding_offer_claims")
      .select("product_id, status")
      .eq("student_id", userId)
      .eq("status", "confirmed")
      .order("confirmed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!claim) {
      return NextResponse.json({ shouldPrompt: false, reason: "not_founding_buyer" });
    }

    const { count } = await supabase
      .from("mock_test_attempts")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("status", "completed");

    if (!count || count < 1) {
      return NextResponse.json({ shouldPrompt: false, reason: "no_completed_mock" });
    }

    const { data: latest } = await supabase
      .from("mock_test_attempts")
      .select("overall_band")
      .eq("student_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      shouldPrompt: true,
      productId: claim.product_id ?? null,
      overallBand: latest?.overall_band ?? null,
    });
  } catch (err) {
    console.error("[founding-testimonial GET]", err);
    return NextResponse.json({ shouldPrompt: false });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const role = normalizeRole((session?.user as { role?: string })?.role);
    if (!userId || role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));

    if (body.dismiss === true) {
      const { error } = await (supabase as any).from("founding_testimonials").insert({
        user_id: userId,
        product_id: body.productId ?? null,
        rating: null,
        dismissed: true,
        review_text: null,
        band_score: null,
      });
      if (error && !/duplicate|unique/i.test(String(error.message ?? ""))) {
        console.error("[founding-testimonial dismiss]", error);
        return NextResponse.json({ error: "Could not dismiss" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, dismissed: true });
    }

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
    }

    let bandScore: number | null = null;
    if (body.bandScore != null && body.bandScore !== "") {
      const n = Number(body.bandScore);
      if (!Number.isFinite(n) || n < 0 || n > 9) {
        return NextResponse.json({ error: "Invalid band score" }, { status: 400 });
      }
      bandScore = Math.round(n * 10) / 10;
    }

    const reviewText =
      typeof body.reviewText === "string" && body.reviewText.trim()
        ? body.reviewText.trim().slice(0, 600)
        : null;

    const { error } = await (supabase as any).from("founding_testimonials").insert({
      user_id: userId,
      product_id: body.productId ?? null,
      rating,
      review_text: reviewText,
      band_score: bandScore,
      dismissed: false,
    });

    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        return NextResponse.json({ ok: true, already: true });
      }
      console.error("[founding-testimonial POST]", error);
      return NextResponse.json({ error: "Could not save feedback" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[founding-testimonial POST]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
