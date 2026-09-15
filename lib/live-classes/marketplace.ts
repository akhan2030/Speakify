import type { SupabaseClient } from "@supabase/supabase-js";
import { getAppBaseUrl } from "@/lib/appUrl";
import {
  DEFAULT_SESSION_MINUTES,
  GROUP_CLASS_MAX_STUDENTS,
  checkoutHalalasForPayg,
  countsTowardGroupFill,
  describeLiveSlot,
  groupIsFull,
  groupReachedMinimum,
  marketplaceCalendarType,
  marketplaceSlotKey,
  seatsNeededToConfirm,
  shouldAutoCancelUnderfilled,
  shouldMarkSessionComplete,
} from "./model";
import { generateMarketplaceSlots, offeredSlotViolation } from "./calendar";
import { sendLiveClassEmail } from "./notifications";

const FILL_STATUSES = ["reserved", "confirmed", "completed"];

export type MarketplaceListing = {
  sessionId: string | null;
  startsAt: string;
  durationMinutes: number;
  sessionType: "topic_group" | "one_to_one";
  typeLabel: string;
  enrolled: number;
  capacity: number;
  needed: number;
  seatsRemaining: number;
  timeRangeLabel: string;
  seatsLabel: string;
  registeredLabel: string;
  confirmLabel: string;
  billingKind: "included" | "paid";
  billingLabel: string;
  confirmedToRun: boolean;
  full: boolean;
  status: "open" | "confirmed" | "full" | "cancelled";
  neededLabel: string;
};

function listingFromFill(input: {
  sessionId: string | null;
  startsAt: string;
  durationMinutes: number;
  enrolled: number;
  sessionType: "topic_group" | "one_to_one";
  capacity?: number;
  remainingIncluded?: number;
  usesIncluded?: boolean;
}): MarketplaceListing {
  const display = describeLiveSlot({
    enrolled: input.enrolled,
    startsAt: input.startsAt,
    durationMinutes: input.durationMinutes,
    capacity: input.capacity,
    sessionType: input.sessionType,
    remainingIncluded: input.remainingIncluded,
    usesIncluded: input.usesIncluded,
  });
  return {
    sessionId: input.sessionId,
    startsAt: input.startsAt,
    durationMinutes: input.durationMinutes,
    sessionType: display.sessionType,
    typeLabel: display.typeLabel,
    enrolled: display.enrolled,
    capacity: display.capacity,
    needed: seatsNeededToConfirm(display.enrolled),
    seatsRemaining: display.seatsRemaining,
    timeRangeLabel: display.timeRangeLabel,
    seatsLabel: display.seatsLabel,
    registeredLabel: display.registeredLabel,
    confirmLabel: display.confirmLabel,
    billingKind: display.billingKind,
    billingLabel: display.billingLabel,
    confirmedToRun: display.confirmedToRun,
    full: display.full,
    status: display.status,
    neededLabel: display.confirmLabel,
  };
}

async function enrolledCount(supabase: SupabaseClient, sessionId: string): Promise<number> {
  const { data } = await supabase
    .from("live_class_bookings")
    .select("id, status")
    .eq("session_id", sessionId)
    .in("status", FILL_STATUSES);
  return (data ?? []).filter((row) => countsTowardGroupFill(String(row.status))).length;
}

export async function creditBalanceHalalas(
  supabase: SupabaseClient,
  studentId: string
): Promise<number> {
  const { data } = await supabase
    .from("live_class_credits")
    .select("remaining_halalas")
    .eq("student_id", studentId)
    .gt("remaining_halalas", 0);
  return (data ?? []).reduce((sum, row) => sum + Number(row.remaining_halalas ?? 0), 0);
}

export async function spendCredits(
  supabase: SupabaseClient,
  studentId: string,
  amountHalalas: number
): Promise<number> {
  let remaining = amountHalalas;
  if (remaining <= 0) return 0;
  const { data } = await supabase
    .from("live_class_credits")
    .select("id, remaining_halalas")
    .eq("student_id", studentId)
    .gt("remaining_halalas", 0)
    .order("created_at", { ascending: true });

  for (const row of data ?? []) {
    if (remaining <= 0) break;
    const available = Number(row.remaining_halalas ?? 0);
    const take = Math.min(available, remaining);
    await supabase
      .from("live_class_credits")
      .update({ remaining_halalas: available - take })
      .eq("id", row.id);
    remaining -= take;
  }
  return amountHalalas - remaining;
}

export async function grantCancellationCredit(
  supabase: SupabaseClient,
  input: {
    studentId: string;
    amountHalalas: number;
    sessionId: string;
    bookingId: string;
  }
) {
  if (input.amountHalalas <= 0) return;
  await supabase.from("live_class_credits").insert({
    student_id: input.studentId,
    amount_halalas: input.amountHalalas,
    remaining_halalas: input.amountHalalas,
    reason: "group_session_underfilled",
    session_id: input.sessionId,
    booking_id: input.bookingId,
  });
}

function marketplaceHref(): string {
  return `${getAppBaseUrl() || "https://ielts-ai-tutor-neon.vercel.app"}/dashboard/ielts/student/live-classes`;
}

export async function listMarketplace(
  supabase: SupabaseClient,
  input?: {
    registeredAt?: Date | string;
    now?: Date;
    remainingIncluded?: number;
    usesIncluded?: boolean;
    courseWeeks?: number;
    catalog?: "standard" | "one_to_one_only";
  }
): Promise<MarketplaceListing[]> {
  let generated = generateMarketplaceSlots({
    registeredAt: input?.registeredAt,
    now: input?.now,
    courseWeeks: input?.courseWeeks,
    sessionType: input?.catalog === "one_to_one_only" ? "one_to_one" : undefined,
  });
  if (generated.length === 0 && !input?.registeredAt) {
    generated = generateMarketplaceSlots({
      now: input?.now ?? new Date(),
      courseWeeks: input?.courseWeeks,
      sessionType: input?.catalog === "one_to_one_only" ? "one_to_one" : undefined,
    });
  }
  if (generated.length === 0) return [];
  const { data: sessions } = await supabase
    .from("live_class_sessions")
    .select("id, starts_at, duration_minutes, session_type, status, fill_status, capacity")
    .gte("starts_at", generated[0]?.startsAt ?? new Date().toISOString())
    .in("status", ["scheduled", "open", "confirmed"]);

  const byKey = new Map<string, MarketplaceListing>();

  for (const slot of generated) {
    byKey.set(
      marketplaceSlotKey(slot.startsAt, slot.sessionType),
      listingFromFill({
        sessionId: null,
        startsAt: slot.startsAt,
        durationMinutes: slot.durationMinutes,
        enrolled: 0,
        sessionType: slot.sessionType,
        remainingIncluded: input?.remainingIncluded,
        usesIncluded: input?.usesIncluded,
      })
    );
  }

  for (const session of sessions ?? []) {
    const sessionType = marketplaceCalendarType(String(session.session_type));
    const key = marketplaceSlotKey(session.starts_at, sessionType);
    if (!byKey.has(key)) continue;
    const enrolled = await enrolledCount(supabase, session.id);
    byKey.set(
      key,
      listingFromFill({
        sessionId: session.id,
        startsAt: session.starts_at,
        durationMinutes: session.duration_minutes ?? DEFAULT_SESSION_MINUTES,
        enrolled,
        sessionType,
        capacity: session.capacity ?? (sessionType === "one_to_one" ? 1 : GROUP_CLASS_MAX_STUDENTS),
        remainingIncluded: input?.remainingIncluded,
        usesIncluded: input?.usesIncluded,
      })
    );
  }

  return [...byKey.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function findOrOpenGroupSession(
  supabase: SupabaseClient,
  startsAt: string,
  durationMinutes: number
): Promise<{ id: string } | { error: string }> {
  const windowError = offeredSlotViolation(startsAt, "topic_group", durationMinutes);
  if (windowError) return { error: windowError };

  const start = new Date(startsAt).toISOString();
  const { data: existing } = await supabase
    .from("live_class_sessions")
    .select("id, capacity, status, fill_status")
    .eq("session_type", "topic_group")
    .eq("starts_at", start)
    .not("status", "eq", "cancelled")
    .limit(1)
    .maybeSingle();

  if (existing) {
    const enrolled = await enrolledCount(supabase, existing.id);
    if (groupIsFull(enrolled)) return { error: "That group class is full (6 students)." };
    return { id: existing.id };
  }

  const { data: created, error } = await supabase
    .from("live_class_sessions")
    .insert({
      session_type: "topic_group",
      starts_at: start,
      duration_minutes: durationMinutes,
      capacity: GROUP_CLASS_MAX_STUDENTS,
      status: "open",
      fill_status: "open",
    })
    .select("id")
    .single();

  if (error || !created) return { error: error?.message ?? "Could not open this slot" };
  return { id: created.id };
}

export async function findOrOpenOneToOneSession(
  supabase: SupabaseClient,
  startsAt: string,
  durationMinutes: number
): Promise<{ id: string } | { error: string }> {
  const windowError = offeredSlotViolation(startsAt, "one_to_one", durationMinutes);
  if (windowError) return { error: windowError };

  const start = new Date(startsAt).toISOString();
  const { data: existing } = await supabase
    .from("live_class_sessions")
    .select("id, capacity, status")
    .eq("session_type", "one_to_one")
    .eq("starts_at", start)
    .not("status", "eq", "cancelled")
    .limit(1)
    .maybeSingle();

  if (existing) {
    const enrolled = await enrolledCount(supabase, existing.id);
    if (enrolled >= 1) return { error: "That One-on-One time is already booked." };
    return { id: existing.id };
  }

  const { data: created, error } = await supabase
    .from("live_class_sessions")
    .insert({
      session_type: "one_to_one",
      starts_at: start,
      duration_minutes: durationMinutes,
      capacity: 1,
      status: "open",
      fill_status: "open",
    })
    .select("id")
    .single();

  if (error || !created) return { error: error?.message ?? "Could not open this One-on-One slot" };
  return { id: created.id };
}

export async function afterGroupEnrollment(
  supabase: SupabaseClient,
  sessionId: string | null
) {
  if (!sessionId) return;
  const enrolled = await enrolledCount(supabase, sessionId);
  if (!groupReachedMinimum(enrolled)) return;

  const { data: session } = await supabase
    .from("live_class_sessions")
    .select("id, starts_at, fill_status, confirmed_notified_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return;

  await supabase
    .from("live_class_sessions")
    .update({ status: "confirmed", fill_status: "confirmed" })
    .eq("id", sessionId);

  await supabase
    .from("live_class_bookings")
    .update({ status: "confirmed" })
    .eq("session_id", sessionId)
    .in("status", ["reserved", "confirmed"]);

  if (session.confirmed_notified_at) return;

  const { data: bookings } = await supabase
    .from("live_class_bookings")
    .select("student_id")
    .eq("session_id", sessionId)
    .in("status", FILL_STATUSES);

  const studentIds = [...new Set((bookings ?? []).map((b) => b.student_id))];
  if (studentIds.length) {
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", studentIds);
    for (const user of users ?? []) {
      if (!user.email) continue;
      await sendLiveClassEmail({
        to: user.email,
        name: String(user.name ?? "there"),
        kind: "confirmed_to_run",
        startsAt: session.starts_at,
        marketplaceHref: marketplaceHref(),
      });
    }
  }

  await supabase
    .from("live_class_sessions")
    .update({ confirmed_notified_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function runLiveClassLifecycle(supabase: SupabaseClient, now = new Date()) {
  const cancelled: string[] = [];
  const completed: string[] = [];

  const { data: openSessions } = await supabase
    .from("live_class_sessions")
    .select("id, starts_at, duration_minutes, status, fill_status, cancelled_notified_at")
    .eq("session_type", "topic_group")
    .in("status", ["scheduled", "open"])
    .is("cancelled_notified_at", null);

  for (const session of openSessions ?? []) {
    const enrolled = await enrolledCount(supabase, session.id);
    if (
      !shouldAutoCancelUnderfilled({
        enrolled,
        startsAt: session.starts_at,
        now,
        alreadyCancelled: false,
      })
    ) {
      continue;
    }

    await supabase
      .from("live_class_sessions")
      .update({
        status: "cancelled",
        fill_status: "cancelled",
        cancelled_notified_at: now.toISOString(),
      })
      .eq("id", session.id);

    const { data: bookings } = await supabase
      .from("live_class_bookings")
      .select("id, student_id, billing, status")
      .eq("session_id", session.id)
      .in("status", ["reserved", "confirmed", "pending_payment"]);

    const studentIds = [...new Set((bookings ?? []).map((b) => b.student_id))];
    const { data: users } = studentIds.length
      ? await supabase.from("users").select("id, name, email").in("id", studentIds)
      : { data: [] };

    for (const booking of bookings ?? []) {
      await supabase.from("live_class_bookings").update({ status: "cancelled" }).eq("id", booking.id);
      if (booking.billing === "payg" || booking.billing === "credit") {
        await grantCancellationCredit(supabase, {
          studentId: booking.student_id,
          amountHalalas: checkoutHalalasForPayg({ sessionType: "topic_group" }),
          sessionId: session.id,
          bookingId: booking.id,
        });
      }
      const user = (users ?? []).find((u) => u.id === booking.student_id);
      if (user?.email) {
        await sendLiveClassEmail({
          to: user.email,
          name: String(user.name ?? "there"),
          kind: "cancelled_underfilled",
          startsAt: session.starts_at,
          marketplaceHref: marketplaceHref(),
        });
      }
    }
    cancelled.push(session.id);
  }

  const { data: running } = await supabase
    .from("live_class_sessions")
    .select("id, starts_at, duration_minutes, status, completed_notified_at")
    .in("status", ["confirmed", "open", "scheduled"])
    .is("completed_notified_at", null);

  for (const session of running ?? []) {
    if (
      !shouldMarkSessionComplete({
        startsAt: session.starts_at,
        durationMinutes: session.duration_minutes ?? DEFAULT_SESSION_MINUTES,
        now,
      })
    ) {
      continue;
    }
    const enrolled = await enrolledCount(supabase, session.id);
    if (!groupReachedMinimum(enrolled) && session.status !== "confirmed") continue;

    await supabase
      .from("live_class_sessions")
      .update({
        status: "completed",
        completed_notified_at: now.toISOString(),
      })
      .eq("id", session.id);
    await supabase
      .from("live_class_bookings")
      .update({ status: "completed" })
      .eq("session_id", session.id)
      .in("status", ["confirmed", "reserved"]);

    const { data: bookings } = await supabase
      .from("live_class_bookings")
      .select("student_id")
      .eq("session_id", session.id)
      .eq("status", "completed");
    const ids = [...new Set((bookings ?? []).map((b) => b.student_id))];
    const { data: users } = ids.length
      ? await supabase.from("users").select("id, name, email").in("id", ids)
      : { data: [] };
    for (const user of users ?? []) {
      if (!user.email) continue;
      await sendLiveClassEmail({
        to: user.email,
        name: String(user.name ?? "there"),
        kind: "class_took_place",
        startsAt: session.starts_at,
        marketplaceHref: marketplaceHref(),
      });
    }
    completed.push(session.id);
  }

  return { cancelled: cancelled.length, completed: completed.length };
}
