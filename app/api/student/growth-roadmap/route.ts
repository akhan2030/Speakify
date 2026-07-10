import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import {
  fetchStudentRoadmapItems,
  markRoadmapItemCompleted,
} from "@/lib/growthRoadmap/syncRoadmap";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("all") !== "1";
    const limit = Math.min(50, Number(url.searchParams.get("limit")) || 30);

    const supabase = getSupabaseAdmin();
    const items = await fetchStudentRoadmapItems(supabase, studentId, {
      activeOnly,
      limit,
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[growth-roadmap GET]", err);
    return NextResponse.json({ error: "Failed to load roadmap" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const itemId = String(body?.itemId ?? "").trim();
    const action = String(body?.action ?? "complete");

    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    if (action !== "complete") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const result = await markRoadmapItemCompleted(supabase, studentId, itemId);

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Update failed" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message:
        "Practice marked complete. Your band score will only change after your next scored session.",
    });
  } catch (err) {
    console.error("[growth-roadmap PATCH]", err);
    return NextResponse.json({ error: "Failed to update roadmap" }, { status: 500 });
  }
}
