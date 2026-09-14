import type { SupabaseClient } from "@supabase/supabase-js";
import {
  GROUP_CLASS_MAX_STUDENTS,
  ORIENTATION_INCLUDED_COUNT,
  remainingIncluded,
  shouldOfferPayg,
  startsAtMeetsNotice,
  type LiveBilling,
  type LiveSessionType,
} from "./model";
import { offeredSlotViolation } from "./calendar";
import { orientationPackage, packagesForStudent, type LiveClassUserSnapshot } from "./packages";

const COUNTED_STATUSES = ["reserved", "confirmed", "completed"];

export type LiveClassBookingRow = {
  id: string;
  student_id: string;
  session_id: string | null;
  course_key: string;
  session_type: LiveSessionType;
  starts_at: string;
  duration_minutes: number;
  billing: LiveBilling;
  status: string;
  moyasar_payment_id: string | null;
  recording_url: string | null;
};

function missingTable(error: { message?: string; code?: string } | null): boolean {
  const msg = String(error?.message ?? "");
  return (
    error?.code === "42P01" ||
    msg.includes("live_class_") ||
    msg.includes("schema cache") ||
    msg.toLowerCase().includes("does not exist")
  );
}

export async function ensureOrientationEntitlement(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ ok: boolean; skipped?: boolean }> {
  const pkg = orientationPackage();
  const { error } = await supabase.from("live_class_entitlements").upsert(
    {
      student_id: studentId,
      kind: "orientation",
      course_key: pkg.courseKey,
      included_count: ORIENTATION_INCLUDED_COUNT,
    },
    { onConflict: "student_id,kind,course_key" }
  );

  if (error) {
    if (missingTable(error)) {
      console.warn("[live-classes] tables missing — run supabase/live_classes_setup.sql");
      return { ok: false, skipped: true };
    }
    console.warn("[live-classes] orientation upsert:", error.message);
    return { ok: false };
  }

  // Hard rule: never create a booking the student did not pick. Cancel leftover
  // pending_schedule orientation rows that were auto-inserted without a slot.
  await supabase
    .from("live_class_bookings")
    .update({ status: "cancelled" })
    .eq("student_id", studentId)
    .eq("session_type", "orientation")
    .eq("status", "pending_schedule");

  return { ok: true };
}

export async function ensureTopicEntitlements(
  supabase: SupabaseClient,
  studentId: string,
  user: LiveClassUserSnapshot
): Promise<void> {
  const packages = packagesForStudent(user).filter((pkg) => pkg.kind !== "account");
  for (const pkg of packages) {
    const { error } = await supabase.from("live_class_entitlements").upsert(
      {
        student_id: studentId,
        kind: "topic",
        course_key: pkg.courseKey,
        included_count: pkg.topicIncluded,
      },
      { onConflict: "student_id,kind,course_key" }
    );
    if (error) {
      if (missingTable(error)) return;
      console.warn("[live-classes] topic upsert:", error.message);
    }
  }
}

export async function countActiveOrientations(
  supabase: SupabaseClient,
  studentId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("live_class_bookings")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("session_type", "orientation")
    .in("status", COUNTED_STATUSES);

  if (error) return ORIENTATION_INCLUDED_COUNT;
  return (data ?? []).length;
}

export async function countUsedIncluded(
  supabase: SupabaseClient,
  studentId: string,
  courseKey: string,
  sessionTypes: LiveSessionType[]
): Promise<number> {
  const { data, error } = await supabase
    .from("live_class_bookings")
    .select("id, session_type, billing, status")
    .eq("student_id", studentId)
    .eq("course_key", courseKey)
    .eq("billing", "included");

  if (error) return 0;
  return (data ?? []).filter(
    (row) =>
      sessionTypes.includes(row.session_type as LiveSessionType) &&
      COUNTED_STATUSES.includes(String(row.status))
  ).length;
}

export async function loadLiveClassSummary(
  supabase: SupabaseClient,
  studentId: string,
  user: LiveClassUserSnapshot
) {
  await ensureOrientationEntitlement(supabase, studentId);
  await ensureTopicEntitlements(supabase, studentId, user);

  const packages = packagesForStudent(user);
  const { data: bookings } = await supabase
    .from("live_class_bookings")
    .select(
      "id, student_id, session_id, course_key, session_type, starts_at, duration_minutes, billing, status, moyasar_payment_id, recording_url"
    )
    .eq("student_id", studentId)
    .order("starts_at", { ascending: true });

  const rows = (bookings ?? []) as LiveClassBookingRow[];

  const entitlements = await Promise.all(
    packages.map(async (pkg) => {
      if (pkg.kind === "account") {
        const used = rows.filter(
          (b) =>
            b.session_type === "orientation" &&
            b.billing === "included" &&
            COUNTED_STATUSES.includes(b.status)
        ).length;
        const included = ORIENTATION_INCLUDED_COUNT;
        return {
          ...pkg,
          kindLabel: "orientation" as const,
          included,
          used,
          remaining: remainingIncluded(included, used),
          payg: false,
        };
      }

      const used = rows.filter(
        (b) =>
          b.course_key === pkg.courseKey &&
          b.session_type === "one_to_one" &&
          b.billing === "included" &&
          COUNTED_STATUSES.includes(b.status)
      ).length;
      const included = pkg.topicIncluded;
      return {
        ...pkg,
        kindLabel: "topic" as const,
        included,
        used,
        remaining: remainingIncluded(included, used),
        payg: shouldOfferPayg(included, used),
      };
    })
  );

  return { entitlements, bookings: rows };
}

export async function findOrCreateGroupSession(
  supabase: SupabaseClient,
  startsAt: string,
  durationMinutes: number
): Promise<{ id: string } | { error: string }> {
  const start = new Date(startsAt);
  const windowStart = new Date(start.getTime() - 15 * 60 * 1000).toISOString();
  const windowEnd = new Date(start.getTime() + 15 * 60 * 1000).toISOString();

  const { data: existing } = await supabase
    .from("live_class_sessions")
    .select("id, capacity")
    .eq("session_type", "topic_group")
    .eq("status", "scheduled")
    .gte("starts_at", windowStart)
    .lte("starts_at", windowEnd)
    .limit(8);

  for (const session of existing ?? []) {
    const { count } = await supabase
      .from("live_class_bookings")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .in("status", COUNTED_STATUSES);
    if ((count ?? 0) < (session.capacity ?? GROUP_CLASS_MAX_STUDENTS)) {
      return { id: session.id };
    }
  }

  const { data: created, error } = await supabase
    .from("live_class_sessions")
    .insert({
      session_type: "topic_group",
      starts_at: start.toISOString(),
      duration_minutes: durationMinutes,
      capacity: GROUP_CLASS_MAX_STUDENTS,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error || !created) return { error: error?.message ?? "Could not open a group session" };
  return { id: created.id };
}

export async function insertLiveClassBooking(
  supabase: SupabaseClient,
  input: {
    studentId: string;
    courseKey: string;
    sessionType: LiveSessionType;
    startsAt: string;
    durationMinutes: number;
    billing: LiveBilling;
    status: string;
    sessionId?: string | null;
    moyasarPaymentId?: string | null;
  }
): Promise<{ ok: true; booking: LiveClassBookingRow } | { ok: false; error: string }> {
  if (String(input.status ?? "").toLowerCase() === "pending_schedule") {
    return {
      ok: false,
      error: "Bookings must be for a specific day and time the student chose.",
    };
  }
  if (!input.startsAt || !Number.isFinite(new Date(input.startsAt).getTime())) {
    return { ok: false, error: "Pick a valid session time." };
  }
  if (!startsAtMeetsNotice(input.startsAt, new Date(), input.sessionType)) {
    return {
      ok: false,
      error: "That class time has already passed.",
    };
  }

  const calendarType = input.sessionType === "topic_group" ? "topic_group" : "one_to_one";
  const windowError = offeredSlotViolation(input.startsAt, calendarType, input.durationMinutes);
  if (windowError) return { ok: false, error: windowError };

  const { data, error } = await supabase
    .from("live_class_bookings")
    .insert({
      student_id: input.studentId,
      session_id: input.sessionId ?? null,
      course_key: input.courseKey,
      session_type: input.sessionType,
      starts_at: input.startsAt,
      duration_minutes: input.durationMinutes,
      billing: input.billing,
      status: input.status,
      moyasar_payment_id: input.moyasarPaymentId ?? null,
    })
    .select(
      "id, student_id, session_id, course_key, session_type, starts_at, duration_minutes, billing, status, moyasar_payment_id, recording_url"
    )
    .single();

  if (error || !data) {
    const code = String((error as { code?: string } | null)?.code ?? "");
    const msg = String(error?.message ?? "").toLowerCase();
    if (code === "23505" || msg.includes("live_class_one_active_orientation")) {
      return {
        ok: false,
        error: "Your orientation is already booked. Pick a One-on-One slot instead.",
      };
    }
    return { ok: false, error: error?.message ?? "Could not save booking" };
  }

  return { ok: true, booking: data as LiveClassBookingRow };
}

export async function confirmPaygBooking(
  supabase: SupabaseClient,
  moyasarPaymentId: string
): Promise<{ ok: true; alreadyPaid: boolean } | { ok: false; error: string }> {
  const paymentId = String(moyasarPaymentId).trim();
  if (!paymentId) return { ok: false, error: "Missing payment id" };

  const { data: booking } = await supabase
    .from("live_class_bookings")
    .select("id, status, session_id, session_type")
    .eq("moyasar_payment_id", paymentId)
    .maybeSingle();

  if (!booking) {
    return { ok: false, error: "Live-class booking not found for payment" };
  }

  if (booking.status === "confirmed" || booking.status === "completed" || booking.status === "reserved") {
    return { ok: true, alreadyPaid: true };
  }

  const nextStatus = booking.session_type === "one_to_one" ? "confirmed" : "reserved";
  const { error } = await supabase
    .from("live_class_bookings")
    .update({ status: nextStatus })
    .eq("id", booking.id);

  if (error) return { ok: false, error: error.message };

  if (booking.session_id && booking.session_type === "topic_group") {
    const { afterGroupEnrollment } = await import("./marketplace");
    await afterGroupEnrollment(supabase, booking.session_id);
  }

  return { ok: true, alreadyPaid: false };
}
