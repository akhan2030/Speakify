import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";

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

function resolveStudentId(session, queryStudentId) {
  const sessionId = session?.user?.id;
  if (!sessionId) return null;
  if (queryStudentId && queryStudentId !== sessionId) return null;
  return sessionId;
}

function averageBand(values) {
  const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return null;
  const avg = nums.reduce((sum, v) => sum + v, 0) / nums.length;
  return Math.round(avg * 2) / 2;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const studentId = resolveStudentId(session, searchParams.get("studentId"));

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({
        hasData: false,
        bandFC: null,
        bandLR: null,
        bandGRA: null,
        bandP: null,
        bandOverall: null,
        rows: [],
      });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("speaking_tracker")
      .select("band_fc, band_lr, band_gra, band_p, band_overall, attempts")
      .eq("student_id", studentId);

    if (error) {
      console.warn("[speaking/tracker] read:", error.message);
      return NextResponse.json({
        hasData: false,
        bandFC: null,
        bandLR: null,
        bandGRA: null,
        bandP: null,
        bandOverall: null,
        rows: [],
      });
    }

    const rows = data ?? [];
    const attempted = rows.filter((r) => (r.attempts ?? 0) > 0);

    if (attempted.length === 0) {
      return NextResponse.json({
        hasData: false,
        bandFC: null,
        bandLR: null,
        bandGRA: null,
        bandP: null,
        bandOverall: null,
        rows: [],
      });
    }

    const bandFC = averageBand(attempted.map((r) => r.band_fc));
    const bandLR = averageBand(attempted.map((r) => r.band_lr));
    const bandGRA = averageBand(attempted.map((r) => r.band_gra));
    const bandP = averageBand(attempted.map((r) => r.band_p));
    const bandOverall =
      averageBand(attempted.map((r) => r.band_overall)) ??
      averageBand(
        [bandFC, bandLR, bandGRA, bandP].filter(
          (b) => b !== null
        )
      );

    return NextResponse.json({
      hasData: true,
      bandFC,
      bandLR,
      bandGRA,
      bandP,
      bandOverall,
      rows,
    });
  } catch (err) {
    console.error("[speaking/tracker] GET", err);
    return NextResponse.json({
      hasData: false,
      bandFC: null,
      bandLR: null,
      bandGRA: null,
      bandP: null,
      bandOverall: null,
      rows: [],
    });
  }
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
