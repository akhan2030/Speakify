"use client";

import { useMemo } from "react";
import {
  DEFAULT_SESSION_MINUTES,
  GROUP_DAY_BADGE,
  WEEK_SECTION_LABELS,
  describeLiveSlot,
  formatSlotStartLabel,
  groupJoinProof,
  isStudentVisibleWeek,
  oneOnOneDayBadge,
  oneToOneSeatIsTaken,
  orientationBookedOnSameRiyadhDayElsewhere,
  riyadhParts,
  slotCta,
  weekSectionForSlot,
  type WeekSectionId,
} from "@/lib/live-classes/model";

export type CalendarSlot = {
  sessionId: string | null;
  startsAt: string;
  durationMinutes: number;
  sessionType?: "topic_group" | "one_to_one";
  enrolled: number;
  timeRangeLabel?: string;
  seatsLabel?: string;
  status: "open" | "confirmed" | "full" | "cancelled";
};

export type StudentSlotBooking = {
  startsAt: string;
  sessionType: string;
  billing: string;
  status: string;
};

type Props = {
  slots: CalendarSlot[];
  remainingIncluded: number;
  usesIncluded: boolean;
  packageIncluded?: number;
  needsOrientation?: boolean;
  myBookings?: StudentSlotBooking[];
  now?: Date;
  submitting?: boolean;
  bookDisabled?: boolean;
  showActions?: boolean;
  onBook?: (slot: CalendarSlot) => void;
};

function activeBookingForSlot(slot: CalendarSlot, bookings: StudentSlotBooking[] | undefined) {
  const slotTime = new Date(slot.startsAt).getTime();
  if (!Number.isFinite(slotTime)) return null;
  return (
    bookings?.find((booking) => {
      const status = String(booking.status ?? "").toLowerCase();
      if (status === "cancelled") return false;
      const expected =
        slot.sessionType === "topic_group" ? "topic_group" : "one_to_one";
      if (expected === "topic_group") {
        if (booking.sessionType !== "topic_group") return false;
      } else if (booking.sessionType !== "one_to_one" && booking.sessionType !== "orientation") {
        return false;
      }
      return Math.floor(new Date(booking.startsAt).getTime() / 60_000) === Math.floor(slotTime / 60_000);
    }) ?? null
  );
}

function formatDayHeading(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    timeZone: "Asia/Riyadh",
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

type DayGroup = {
  ymd: string;
  label: string;
  sessionType: "topic_group" | "one_to_one";
  slots: CalendarSlot[];
};

function daysForWeek(slots: CalendarSlot[]): DayGroup[] {
  const byDay = new Map<string, DayGroup>();
  const ordered = slots.slice().sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  for (const slot of ordered) {
    const parts = riyadhParts(slot.startsAt);
    if (!parts) continue;
    const sessionType = slot.sessionType === "topic_group" ? "topic_group" : "one_to_one";
    const existing = byDay.get(parts.ymd);
    if (existing) {
      existing.slots.push(slot);
      continue;
    }
    byDay.set(parts.ymd, {
      ymd: parts.ymd,
      label: formatDayHeading(slot.startsAt),
      sessionType,
      slots: [slot],
    });
  }
  return [...byDay.values()].sort((a, b) => a.ymd.localeCompare(b.ymd));
}

function TimeChoice({
  slot,
  daySlots,
  remainingIncluded,
  usesIncluded,
  packageIncluded = 0,
  needsOrientation = false,
  myBooking,
  myBookings,
  submitting,
  bookDisabled,
  showActions,
  onBook,
}: {
  slot: CalendarSlot;
  daySlots: CalendarSlot[];
  remainingIncluded: number;
  usesIncluded: boolean;
  packageIncluded: number;
  needsOrientation: boolean;
  myBooking: StudentSlotBooking | null;
  myBookings?: StudentSlotBooking[];
  submitting: boolean;
  bookDisabled: boolean;
  showActions: boolean;
  onBook?: (slot: CalendarSlot) => void;
}) {
  const sessionType = slot.sessionType === "topic_group" ? "topic_group" : "one_to_one";
  const isGroup = sessionType === "topic_group";
  const view = describeLiveSlot({
    enrolled: slot.enrolled,
    startsAt: slot.startsAt,
    durationMinutes: slot.durationMinutes || DEFAULT_SESSION_MINUTES,
    sessionType,
    remainingIncluded,
    usesIncluded,
  });
  const orientationElsewhere = orientationBookedOnSameRiyadhDayElsewhere({
    slotStartsAt: slot.startsAt,
    bookings: myBookings,
  });
  const seatTaken = oneToOneSeatIsTaken({
    enrolled: slot.enrolled,
    slotSessionId: slot.sessionId,
    siblingSessionIds: daySlots
      .filter((other) => other.startsAt !== slot.startsAt)
      .map((other) => other.sessionId),
    bookedHere: Boolean(myBooking),
  });
  const cta = slotCta({
    sessionType,
    remainingIncluded,
    usesIncluded,
    full: isGroup ? view.full : seatTaken,
    bookedByStudent: Boolean(myBooking),
    bookedBilling: myBooking?.billing,
    bookedSessionType: myBooking?.sessionType,
    needsOrientation: !isGroup && (needsOrientation || myBooking?.sessionType === "orientation"),
    orientationBookedElsewhere: !isGroup && orientationElsewhere,
    packageIncluded,
  });
  const locked = cta.kind === "locked" || cta.disabled;

  return (
    <div className="flex min-h-[3.25rem] min-w-[200px] flex-1 items-center justify-between gap-3 rounded-lg border border-speakify-line px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold tabular-nums text-speakify-navy">
          {formatSlotStartLabel(slot.startsAt)}
        </p>
        {isGroup ? (
          <p className="mt-0.5 text-xs text-speakify-muted">{groupJoinProof(slot.enrolled)}</p>
        ) : null}
      </div>
      {showActions && locked ? (
        <p
          className={`max-w-[14rem] shrink-0 rounded-md px-3 py-2 text-right text-[12px] font-semibold leading-snug ${
            cta.kind === "included"
              ? "bg-[#E7F0FA] text-[#2255A0]"
              : "bg-speakify-line text-speakify-muted"
          }`}
        >
          {cta.label}
        </p>
      ) : showActions ? (
        <button
          type="button"
          disabled={submitting || bookDisabled || cta.disabled}
          onClick={() => onBook?.(slot)}
          className="max-w-[10.5rem] shrink-0 rounded-md bg-speakify-navy px-3 py-2 text-center text-[11px] font-bold leading-snug text-white disabled:bg-speakify-line disabled:text-speakify-muted"
        >
          {cta.label}
        </button>
      ) : null}
    </div>
  );
}

export default function LiveClassWeekGrid({
  slots,
  remainingIncluded,
  usesIncluded,
  packageIncluded = 0,
  needsOrientation = false,
  myBookings,
  now,
  submitting = false,
  bookDisabled = false,
  showActions = false,
  onBook,
}: Props) {
  const clock = now ?? new Date();

  const weeks = useMemo(() => {
    const buckets: Record<"this_week" | "next_week", CalendarSlot[]> = {
      this_week: [],
      next_week: [],
    };
    for (const slot of slots) {
      if (slot.status === "cancelled") continue;
      if (!isStudentVisibleWeek(slot.startsAt, clock)) continue;
      const week = weekSectionForSlot(slot.startsAt, clock);
      if (week === "this_week" || week === "next_week") buckets[week].push(slot);
    }
    return (["this_week", "next_week"] as const).filter((week) => buckets[week].length > 0).map(
      (week) => [week, buckets[week]] as const
    );
  }, [clock, slots]);

  if (weeks.length === 0) {
    return (
      <p className="rounded-2xl border border-speakify-line bg-white px-4 py-6 text-center text-sm text-speakify-muted">
        No class times this week or next week.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {weeks.map(([week, weekSlots]) => {
        const days = daysForWeek(weekSlots);
        return (
          <section key={week}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-speakify-gold">
              {WEEK_SECTION_LABELS[week as WeekSectionId]}
            </h3>
            <div className="space-y-3">
              {days.map((day) => {
                const isGroup = day.sessionType === "topic_group";
                const dayStillNeedsOrientation =
                  Boolean(needsOrientation) &&
                  !day.slots.some((slot) =>
                    orientationBookedOnSameRiyadhDayElsewhere({
                      slotStartsAt: slot.startsAt,
                      bookings: myBookings,
                    })
                  ) &&
                  !day.slots.some((slot) => {
                    const mine = activeBookingForSlot(slot, myBookings);
                    return mine?.sessionType === "orientation";
                  });
                return (
                  <div
                    key={day.ymd}
                    className="rounded-2xl border border-speakify-line bg-white p-3 shadow-[0_1px_0_rgba(11,27,51,0.04)]"
                  >
                    <div className="mb-3 flex flex-col items-center gap-1.5 text-center">
                      <span
                        className={`rounded-lg px-5 py-2 text-[13px] font-extrabold uppercase tracking-wide ${
                          isGroup
                            ? "bg-speakify-gold text-speakify-navy"
                            : "bg-speakify-navy text-white"
                        }`}
                      >
                        {isGroup
                          ? GROUP_DAY_BADGE
                          : oneOnOneDayBadge({
                              remainingIncluded,
                              usesIncluded,
                              needsOrientation: dayStillNeedsOrientation,
                            })}
                      </span>
                      <p className="text-[15px] font-bold text-speakify-muted">{day.label}</p>
                      {!isGroup && dayStillNeedsOrientation ? (
                        <p className="max-w-sm text-xs font-medium leading-snug text-speakify-muted">
                          {week === "next_week" ? "Next week" : "This week"} you have 1
                          orientation + 1 One-on-One. Tap a time to book orientation first
                          — the other Monday slot stays a One-on-One.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {day.slots.map((slot) => (
                        <TimeChoice
                          key={slot.startsAt}
                          slot={slot}
                          daySlots={day.slots}
                          remainingIncluded={remainingIncluded}
                          usesIncluded={usesIncluded}
                          packageIncluded={packageIncluded}
                          needsOrientation={dayStillNeedsOrientation}
                          myBooking={activeBookingForSlot(slot, myBookings)}
                          myBookings={myBookings}
                          submitting={submitting}
                          bookDisabled={bookDisabled}
                          showActions={showActions}
                          onBook={onBook}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
