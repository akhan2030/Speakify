import {
  DEFAULT_COURSE_WEEKS,
  DEFAULT_SESSION_MINUTES,
  MAX_COURSE_WEEKS,
  addRiyadhDays,
  dailyLiveSlotsForDate,
  isLiveClassWeekday,
  isOfferedLiveSlot,
  matchDailySlot,
  sessionFitsLiveWindow,
  studentWindowYmds,
} from "./model";

export type RiyadhClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  minutesOfDay: number;
  ymd: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function riyadhClock(date: Date | string): RiyadhClock | null {
  const d = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? NaN);
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");
  const hour = pick("hour");
  const minute = pick("minute");
  if ([year, month, day, hour, minute].some((n) => !Number.isFinite(n))) return null;
  return {
    year,
    month,
    day,
    hour,
    minute,
    minutesOfDay: hour * 60 + minute,
    ymd: `${year}-${pad(month)}-${pad(day)}`,
  };
}

export function riyadhLocalToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}): Date {
  return new Date(
    `${input.year}-${pad(input.month)}-${pad(input.day)}T${pad(input.hour)}:${pad(input.minute)}:00+03:00`
  );
}

export function liveWindowViolation(
  startsAt: Date | string,
  durationMinutes = DEFAULT_SESSION_MINUTES
): string | null {
  if (sessionFitsLiveWindow(startsAt, durationMinutes)) return null;
  return "Live classes must start at an offered time and finish before midnight (Riyadh).";
}

export function offeredSlotViolation(
  startsAt: Date | string,
  sessionType: "topic_group" | "one_to_one",
  durationMinutes = DEFAULT_SESSION_MINUTES
): string | null {
  const windowError = liveWindowViolation(startsAt, durationMinutes);
  if (windowError) return windowError;
  if (!isLiveClassWeekday(startsAt)) {
    return "Live classes run Monday and Tuesday.";
  }
  if (!matchDailySlot(startsAt, sessionType)) {
    return sessionType === "topic_group"
      ? "Group Live Classes run on Tuesday at 6:00 PM or 7:05 PM (Riyadh)."
      : "One-on-One classes run on Monday at 6:00 PM or 7:05 PM (Riyadh).";
  }
  return null;
}

/** @deprecated use offeredSlotViolation */
export function groupSlotViolation(
  startsAt: Date | string,
  durationMinutes = DEFAULT_SESSION_MINUTES
): string | null {
  return offeredSlotViolation(startsAt, "topic_group", durationMinutes);
}

export type MarketplaceSlot = {
  startsAt: string;
  durationMinutes: number;
  sessionType: "topic_group" | "one_to_one";
  label: string;
};

export function generateMarketplaceSlots(input?: {
  now?: Date;
  registeredAt?: Date | string;
  days?: number;
  durationMinutes?: number;
  sessionType?: "topic_group" | "one_to_one";
  courseWeeks?: number;
}): MarketplaceSlot[] {
  const now = input?.now ?? new Date();
  const durationMinutes = input?.durationMinutes ?? DEFAULT_SESSION_MINUTES;
  const slots: MarketplaceSlot[] = [];
  const window = studentWindowYmds(
    input?.registeredAt,
    now,
    input?.courseWeeks ?? DEFAULT_COURSE_WEEKS
  );
  if (!window) return slots;

  let ymd = window.startYmd;
  for (let dayOffset = 0; dayOffset < MAX_COURSE_WEEKS * 7 + 2; dayOffset += 1) {
    if (ymd > window.endYmd) break;
    const day = riyadhClock(`${ymd}T12:00:00+03:00`);
    if (!day) {
      ymd = addRiyadhDays(ymd, 1);
      continue;
    }
    const weekdayProbe = riyadhLocalToUtc({
      year: day.year,
      month: day.month,
      day: day.day,
      hour: 12,
      minute: 0,
    });
    if (!isLiveClassWeekday(weekdayProbe)) {
      ymd = addRiyadhDays(ymd, 1);
      continue;
    }

    for (const spec of dailyLiveSlotsForDate(weekdayProbe)) {
      if (input?.sessionType && spec.sessionType !== input.sessionType) continue;
      const hour = Math.floor(spec.startMinutes / 60);
      const minute = spec.startMinutes % 60;
      const starts = riyadhLocalToUtc({
        year: day.year,
        month: day.month,
        day: day.day,
        hour,
        minute,
      });
      if (starts.getTime() < now.getTime()) continue;
      if (!sessionFitsLiveWindow(starts, durationMinutes)) continue;
      if (!isOfferedLiveSlot(starts, spec.sessionType)) continue;
      slots.push({
        startsAt: starts.toISOString(),
        durationMinutes,
        sessionType: spec.sessionType,
        label: `${day.ymd} ${pad(hour)}:${pad(minute)}`,
      });
    }
    ymd = addRiyadhDays(ymd, 1);
  }

  return slots;
}
