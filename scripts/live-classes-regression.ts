/**
 * Live-class policies + marketplace rules.
 * Run: npm run test:live-classes
 */

import assert from "node:assert/strict";
import {
  DAILY_LIVE_SLOT_STARTS,
  DEFAULT_SESSION_MINUTES,
  GROUP_FILL_CUTOFF_HOURS,
  addRiyadhDays,
  FREE_LIVE_CLASS_CTA,
  INCLUDED_FREE_LIVE_CLASS_LABEL,
  PAID_GROUP_CTA,
  PAID_ONE_ON_ONE_ANOTHER_CTA,
  PAID_ONE_ON_ONE_CTA,
  paidOneOnOneCta,
  billingCopy,
  checkoutHalalasForPayg,
  courseWeeksForStudent,
  dailyLiveSlotsForDate,
  describeLiveSlot,
  formatSlotTimeRange,
  groupJoinProof,
  groupLockedUntilIncludedOneToOneUsed,
  groupReachedMinimum,
  groupUnlockLockLabel,
  isLiveClassWeekday,
  isOfferedLiveSlot,
  isStudentVisibleWeek,
  liveClassOfferForCourseSlug,
  oneOnOneDayBadge,
  remainingIncluded,
  studentBookingAction,
  seatsNeededToConfirm,
  sessionFitsLiveWindow,
  sessionTypeForWeekdayAndStart,
  slotCta,
  marketplaceCalendarType,
  marketplaceSlotKey,
  oneToOneSeatIsTaken,
  orientationBookedOnSameRiyadhDayElsewhere,
  shouldAutoCancelUnderfilled,
  shouldMarkSessionComplete,
  startsAtInStudentWindow,
  studentWindowYmds,
  topicClassesForPackage,
  topicClassesForTier,
} from "../lib/live-classes/model.ts";
import {
  prioritySkillLabelFromDashboard,
  skillDashboardUrlForLiveClasses,
} from "../lib/live-classes/priority.ts";
import {
  buildLiveClassIcs,
  liveClassCalendarDescription,
  liveClassIcsFilename,
} from "../lib/live-classes/calendarInvite.ts";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SPEAKIFY_COLOR, SPEAKIFY_FONT } from "../lib/brand/tokens.ts";

let failures = 0;

function check(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS  ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL  ${label}`);
    console.error(err);
  }
}

console.log("Live-class model");

check("tier counts are 2 / 3 / 4", () => {
  assert.equal(topicClassesForTier("foundation"), 2);
  assert.equal(topicClassesForTier("plus"), 3);
  assert.equal(topicClassesForTier("elite"), 4);
});

check("language development has no included topic classes", () => {
  assert.equal(topicClassesForPackage("pathway_level", null), 0);
  assert.equal(topicClassesForPackage("specialty_course", null), 0);
  assert.equal(liveClassOfferForCourseSlug("english-pathway").topicIncluded, 0);
  assert.equal(liveClassOfferForCourseSlug("business-english").policy, "language_development");
  assert.equal(liveClassOfferForCourseSlug("ielts-plus").topicIncluded, 3);
});

check("fixed marketplace prices", () => {
  assert.equal(checkoutHalalasForPayg({ sessionType: "topic_group" }), 10_000);
  assert.equal(checkoutHalalasForPayg({ sessionType: "one_to_one" }), 20_000);
});

check("group fill labels", () => {
  assert.equal(seatsNeededToConfirm(2), 2);
  assert.equal(groupReachedMinimum(3), false);
  assert.equal(groupReachedMinimum(4), true);
});

check("24h underfill cancel", () => {
  assert.equal(GROUP_FILL_CUTOFF_HOURS, 24);
  const starts = new Date("2026-09-20T18:00:00+03:00");
  const now = new Date("2026-09-19T18:00:00+03:00");
  assert.equal(shouldAutoCancelUnderfilled({ enrolled: 2, startsAt: starts, now }), true);
  assert.equal(shouldAutoCancelUnderfilled({ enrolled: 4, startsAt: starts, now }), false);
  assert.equal(
    shouldAutoCancelUnderfilled({
      enrolled: 2,
      startsAt: starts,
      now: new Date("2026-09-19T17:00:00+03:00"),
    }),
    false
  );
});

check("post-class complete is after the session ends", () => {
  const starts = new Date("2026-09-20T18:00:00+03:00");
  assert.equal(
    shouldMarkSessionComplete({
      startsAt: starts,
      durationMinutes: DEFAULT_SESSION_MINUTES,
      now: new Date("2026-09-20T18:45:00+03:00"),
    }),
    false
  );
  assert.equal(
    shouldMarkSessionComplete({
      startsAt: starts,
      durationMinutes: DEFAULT_SESSION_MINUTES,
      now: new Date("2026-09-20T18:55:00+03:00"),
    }),
    true
  );
});

check("Riyadh window is 6:00 and 7:05 PM only", () => {
  assert.equal(sessionFitsLiveWindow(new Date("2026-09-14T18:00:00+03:00"), 55), true);
  assert.equal(sessionFitsLiveWindow(new Date("2026-09-14T19:05:00+03:00"), 55), true);
  assert.equal(sessionFitsLiveWindow(new Date("2026-09-14T20:10:00+03:00"), 55), false);
  assert.equal(sessionFitsLiveWindow(new Date("2026-09-14T16:30:00+03:00"), 55), false);
  assert.equal(sessionFitsLiveWindow(new Date("2026-09-14T20:40:00+03:00"), 55), false);
});

check("One-on-One day badge only says FREE while included credit remains", () => {
  assert.equal(
    oneOnOneDayBadge({ remainingIncluded: 3, usesIncluded: true }),
    "One-on-One · Free Live Class"
  );
  assert.equal(
    oneOnOneDayBadge({ remainingIncluded: 0, usesIncluded: false }),
    "One-on-One Live Class"
  );
  assert.equal(
    oneOnOneDayBadge({ remainingIncluded: 0, usesIncluded: true }),
    "One-on-One Live Class"
  );
  assert.equal(
    oneOnOneDayBadge({ remainingIncluded: 3, usesIncluded: true, needsOrientation: true }),
    "1 Orientation + 1 One-on-One"
  );
});

check("Monday is only One-on-One and Tuesday is only Group", () => {
  assert.equal(DAILY_LIVE_SLOT_STARTS.length, 2);
  assert.equal(sessionTypeForWeekdayAndStart(1, DAILY_LIVE_SLOT_STARTS[0]), "one_to_one");
  assert.equal(sessionTypeForWeekdayAndStart(1, DAILY_LIVE_SLOT_STARTS[1]), "one_to_one");
  assert.equal(sessionTypeForWeekdayAndStart(2, DAILY_LIVE_SLOT_STARTS[0]), "topic_group");
  assert.equal(sessionTypeForWeekdayAndStart(2, DAILY_LIVE_SLOT_STARTS[1]), "topic_group");
  assert.equal(isOfferedLiveSlot(new Date("2026-09-14T18:00:00+03:00"), "one_to_one"), true);
  assert.equal(isOfferedLiveSlot(new Date("2026-09-14T19:05:00+03:00"), "one_to_one"), true);
  assert.equal(isOfferedLiveSlot(new Date("2026-09-14T18:00:00+03:00"), "topic_group"), false);
  assert.equal(isOfferedLiveSlot(new Date("2026-09-15T18:00:00+03:00"), "topic_group"), true);
  assert.equal(isOfferedLiveSlot(new Date("2026-09-15T19:05:00+03:00"), "one_to_one"), false);
});

check("one-teacher timetable has two evening columns", () => {
  assert.equal(isOfferedLiveSlot(new Date("2026-09-14T16:30:00+03:00"), "one_to_one"), false);
  assert.deepEqual(
    ["2026-09-14T18:00:00+03:00", "2026-09-14T19:05:00+03:00"].map((iso) =>
      formatSlotTimeRange(iso, DEFAULT_SESSION_MINUTES)
    ),
    ["6:00 PM – 6:55 PM", "7:05 PM – 8:00 PM"]
  );
});

check("class days are Monday and Tuesday only", () => {
  assert.equal(isLiveClassWeekday(new Date("2026-09-13T12:00:00+03:00")), false); // Sun
  assert.equal(isLiveClassWeekday(new Date("2026-09-14T12:00:00+03:00")), true); // Mon
  assert.equal(isLiveClassWeekday(new Date("2026-09-15T12:00:00+03:00")), true); // Tue
  assert.equal(isLiveClassWeekday(new Date("2026-09-16T12:00:00+03:00")), false); // Wed
  assert.equal(isLiveClassWeekday(new Date("2026-09-17T12:00:00+03:00")), false); // Thu
  assert.equal(isLiveClassWeekday(new Date("2026-09-18T12:00:00+03:00")), false); // Fri
  assert.equal(isLiveClassWeekday(new Date("2026-09-19T12:00:00+03:00")), false); // Sat
});

check("a Mon–Tue week is 4 shared slots (2 1:1 + 2 group)", () => {
  assert.equal(DAILY_LIVE_SLOT_STARTS.length, 2);
  assert.equal(DAILY_LIVE_SLOT_STARTS.length * 2, 4);
  let oneToOne = 0;
  let group = 0;
  for (const day of [1, 2]) {
    for (const start of DAILY_LIVE_SLOT_STARTS) {
      const type = sessionTypeForWeekdayAndStart(day, start);
      if (type === "one_to_one") oneToOne += 1;
      if (type === "topic_group") group += 1;
    }
  }
  assert.equal(oneToOne, 2);
  assert.equal(group, 2);
});

check("course window lasts until the course end date", () => {
  assert.equal(courseWeeksForStudent({ acceleratorTrack: "elite" }), 4);
  assert.equal(courseWeeksForStudent({ acceleratorTrack: "plus" }), 6);
  const registered = new Date("2026-09-12T10:00:00+03:00");
  const now = new Date("2026-09-12T12:00:00+03:00");
  const window = studentWindowYmds(registered, now, 6);
  assert.equal(window?.startYmd, "2026-09-12");
  assert.equal(window?.endYmd, "2026-10-23");
  assert.equal(startsAtInStudentWindow(new Date("2026-10-20T18:00:00+03:00"), registered, now, 6), true);
  assert.equal(startsAtInStudentWindow(new Date("2026-10-24T18:00:00+03:00"), registered, now, 6), false);
  const later = studentWindowYmds(registered, new Date("2026-09-20T12:00:00+03:00"), 6);
  assert.equal(later?.startYmd, "2026-09-20");
  assert.equal(later?.endYmd, "2026-10-23");
  const oldAccount = studentWindowYmds(
    new Date("2026-01-01T10:00:00+03:00"),
    new Date("2026-09-12T12:00:00+03:00"),
    6
  );
  assert.equal(oldAccount?.startYmd, "2026-09-12");
  assert.equal(oldAccount?.endYmd, "2026-10-23");
});

check("rolling calendar repeats Mon/Tue slots until course end", () => {
  const window = studentWindowYmds(
    new Date("2026-09-12T10:00:00+03:00"),
    new Date("2026-09-12T12:00:00+03:00"),
    6
  );
  assert.ok(window);
  let ymd = window.startYmd;
  let total = 0;
  let oneToOne = 0;
  let group = 0;
  let lastClassYmd = "";
  while (ymd <= window.endYmd) {
    const probe = new Date(`${ymd}T12:00:00+03:00`);
    if (isLiveClassWeekday(probe)) {
      lastClassYmd = ymd;
      for (const spec of dailyLiveSlotsForDate(probe)) {
        total += 1;
        if (spec.sessionType === "one_to_one") oneToOne += 1;
        if (spec.sessionType === "topic_group") group += 1;
      }
    }
    ymd = addRiyadhDays(ymd, 1);
  }
  assert.equal(total, 24);
  assert.equal(oneToOne, 12);
  assert.equal(group, 12);
  assert.equal(lastClassYmd, "2026-10-20");
});

check("student page only shows this week and next week", () => {
  const now = new Date("2026-09-12T12:00:00+03:00");
  assert.equal(isStudentVisibleWeek(new Date("2026-09-14T18:00:00+03:00"), now), true);
  assert.equal(isStudentVisibleWeek(new Date("2026-09-15T18:00:00+03:00"), now), true);
  assert.equal(isStudentVisibleWeek(new Date("2026-09-21T18:00:00+03:00"), now), false);
  assert.equal(isStudentVisibleWeek(new Date("2026-10-05T18:00:00+03:00"), now), false);
});

check("slot copy switches at the minimum of 4 and shows billing on the card", () => {
  const starts = new Date("2026-09-14T19:05:00+03:00");
  const empty = describeLiveSlot({
    enrolled: 0,
    startsAt: starts,
    sessionType: "topic_group",
    remainingIncluded: 3,
    usesIncluded: true,
  });
  assert.equal(empty.timeRangeLabel, "7:05 PM – 8:00 PM");
  assert.equal(empty.seatsLabel, "Seats remaining: 6 of 6");
  assert.equal(empty.confirmLabel, "4 more needed to confirm");
  assert.equal(empty.billingLabel, "Paid — 100 SAR / group session");
  assert.equal(empty.billingKind, "paid");
  const confirmed = describeLiveSlot({
    enrolled: 4,
    startsAt: starts,
    sessionType: "topic_group",
    remainingIncluded: 0,
    usesIncluded: false,
  });
  assert.equal(confirmed.confirmLabel, "Confirmed to run");
  assert.match(confirmed.billingLabel, /Paid/);
  const oneToOne = describeLiveSlot({
    enrolled: 0,
    startsAt: new Date("2026-09-14T18:00:00+03:00"),
    sessionType: "one_to_one",
    remainingIncluded: 1,
    usesIncluded: true,
  });
  assert.equal(oneToOne.typeLabel, "One-on-One");
  assert.equal(oneToOne.timeRangeLabel, "6:00 PM – 6:55 PM");
  assert.equal(billingCopy({ remainingIncluded: 1, sessionType: "one_to_one", usesIncluded: true }).billingKind, "included");
  assert.match(
    billingCopy({ remainingIncluded: 1, sessionType: "one_to_one", usesIncluded: true }).billingLabel,
    /Free live class — uses 1 of 1 remaining One-on-One class$/
  );
  assert.equal(billingCopy({ remainingIncluded: 3, sessionType: "topic_group", usesIncluded: true }).billingKind, "paid");
  assert.equal(groupLockedUntilIncludedOneToOneUsed(3, true), true);
  assert.equal(groupLockedUntilIncludedOneToOneUsed(0, false), false);
  assert.equal(slotCta({ sessionType: "one_to_one", remainingIncluded: 3, usesIncluded: true, full: false }).label, FREE_LIVE_CLASS_CTA);
  assert.equal(FREE_LIVE_CLASS_CTA, "Free live class");
  assert.equal(
    slotCta({
      sessionType: "one_to_one",
      remainingIncluded: 0,
      usesIncluded: false,
      full: true,
      bookedByStudent: true,
      bookedBilling: "included",
    }).label,
    INCLUDED_FREE_LIVE_CLASS_LABEL
  );
  assert.equal(slotCta({ sessionType: "topic_group", remainingIncluded: 3, usesIncluded: true, full: false }).kind, "locked");
  assert.equal(
    slotCta({ sessionType: "topic_group", remainingIncluded: 3, usesIncluded: true, full: false }).label,
    "Unlocks after your free One-on-Ones · 100 SAR"
  );
  assert.equal(
    groupUnlockLockLabel(2),
    "2 more One-on-Ones and Group practice unlocks! · 100 SAR"
  );
  assert.equal(
    groupUnlockLockLabel(1),
    "Just 1 more One-on-One to unlock Group practice! · 100 SAR"
  );
  assert.equal(
    slotCta({ sessionType: "topic_group", remainingIncluded: 2, usesIncluded: true, full: false }).label,
    "2 more One-on-Ones and Group practice unlocks! · 100 SAR"
  );
  assert.equal(
    slotCta({ sessionType: "topic_group", remainingIncluded: 1, usesIncluded: true, full: false }).label,
    "Just 1 more One-on-One to unlock Group practice! · 100 SAR"
  );
  assert.equal(slotCta({ sessionType: "topic_group", remainingIncluded: 0, usesIncluded: false, full: false }).label, PAID_GROUP_CTA);
  assert.equal(PAID_GROUP_CTA, "Book — 100 SAR");
  assert.equal(slotCta({ sessionType: "one_to_one", remainingIncluded: 0, usesIncluded: false, full: false, packageIncluded: 3 }).label, PAID_ONE_ON_ONE_ANOTHER_CTA);
  assert.equal(paidOneOnOneCta(3), "Book Another One-on-One — 200 SAR");
  assert.equal(paidOneOnOneCta(0), PAID_ONE_ON_ONE_CTA);
  assert.equal(PAID_ONE_ON_ONE_CTA, "Book One-on-One — 200 SAR");
  assert.equal(
    slotCta({
      sessionType: "one_to_one",
      remainingIncluded: 3,
      usesIncluded: true,
      full: false,
      needsOrientation: true,
    }).label,
    "Book orientation"
  );
  assert.equal(
    slotCta({
      sessionType: "one_to_one",
      remainingIncluded: 3,
      usesIncluded: true,
      full: false,
      needsOrientation: true,
      orientationBookedElsewhere: true,
    }).label,
    FREE_LIVE_CLASS_CTA
  );
  assert.equal(
    slotCta({
      sessionType: "one_to_one",
      remainingIncluded: 0,
      usesIncluded: false,
      full: false,
      packageIncluded: 3,
      needsOrientation: true,
      orientationBookedElsewhere: true,
    }).label,
    PAID_ONE_ON_ONE_ANOTHER_CTA
  );
  assert.equal(
    slotCta({
      sessionType: "one_to_one",
      remainingIncluded: 3,
      usesIncluded: true,
      full: false,
      bookedByStudent: true,
      bookedSessionType: "orientation",
    }).label,
    "Your orientation"
  );
  assert.equal(
    orientationBookedOnSameRiyadhDayElsewhere({
      slotStartsAt: "2026-09-14T15:00:00.000Z",
      bookings: [
        {
          startsAt: "2026-09-14T16:05:00.000Z",
          sessionType: "orientation",
          status: "confirmed",
        },
      ],
    }),
    true
  );
  assert.equal(
    oneToOneSeatIsTaken({
      enrolled: 1,
      slotSessionId: "sess-7",
      siblingSessionIds: ["sess-7"],
      bookedHere: false,
    }),
    false
  );
  assert.equal(oneToOneSeatIsTaken({ enrolled: 1, slotSessionId: null }), false);
  assert.equal(
    marketplaceCalendarType("orientation"),
    "one_to_one"
  );
  assert.equal(
    marketplaceSlotKey("2026-09-14T15:00:00.000Z", "orientation"),
    marketplaceSlotKey("2026-09-14T15:00:00.000Z", "one_to_one")
  );
  assert.equal(groupJoinProof(0), "Be the first to join");
  assert.equal(groupJoinProof(1), "1 student has joined — plenty of room left");
  assert.equal(groupJoinProof(3), "3 students have joined — plenty of room left");
  assert.equal(groupJoinProof(4), "4 students have joined — almost full!");
  assert.equal(groupJoinProof(6), "Full");
});

check("included remaining still drives test-prep payg", () => {
  assert.equal(remainingIncluded(2, 2), 0);
});

check("pending payment bookings ask the student to pay now", () => {
  const action = studentBookingAction({
    status: "pending_payment",
    sessionType: "one_to_one",
    startsAt: new Date("2026-09-21T18:00:00+03:00"),
    now: new Date("2026-09-12T12:00:00+03:00"),
  });
  assert.equal(action.kind, "pay");
  assert.equal(action.ctaLabel, "Pay now");
  const booked = studentBookingAction({
    status: "confirmed",
    sessionType: "one_to_one",
    startsAt: new Date("2026-09-21T18:00:00+03:00"),
    now: new Date("2026-09-12T12:00:00+03:00"),
  });
  assert.equal(booked.kind, "countdown");
  assert.match(booked.detail, /10 min before start/);
});

check("priority banner only when dashboard has a real band and showAlert", () => {
  assert.equal(
    skillDashboardUrlForLiveClasses("/dashboard/ielts/student/live-classes"),
    "/api/student/ielts-dashboard"
  );
  assert.equal(
    skillDashboardUrlForLiveClasses("/dashboard/ielts-general/student/live-classes"),
    "/api/ielts-general/dashboard"
  );
  assert.equal(skillDashboardUrlForLiveClasses("/dashboard/step/student/live-classes"), null);
  assert.equal(
    prioritySkillLabelFromDashboard({
      weakestSkill: { showAlert: true, band: 5.5, key: "writing" },
    }),
    "Writing"
  );
  assert.equal(
    prioritySkillLabelFromDashboard({
      weakestSkill: { showAlert: true, key: "listening" },
    }),
    null
  );
  assert.equal(
    prioritySkillLabelFromDashboard({
      weakestSkill: { showAlert: true, band: null, key: "listening" },
    }),
    null
  );
  assert.equal(
    prioritySkillLabelFromDashboard({
      weakestSkill: { showAlert: false, band: 5, key: "reading" },
    }),
    null
  );
});

check("calendar invite is a downloadable ics with the join reminder", () => {
  const starts = new Date("2026-09-21T18:00:00+03:00");
  const ics = buildLiveClassIcs({
    id: "booking-123",
    title: "Speakify One-on-One",
    startsAt: starts,
    durationMinutes: 55,
    description: liveClassCalendarDescription({
      sessionType: "one_to_one",
      pageUrl: "https://speakify.example/dashboard/ielts/student/live-classes",
    }),
    url: "https://speakify.example/dashboard/ielts/student/live-classes",
  });
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /DTSTART:20260921T150000Z/);
  assert.match(ics, /DTEND:20260921T155500Z/);
  assert.match(ics, /10 minutes before start/);
  assert.equal(
    liveClassIcsFilename({ sessionType: "one_to_one", startsAt: starts }),
    "speakify-one-to-one-2026-09-21.ics"
  );
});

check("Speakify brand tokens match the live marketing hub stylesheet", () => {
  assert.equal(SPEAKIFY_COLOR.navy900, "#0b1b33");
  assert.equal(SPEAKIFY_COLOR.gold, "#c99a3d");
  assert.equal(SPEAKIFY_COLOR.paper, "#f7f5f0");
  assert.equal(SPEAKIFY_COLOR.goldDeep, "#a97f2e");
  assert.equal(SPEAKIFY_FONT.headline, "Fraunces");
  assert.equal(SPEAKIFY_FONT.body, "Inter");
  const css = readFileSync(join(process.cwd(), "lib/brand/speakify-tokens.css"), "utf8");
  assert.match(css, /--speakify-navy-900:\s*#0b1b33/);
  assert.match(css, /--speakify-gold:\s*#c99a3d/);
  assert.match(css, /--speakify-paper:\s*#f7f5f0/);
  assert.match(css, /Fraunces/);
  assert.match(css, /Inter/);
});

if (failures) {
  console.error(`\n${failures} live-class check(s) failed`);
  process.exit(1);
}

console.log("\nAll live-class checks passed");
