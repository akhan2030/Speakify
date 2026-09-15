/**
 * Speakify live classes — two products, not one.
 *
 * 1. Test-prep (IELTS Academic/General, TOEFL):
 *    1 orientation + included One-on-One classes by tier (Foundation 2, Plus 3, Elite 4).
 *    Group classes are always paid and stay locked until those One-on-Ones are used.
 *    STEP is One-on-One only — no group marketplace on the STEP dashboard.
 * 2. Language development (Pathway CEFR levels, Business, Legal, Kids):
 *    orientation only. Every other session is bought on the marketplace.
 *
 * Group fill: 4–6 students. A group class runs only at the minimum.
 * Window: Asia/Riyadh. Monday is One-on-One; Tuesday is Group. Same two evening times each day.
 * A One-on-One slot is one shared seat: a free live class or 200 SAR depending on this student's remaining credit.
 */

export const LIVE_CLASS_TIMEZONE = "Asia/Riyadh";
export const LIVE_CLASS_MIN_NOTICE_DAYS = 0;
export const DEFAULT_COURSE_WEEKS = 6;
export const MAX_COURSE_WEEKS = 16;
export const GROUP_FILL_CUTOFF_HOURS = 24;

export const GROUP_CLASS_MIN_STUDENTS = 4;
export const GROUP_CLASS_MAX_STUDENTS = 6;

export const SLOT_EARLIEST_START_MINUTES = 18 * 60; // 6:00 PM
export const SLOT_LATEST_START_MINUTES = 19 * 60 + 5; // 7:05 PM
export const DEFAULT_SESSION_MINUTES = 55;
export const SLOT_GAP_MINUTES = 10;
export const JOIN_LEAD_MINUTES = 10;

/** One teacher: Monday and Tuesday only. */
export const LIVE_CLASS_WEEKDAYS = [1, 2] as const;
export const LIVE_CLASS_WEEKDAY_LABEL = "Monday One-on-One · Tuesday Group";

export const ONE_ON_ONE_LABEL = "One-on-One";
export const ONE_ON_ONE_LIVE_CLASS_LABEL = "One-on-One Live Class";
export const GROUP_LIVE_CLASS_LABEL = "Group Live Class";
export const ONE_ON_ONE_DAY_BADGE = "One-on-One Live Class";
export const ONE_ON_ONE_FREE_DAY_BADGE = "One-on-One · Free Live Class";
export const ORIENTATION_DAY_BADGE = "1 Orientation + 1 One-on-One";
export const GROUP_DAY_BADGE = "Group Live Class";

export function oneOnOneDayBadge(input: {
  remainingIncluded: number;
  usesIncluded: boolean;
  needsOrientation?: boolean;
}): string {
  if (input.needsOrientation) return ORIENTATION_DAY_BADGE;
  if (input.usesIncluded && input.remainingIncluded > 0) return ONE_ON_ONE_FREE_DAY_BADGE;
  return ONE_ON_ONE_DAY_BADGE;
}

export function liveClassKindLabel(sessionType: string): string {
  const kind = String(sessionType ?? "").trim().toLowerCase();
  if (kind === "one_to_one") return ONE_ON_ONE_LABEL;
  if (kind === "topic_group") return GROUP_LIVE_CLASS_LABEL;
  if (kind === "orientation") return "Orientation";
  return "Live class";
}

export type DailyLiveSlot = {
  sessionType: "topic_group" | "one_to_one";
  startMinutes: number;
};

/** Shared evening pool: same two times every class day. Price is per student, not per slot. */
export const SLOT_A_START_MINUTES = 18 * 60; // 6:00–6:55
export const SLOT_B_START_MINUTES = 19 * 60 + 5; // 7:05–8:00
export const DAILY_LIVE_SLOT_STARTS = [SLOT_A_START_MINUTES, SLOT_B_START_MINUTES] as const;
export const LIVE_SLOT_COLUMN_LABELS = ["6:00 – 6:55 PM", "7:05 – 8:00 PM"] as const;

export const TIER_TOPIC_CLASS_COUNTS = {
  foundation: 2,
  plus: 3,
  elite: 4,
} as const;

export type LiveClassTier = keyof typeof TIER_TOPIC_CLASS_COUNTS;

export const ORIENTATION_INCLUDED_COUNT = 1;

export type LiveSessionType = "orientation" | "topic_group" | "one_to_one";
export type LiveBilling = "included" | "payg" | "credit";
export type LiveClassProductType = "live_group" | "live_1to1";
export type LivePolicy = "test_prep" | "language_development";

export const LIVE_CLASS_PRODUCT_TYPES: readonly LiveClassProductType[] = [
  "live_group",
  "live_1to1",
];

/** Fixed marketplace prices (anchors to test, not verified market rates). */
export const LIVE_CLASS_FIXED_PRICES = {
  groupSar: 100,
  oneToOneSar: 200,
  groupHalalas: 10_000,
  oneToOneHalalas: 20_000,
  groupLabel: "100 SAR / group session",
  oneToOneLabel: "200 SAR / 55 min One-on-One",
} as const;

export type LiveCourseKind =
  | "exam_tiered"
  | "exam_single_tier"
  | "pathway_level"
  | "specialty_course"
  | "account";

export type LiveCoursePackage = {
  courseKey: string;
  kind: LiveCourseKind;
  policy: LivePolicy;
  label: string;
  tier: LiveClassTier | null;
  topicIncluded: number;
};

export function isLiveClassTier(value: unknown): value is LiveClassTier {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "foundation" || v === "plus" || v === "elite";
}

export function topicClassesForTier(tier: LiveClassTier): number {
  return TIER_TOPIC_CLASS_COUNTS[tier];
}

export function policyForKind(kind: LiveCourseKind): LivePolicy {
  if (kind === "pathway_level" || kind === "specialty_course") return "language_development";
  if (kind === "exam_tiered" || kind === "exam_single_tier") return "test_prep";
  return "language_development";
}

export function topicClassesForPackage(kind: LiveCourseKind, tier: LiveClassTier | null): number {
  if (kind === "account") return 0;
  if (kind === "pathway_level" || kind === "specialty_course") return 0;
  if (kind === "exam_tiered" && tier) return topicClassesForTier(tier);
  if (kind === "exam_single_tier") return TIER_TOPIC_CLASS_COUNTS.foundation;
  return 0;
}

export function parseLiveClassTier(value: unknown): LiveClassTier | null {
  const v = String(value ?? "").trim().toLowerCase();
  return isLiveClassTier(v) ? v : null;
}

export function examCourseKey(programme: string, tier: LiveClassTier): string {
  return `${programme}:${tier}`;
}

export function pathwayCourseKey(levelSlug: string): string {
  const level = String(levelSlug ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, ".");
  return `pathway:${level || "current"}`;
}

export function specialtyCourseKey(
  programId: "business_english" | "legal_english" | "kids_english"
): string {
  return programId;
}

export function orientationCourseKey(): string {
  return "account";
}

export function productTypeForSession(
  sessionType: "topic_group" | "one_to_one"
): LiveClassProductType {
  return sessionType === "topic_group" ? "live_group" : "live_1to1";
}

export function isLiveClassProductType(value: unknown): value is LiveClassProductType {
  return LIVE_CLASS_PRODUCT_TYPES.includes(String(value ?? "") as LiveClassProductType);
}

export function checkoutHalalasForPayg(input: {
  sessionType: "topic_group" | "one_to_one";
  durationMinutes?: number;
}): number {
  if (input.sessionType === "topic_group") return LIVE_CLASS_FIXED_PRICES.groupHalalas;
  return LIVE_CLASS_FIXED_PRICES.oneToOneHalalas;
}

export function paygPriceLabel(input: {
  sessionType: "topic_group" | "one_to_one";
  durationMinutes?: number;
}): string {
  if (input.sessionType === "topic_group") return LIVE_CLASS_FIXED_PRICES.groupLabel;
  return LIVE_CLASS_FIXED_PRICES.oneToOneLabel;
}

export function minBookableStartsAt(now = new Date()): Date {
  return new Date(now.getTime());
}

export function addRiyadhDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const noon = new Date(`${year}-${padClock(month)}-${padClock(day)}T12:00:00+03:00`);
  const shifted = new Date(noon.getTime() + days * 24 * 60 * 60 * 1000);
  return riyadhParts(shifted)?.ymd ?? ymd;
}

export function studentWindowYmds(
  registeredAt?: Date | string | null,
  now = new Date(),
  courseWeeks = DEFAULT_COURSE_WEEKS
): {
  startYmd: string;
  endYmd: string;
} | null {
  const today = riyadhParts(now);
  if (!today) return null;
  const weeks = Math.min(MAX_COURSE_WEEKS, Math.max(1, Math.round(courseWeeks) || DEFAULT_COURSE_WEEKS));
  const registered = registeredAt ? riyadhParts(registeredAt) : null;
  const courseStart = registered?.ymd ?? today.ymd;
  let endYmd = addRiyadhDays(courseStart, weeks * 7 - 1);
  const startYmd = today.ymd > courseStart ? today.ymd : courseStart;
  if (startYmd > endYmd) {
    // Account created_at can predate this course clock; keep offering the current length from today.
    return { startYmd: today.ymd, endYmd: addRiyadhDays(today.ymd, weeks * 7 - 1) };
  }
  return { startYmd, endYmd };
}

export function startsAtMeetsNotice(
  startsAt: Date | string,
  now = new Date(),
  _sessionType: LiveSessionType = "topic_group"
): boolean {
  const start = startsAt instanceof Date ? startsAt : new Date(startsAt);
  if (!Number.isFinite(start.getTime())) return false;
  return start.getTime() >= now.getTime();
}

export function startsAtInStudentWindow(
  startsAt: Date | string,
  registeredAt: Date | string,
  now = new Date(),
  courseWeeks = DEFAULT_COURSE_WEEKS
): boolean {
  const window = studentWindowYmds(registeredAt, now, courseWeeks);
  const parts = riyadhParts(startsAt);
  if (!window || !parts) return false;
  return parts.ymd >= window.startYmd && parts.ymd <= window.endYmd;
}

export function courseWeeksForStudent(input: {
  acceleratorTrack?: string | null;
  checkoutTrack?: string | null;
  programType?: string | null;
  programSelected?: string | null;
}): number {
  const track = String(input.acceleratorTrack ?? input.checkoutTrack ?? "")
    .trim()
    .toLowerCase();
  if (track === "elite") return 4;
  if (track === "plus" || track === "foundation") return 6;
  const program = String(input.programType ?? input.programSelected ?? "")
    .trim()
    .toLowerCase();
  if (program.includes("step")) return 8;
  if (program.includes("pathway")) return 4;
  return DEFAULT_COURSE_WEEKS;
}

export function sundayOfWeek(ymd: string): string {
  return addRiyadhDays(ymd, -weekdayIndexForYmd(ymd));
}

export function weekHeadingForSunday(sundayYmd: string, now = new Date()): string {
  const today = riyadhParts(now);
  if (!today) return sundayYmd;
  const thisSunday = sundayOfWeek(today.ymd);
  if (sundayYmd === thisSunday) return "This week";
  if (sundayYmd === addRiyadhDays(thisSunday, 7)) return "Next week";
  const [year, month, day] = sundayYmd.split("-").map(Number);
  const date = new Date(`${year}-${padClock(month)}-${padClock(day)}T12:00:00+03:00`);
  return `Week of ${date.toLocaleDateString("en-GB", {
    timeZone: LIVE_CLASS_TIMEZONE,
    day: "numeric",
    month: "short",
  })}`;
}

export function suggestedSlotCount(remainingIncluded: number): number {
  if (remainingIncluded > 0) return Math.max(2, Math.min(3, remainingIncluded));
  return 3;
}

export type WeekSectionId = "this_week" | "next_week" | "following_week";

function weekdayIndexForYmd(ymd: string): number {
  const [year, month, day] = ymd.split("-").map(Number);
  const noon = new Date(`${year}-${padClock(month)}-${padClock(day)}T12:00:00+03:00`);
  return noon.getUTCDay();
}

export function weekSectionForSlot(
  startsAt: Date | string,
  now = new Date()
): WeekSectionId | null {
  const today = riyadhParts(now);
  const slot = riyadhParts(startsAt);
  if (!today || !slot || slot.ymd < today.ymd) return null;
  const thisSunday = addRiyadhDays(today.ymd, -weekdayIndexForYmd(today.ymd));
  const nextSunday = addRiyadhDays(thisSunday, 7);
  const followingSunday = addRiyadhDays(thisSunday, 14);
  if (slot.ymd < nextSunday) return "this_week";
  if (slot.ymd < followingSunday) return "next_week";
  return "following_week";
}

export const WEEK_SECTION_LABELS: Record<WeekSectionId, string> = {
  this_week: "This week",
  next_week: "Next week",
  following_week: "Following week",
};

export const STUDENT_VISIBLE_WEEKS: WeekSectionId[] = ["this_week", "next_week"];

export function isStudentVisibleWeek(startsAt: Date | string, now = new Date()): boolean {
  const week = weekSectionForSlot(startsAt, now);
  return week === "this_week" || week === "next_week";
}

export function remainingIncluded(included: number, used: number): number {
  return Math.max(0, included - used);
}

export function shouldOfferPayg(included: number, used: number): boolean {
  return remainingIncluded(included, used) <= 0;
}

export function liveClassCheckoutDescription(input: {
  sessionType: "topic_group" | "one_to_one";
  durationMinutes?: number;
}): string {
  if (input.sessionType === "topic_group") {
    return "Speakify live group class (4–6 students)";
  }
  return "Speakify One-on-One tutoring (55 min)";
}

export function liveClassOfferForCourseSlug(slug: string): {
  policy: LivePolicy;
  topicIncluded: number;
  scope: string;
  groupClasses: boolean;
} {
  const s = String(slug ?? "").trim().toLowerCase();
  if (s.includes("step")) {
    return {
      policy: "test_prep",
      topicIncluded: TIER_TOPIC_CLASS_COUNTS.foundation,
      scope: "this course package",
      groupClasses: false,
    };
  }
  if (s.includes("pathway") || s.includes("business") || s.includes("legal") || s.includes("kids")) {
    return {
      policy: "language_development",
      topicIncluded: 0,
      scope: "marketplace (pay per session)",
      groupClasses: true,
    };
  }
  if (s.includes("elite")) {
    return {
      policy: "test_prep",
      topicIncluded: TIER_TOPIC_CLASS_COUNTS.elite,
      scope: "this course package",
      groupClasses: true,
    };
  }
  if (s.includes("plus")) {
    return {
      policy: "test_prep",
      topicIncluded: TIER_TOPIC_CLASS_COUNTS.plus,
      scope: "this course package",
      groupClasses: true,
    };
  }
  return {
    policy: "test_prep",
    topicIncluded: TIER_TOPIC_CLASS_COUNTS.foundation,
    scope: "this course package",
    groupClasses: true,
  };
}

export function seatsNeededToConfirm(enrolled: number): number {
  return Math.max(0, GROUP_CLASS_MIN_STUDENTS - enrolled);
}

export function groupReachedMinimum(enrolled: number): boolean {
  return enrolled >= GROUP_CLASS_MIN_STUDENTS;
}

export function groupIsFull(enrolled: number): boolean {
  return enrolled >= GROUP_CLASS_MAX_STUDENTS;
}

export function fillCutoffAt(startsAt: Date | string): Date {
  const start = startsAt instanceof Date ? startsAt : new Date(startsAt);
  return new Date(start.getTime() - GROUP_FILL_CUTOFF_HOURS * 60 * 60 * 1000);
}

export function shouldAutoCancelUnderfilled(input: {
  enrolled: number;
  startsAt: Date | string;
  now?: Date;
  alreadyCancelled?: boolean;
}): boolean {
  if (input.alreadyCancelled) return false;
  if (groupReachedMinimum(input.enrolled)) return false;
  const now = input.now ?? new Date();
  return now.getTime() >= fillCutoffAt(input.startsAt).getTime();
}

export function shouldMarkSessionComplete(input: {
  startsAt: Date | string;
  durationMinutes: number;
  now?: Date;
}): boolean {
  const start = input.startsAt instanceof Date ? input.startsAt : new Date(input.startsAt);
  const end = new Date(start.getTime() + input.durationMinutes * 60 * 1000);
  return (input.now ?? new Date()).getTime() >= end.getTime();
}

const COUNTED_ENROLLMENT_STATUSES = new Set([
  "reserved",
  "confirmed",
  "completed",
]);

export function countsTowardGroupFill(status: string): boolean {
  return COUNTED_ENROLLMENT_STATUSES.has(String(status ?? "").trim().toLowerCase());
}

function padClock(n: number): string {
  return String(n).padStart(2, "0");
}

/** Orientation sessions occupy a Monday One-on-One calendar seat. */
export function marketplaceCalendarType(
  sessionType: string
): "topic_group" | "one_to_one" {
  return String(sessionType ?? "").trim().toLowerCase() === "topic_group"
    ? "topic_group"
    : "one_to_one";
}

export function marketplaceSlotKey(startsAt: Date | string, sessionType: string): string {
  const calendar = marketplaceCalendarType(sessionType);
  const parts = riyadhParts(startsAt);
  if (!parts) return `${new Date(startsAt).getTime()}|${calendar}`;
  return `${parts.ymd}|${parts.minutesOfDay}|${calendar}`;
}

export function orientationBookedOnSameRiyadhDayElsewhere(input: {
  slotStartsAt: Date | string;
  bookings?: Array<{ startsAt: string; sessionType: string; status?: string }>;
}): boolean {
  const slot = riyadhParts(input.slotStartsAt);
  if (!slot) return false;
  return (input.bookings ?? []).some((booking) => {
    if (String(booking.sessionType ?? "").toLowerCase() !== "orientation") return false;
    const status = String(booking.status ?? "").toLowerCase();
    if (status === "cancelled" || status === "pending_schedule") return false;
    const other = riyadhParts(booking.startsAt);
    if (!other || other.ymd !== slot.ymd) return false;
    return other.minutesOfDay !== slot.minutesOfDay;
  });
}

/** A leftover Monday time is not taken just because orientation used the sibling slot. */
export function oneToOneSeatIsTaken(input: {
  enrolled: number;
  capacity?: number;
  slotSessionId?: string | null;
  siblingSessionIds?: Array<string | null | undefined>;
  bookedHere?: boolean;
}): boolean {
  const capacity = input.capacity ?? 1;
  const enrolled = Math.max(0, Math.min(capacity, Number(input.enrolled) || 0));
  const sessionId = String(input.slotSessionId ?? "").trim();
  if (!sessionId) return false;
  const sharedDuplicate = (input.siblingSessionIds ?? []).some(
    (id) => String(id ?? "").trim() === sessionId
  );
  if (sharedDuplicate) return Boolean(input.bookedHere);
  return enrolled >= capacity;
}

export function riyadhParts(date: Date | string): {
  ymd: string;
  minutesOfDay: number;
} | null {
  const d = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LIVE_CLASS_TIMEZONE,
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
    ymd: `${year}-${padClock(month)}-${padClock(day)}`,
    minutesOfDay: hour * 60 + minute,
  };
}

export function sessionFitsLiveWindow(
  startsAt: Date | string,
  durationMinutes = DEFAULT_SESSION_MINUTES
): boolean {
  const start = startsAt instanceof Date ? startsAt : new Date(startsAt);
  if (!Number.isFinite(start.getTime())) return false;
  const begin = riyadhParts(start);
  const end = riyadhParts(new Date(start.getTime() + durationMinutes * 60 * 1000));
  if (!begin || !end) return false;
  if (begin.minutesOfDay < SLOT_EARLIEST_START_MINUTES) return false;
  if (begin.minutesOfDay > SLOT_LATEST_START_MINUTES) return false;
  if (end.ymd !== begin.ymd) return false;
  return true;
}

export function riyadhWeekday(startsAt: Date | string): number | null {
  const parts = riyadhParts(startsAt);
  if (!parts) return null;
  const [year, month, day] = parts.ymd.split("-").map(Number);
  const noon = new Date(`${year}-${padClock(month)}-${padClock(day)}T12:00:00+03:00`);
  if (!Number.isFinite(noon.getTime())) return null;
  return noon.getUTCDay();
}

export function isLiveClassWeekday(startsAt: Date | string): boolean {
  const weekday = riyadhWeekday(startsAt);
  if (weekday === null) return false;
  return (LIVE_CLASS_WEEKDAYS as readonly number[]).includes(weekday);
}

/** Monday is only One-on-One. Tuesday is only Group. Both times are the same type that day. */
export function sessionTypeForWeekdayAndStart(
  weekday: number,
  startMinutes: number
): "topic_group" | "one_to_one" | null {
  const slotIndex = (DAILY_LIVE_SLOT_STARTS as readonly number[]).indexOf(startMinutes);
  if (slotIndex < 0) return null;
  if (weekday === 1) return "one_to_one";
  if (weekday === 2) return "topic_group";
  return null;
}

export function dailyLiveSlotsForWeekday(weekday: number): DailyLiveSlot[] {
  return DAILY_LIVE_SLOT_STARTS.flatMap((startMinutes) => {
    const sessionType = sessionTypeForWeekdayAndStart(weekday, startMinutes);
    return sessionType ? [{ sessionType, startMinutes }] : [];
  });
}

export function dailyLiveSlotsForDate(startsAt: Date | string): DailyLiveSlot[] {
  const weekday = riyadhWeekday(startsAt);
  if (weekday === null) return [];
  return dailyLiveSlotsForWeekday(weekday);
}

export function matchDailySlot(
  startsAt: Date | string,
  sessionType: "topic_group" | "one_to_one"
): DailyLiveSlot | null {
  const parts = riyadhParts(startsAt);
  const weekday = riyadhWeekday(startsAt);
  if (!parts || weekday === null) return null;
  const expected = sessionTypeForWeekdayAndStart(weekday, parts.minutesOfDay);
  if (expected !== sessionType) return null;
  return { sessionType, startMinutes: parts.minutesOfDay };
}

export function isOfferedLiveSlot(
  startsAt: Date | string,
  sessionType: "topic_group" | "one_to_one"
): boolean {
  if (!isLiveClassWeekday(startsAt)) return false;
  return matchDailySlot(startsAt, sessionType) !== null;
}

export function billingCopy(input: {
  remainingIncluded: number;
  sessionType: "topic_group" | "one_to_one";
  usesIncluded: boolean;
}): { billingKind: "included" | "paid"; billingLabel: string } {
  if (input.sessionType === "topic_group") {
    return {
      billingKind: "paid",
      billingLabel: `Paid — ${LIVE_CLASS_FIXED_PRICES.groupLabel}`,
    };
  }
  if (input.usesIncluded && input.remainingIncluded > 0) {
    const left = input.remainingIncluded;
    return {
      billingKind: "included",
      billingLabel: `Free live class — uses 1 of ${left} remaining One-on-One ${left === 1 ? "class" : "classes"}`,
    };
  }
  return {
    billingKind: "paid",
    billingLabel: `Paid — ${LIVE_CLASS_FIXED_PRICES.oneToOneLabel}`,
  };
}

export function groupLockedUntilIncludedOneToOneUsed(
  remainingIncluded: number,
  usesIncluded: boolean
): boolean {
  return Boolean(usesIncluded && remainingIncluded > 0);
}

export function groupUnlockLockLabel(remainingIncluded: number): string {
  const price = " · 100 SAR";
  if (remainingIncluded <= 0) return `Book — 100 SAR`;
  if (remainingIncluded === 1) {
    return `Just 1 more One-on-One to unlock Group practice!${price}`;
  }
  if (remainingIncluded === 2) {
    return `2 more One-on-Ones and Group practice unlocks!${price}`;
  }
  return `Unlocks after your free One-on-Ones${price}`;
}

export function groupJoinProof(enrolled: number): string {
  const n = Math.max(0, Math.floor(Number(enrolled) || 0));
  if (n <= 0) return "Be the first to join";
  if (n >= GROUP_CLASS_MAX_STUDENTS) return "Full";
  const who = n === 1 ? "1 student has joined" : `${n} students have joined`;
  if (n <= 3) return `${who} — plenty of room left`;
  return `${who} — almost full!`;
}

export type SlotCtaKind = "included" | "paid" | "locked" | "full" | "taken";

export const FREE_LIVE_CLASS_CTA = "Free live class";
export const INCLUDED_FREE_LIVE_CLASS_LABEL = "Your free live class";
export const ORIENTATION_CTA = "Book orientation";
export const ORIENTATION_BOOKED_LABEL = "Your orientation";
export const PAID_ONE_ON_ONE_CTA = "Book One-on-One — 200 SAR";
export const PAID_ONE_ON_ONE_ANOTHER_CTA = "Book Another One-on-One — 200 SAR";
export const PAID_GROUP_CTA = "Book — 100 SAR";

export function paidOneOnOneCta(packageIncluded = 0): string {
  return Number(packageIncluded) > 0 ? PAID_ONE_ON_ONE_ANOTHER_CTA : PAID_ONE_ON_ONE_CTA;
}

export function slotCta(input: {
  sessionType: "topic_group" | "one_to_one";
  remainingIncluded: number;
  usesIncluded: boolean;
  full: boolean;
  bookedByStudent?: boolean;
  bookedBilling?: string;
  bookedSessionType?: string;
  needsOrientation?: boolean;
  orientationBookedElsewhere?: boolean;
  packageIncluded?: number;
}): { kind: SlotCtaKind; label: string; disabled: boolean } {
  if (input.sessionType === "one_to_one") {
    const bookedKind = String(input.bookedSessionType ?? "").toLowerCase();
    if (input.bookedByStudent && bookedKind === "orientation") {
      return { kind: "included", label: ORIENTATION_BOOKED_LABEL, disabled: true };
    }
    const offerOrientation =
      Boolean(input.needsOrientation) && !input.orientationBookedElsewhere;
    if (offerOrientation) {
      if (input.full) {
        if (input.bookedByStudent) {
          return { kind: "included", label: ORIENTATION_BOOKED_LABEL, disabled: true };
        }
        return { kind: "taken", label: "Unavailable", disabled: true };
      }
      return { kind: "included", label: ORIENTATION_CTA, disabled: false };
    }
    if (input.full) {
      const billing = String(input.bookedBilling ?? "").toLowerCase();
      if (input.bookedByStudent && (billing === "included" || billing === "credit" || !billing)) {
        return { kind: "included", label: INCLUDED_FREE_LIVE_CLASS_LABEL, disabled: true };
      }
      if (input.bookedByStudent) {
        return { kind: "taken", label: "You're booked", disabled: true };
      }
      return { kind: "taken", label: "Unavailable", disabled: true };
    }
    if (input.usesIncluded && input.remainingIncluded > 0) {
      return { kind: "included", label: FREE_LIVE_CLASS_CTA, disabled: false };
    }
    return { kind: "paid", label: paidOneOnOneCta(input.packageIncluded), disabled: false };
  }
  if (input.full) return { kind: "full", label: "Full", disabled: true };
  if (groupLockedUntilIncludedOneToOneUsed(input.remainingIncluded, input.usesIncluded)) {
    return {
      kind: "locked",
      label: groupUnlockLockLabel(input.remainingIncluded),
      disabled: true,
    };
  }
  return { kind: "paid", label: PAID_GROUP_CTA, disabled: false };
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const totalMinutes = Math.ceil(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours ? `${days}d ${remHours}h` : `${days}d`;
}

export type StudentBookingAction = {
  kind: "pay" | "wait_orientation" | "countdown" | "join" | "replay" | "done" | "cancelled";
  headline: string;
  detail: string;
  ctaLabel: string | null;
};

export function studentBookingAction(input: {
  status: string;
  sessionType: string;
  startsAt: Date | string;
  durationMinutes?: number;
  recordingUrl?: string | null;
  now?: Date;
}): StudentBookingAction {
  const status = String(input.status ?? "").trim().toLowerCase();
  const now = input.now ?? new Date();
  const start = input.startsAt instanceof Date ? input.startsAt : new Date(input.startsAt);
  const duration = input.durationMinutes ?? DEFAULT_SESSION_MINUTES;
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const joinAt = new Date(start.getTime() - JOIN_LEAD_MINUTES * 60 * 1000);

  if (status === "cancelled") {
    return { kind: "cancelled", headline: "Cancelled", detail: "This session is no longer on your calendar.", ctaLabel: null };
  }
  if (status === "pending_payment") {
    return {
      kind: "pay",
      headline: "Payment needed",
      detail: "Pay to confirm this booking.",
      ctaLabel: "Pay now",
    };
  }
  if (status === "pending_schedule") {
    return {
      kind: "wait_orientation",
      headline: "Pick a time",
      detail: "Choose an orientation slot on the calendar. Nothing is booked until you tap a time.",
      ctaLabel: null,
    };
  }
  if (input.recordingUrl && (status === "completed" || now.getTime() >= end.getTime())) {
    return { kind: "replay", headline: "Session finished", detail: "Watch the replay when you’re ready.", ctaLabel: "Watch replay" };
  }
  if (status === "completed" || now.getTime() >= end.getTime()) {
    return { kind: "done", headline: "Session finished", detail: "Replay will appear here when it’s ready.", ctaLabel: null };
  }
  if (now.getTime() >= joinAt.getTime()) {
    return {
      kind: "join",
      headline: "Ready to join",
      detail: "Your class is open.",
      ctaLabel: "Join class",
    };
  }
  if (status === "confirmed" || status === "reserved") {
    return {
      kind: "countdown",
      headline: "You’re booked",
      detail: `Join link available 10 min before start · ${formatCountdown(joinAt.getTime() - now.getTime())} left`,
      ctaLabel: null,
    };
  }
  return {
    kind: "countdown",
    headline: String(input.status).replaceAll("_", " "),
    detail: "We’ll update this row when there’s a next step.",
    ctaLabel: null,
  };
}

export type GroupSlotDisplay = {
  sessionType: "topic_group" | "one_to_one";
  typeLabel: string;
  timeRangeLabel: string;
  enrolled: number;
  capacity: number;
  seatsRemaining: number;
  seatsLabel: string;
  registeredLabel: string;
  confirmLabel: string;
  billingKind: "included" | "paid";
  billingLabel: string;
  confirmedToRun: boolean;
  full: boolean;
  status: "open" | "confirmed" | "full";
};

export function describeLiveSlot(input: {
  enrolled: number;
  startsAt: Date | string;
  sessionType: "topic_group" | "one_to_one";
  durationMinutes?: number;
  capacity?: number;
  remainingIncluded?: number;
  usesIncluded?: boolean;
}): GroupSlotDisplay {
  const sessionType = input.sessionType;
  const billing = billingCopy({
    remainingIncluded: input.remainingIncluded ?? 0,
    sessionType,
    usesIncluded: Boolean(input.usesIncluded),
  });
  if (sessionType === "one_to_one") {
    const capacity = input.capacity ?? 1;
    const enrolled = Math.max(0, Math.min(capacity, input.enrolled));
    const full = enrolled >= capacity;
    return {
      sessionType,
      typeLabel: ONE_ON_ONE_LABEL,
      timeRangeLabel: formatSlotTimeRange(input.startsAt, input.durationMinutes ?? DEFAULT_SESSION_MINUTES),
      enrolled,
      capacity,
      seatsRemaining: Math.max(0, capacity - enrolled),
      seatsLabel: full ? "Booked" : "",
      registeredLabel: "",
      confirmLabel: full ? "This time is taken" : "",
      ...billing,
      confirmedToRun: !full,
      full,
      status: full ? "full" : "open",
    };
  }
  const capacity = input.capacity ?? GROUP_CLASS_MAX_STUDENTS;
  const enrolled = Math.max(0, Math.min(capacity, input.enrolled));
  const seatsRemaining = Math.max(0, capacity - enrolled);
  const needed = seatsNeededToConfirm(enrolled);
  const confirmedToRun = groupReachedMinimum(enrolled);
  const full = enrolled >= capacity;
  return {
    sessionType,
    typeLabel: GROUP_LIVE_CLASS_LABEL,
    timeRangeLabel: formatSlotTimeRange(input.startsAt, input.durationMinutes ?? DEFAULT_SESSION_MINUTES),
    enrolled,
    capacity,
    seatsRemaining,
    seatsLabel: `Seats remaining: ${seatsRemaining} of ${capacity}`,
    registeredLabel: `${enrolled} registered`,
    confirmLabel: confirmedToRun ? "Confirmed to run" : `${needed} more needed to confirm`,
    ...billing,
    confirmedToRun,
    full,
    status: full ? "full" : confirmedToRun ? "confirmed" : "open",
  };
}

export function describeGroupSlot(input: {
  enrolled: number;
  startsAt: Date | string;
  durationMinutes?: number;
  capacity?: number;
}): GroupSlotDisplay {
  return describeLiveSlot({
    ...input,
    sessionType: "topic_group",
    usesIncluded: false,
    remainingIncluded: 0,
  });
}

export function formatSlotStartLabel(startsAt: Date | string): string {
  const begin = riyadhParts(startsAt);
  if (!begin) return "";
  return formatHourMinute12(begin.minutesOfDay);
}

function formatHourMinute12(minutesOfDay: number): string {
  const wrapped = ((minutesOfDay % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = ((hour24 + 11) % 12) + 1;
  return `${hour12}:${padClock(minute)} ${suffix}`;
}

export function formatSlotTimeRange(
  startsAt: Date | string,
  durationMinutes = DEFAULT_SESSION_MINUTES
): string {
  const begin = riyadhParts(startsAt);
  if (!begin) return "";
  const endMinutes = begin.minutesOfDay + durationMinutes;
  return `${formatHourMinute12(begin.minutesOfDay)} – ${formatHourMinute12(endMinutes)}`;
}

