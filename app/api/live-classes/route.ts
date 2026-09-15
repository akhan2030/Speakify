import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";
import { liveClassCatalogForUser } from "@/lib/live-classes/packages";
import { loadLiveClassSummary } from "@/lib/live-classes/store";
import { creditBalanceHalalas, listMarketplace } from "@/lib/live-classes/marketplace";
import {
  GROUP_CLASS_MAX_STUDENTS,
  GROUP_CLASS_MIN_STUDENTS,
  GROUP_FILL_CUTOFF_HOURS,
  LIVE_CLASS_FIXED_PRICES,
  LIVE_CLASS_TIMEZONE,
  LIVE_CLASS_WEEKDAY_LABEL,
  courseWeeksForStudent,
  remainingIncluded,
} from "@/lib/live-classes/model";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const role = normalizeRole((session?.user as { role?: string })?.role);

    if (!studentId || role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const supabase = getSupabase();
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "enrolled_programs, program_selected, program_type, accelerator_track, checkout_track, payment_status, cefr_level, created_at"
      )
      .eq("id", studentId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const snapshot = {
      enrolledPrograms: user.enrolled_programs,
      programSelected: user.program_selected,
      programType: user.program_type,
      acceleratorTrack: user.accelerator_track,
      checkoutTrack: user.checkout_track,
      paymentStatus: user.payment_status,
      cefrLevel: user.cefr_level,
    };

    const summary = await loadLiveClassSummary(supabase, studentId, snapshot);
    const topic = summary.entitlements.find((pkg) => pkg.kindLabel === "topic");
    const remaining = topic ? remainingIncluded(topic.included, topic.used) : 0;
    const usesIncluded = Boolean(topic && remaining > 0 && topic.policy !== "language_development");
    const courseWeeks = courseWeeksForStudent({
      acceleratorTrack: user.accelerator_track,
      checkoutTrack: user.checkout_track,
      programType: user.program_type,
      programSelected: user.program_selected,
    });
    const requestedCatalog =
      new URL(request.url).searchParams.get("catalog") ?? "";
    const catalog = liveClassCatalogForUser(snapshot, requestedCatalog);
    const marketplace = await listMarketplace(supabase, {
      registeredAt: user.created_at ?? new Date(),
      remainingIncluded: remaining,
      usesIncluded,
      courseWeeks,
      catalog,
    });
    const creditsHalalas = await creditBalanceHalalas(supabase, studentId);

    return NextResponse.json({
      ok: true,
      entitlements: summary.entitlements,
      bookings: summary.bookings,
      marketplace,
      creditsHalalas,
      remainingIncluded: remaining,
      usesIncluded,
      catalog,
      registeredAt: user.created_at,
      courseWeeks,
      rules: {
        timezone: LIVE_CLASS_TIMEZONE,
        minNoticeDays: 0,
        classDays:
          catalog === "one_to_one_only"
            ? "Monday One-on-One"
            : LIVE_CLASS_WEEKDAY_LABEL,
        window:
          catalog === "one_to_one_only"
            ? "Monday · 6:00 PM and 7:05 PM · 55 minutes · One-on-One only"
            : `${LIVE_CLASS_WEEKDAY_LABEL} · 6:00 PM and 7:05 PM · 55 minutes`,
        fillCutoffHours: GROUP_FILL_CUTOFF_HOURS,
        groupSize:
          catalog === "one_to_one_only"
            ? null
            : `${GROUP_CLASS_MIN_STUDENTS}–${GROUP_CLASS_MAX_STUDENTS} students`,
        groupPrice: catalog === "one_to_one_only" ? null : LIVE_CLASS_FIXED_PRICES.groupLabel,
        oneToOnePrice: LIVE_CLASS_FIXED_PRICES.oneToOneLabel,
        recordings: "Sessions are recorded for replay.",
        notifications: {
          confirmedToRun:
            catalog === "one_to_one_only"
              ? null
              : "Email when a group class reaches 4 students and will run.",
          classTookPlace: "Separate email after the session has taken place.",
        },
      },
    });
  } catch (err) {
    console.error("[live-classes]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load live classes" },
      { status: 500 }
    );
  }
}
