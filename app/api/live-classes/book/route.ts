import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";
import { liveClassCatalogForUser } from "@/lib/live-classes/packages";
import { getAppBaseUrl } from "@/lib/appUrl";
import {
  DEFAULT_SESSION_MINUTES,
  checkoutHalalasForPayg,
  liveClassCheckoutDescription,
  paygPriceLabel,
  productTypeForSession,
  remainingIncluded,
  courseWeeksForStudent,
  orientationCourseKey,
  startsAtInStudentWindow,
  startsAtMeetsNotice,
  ORIENTATION_INCLUDED_COUNT,
} from "@/lib/live-classes/model";
import { offeredSlotViolation } from "@/lib/live-classes/calendar";
import {
  afterGroupEnrollment,
  creditBalanceHalalas,
  findOrOpenGroupSession,
  findOrOpenOneToOneSession,
  spendCredits,
} from "@/lib/live-classes/marketplace";
import {
  confirmPaygBooking,
  countActiveOrientations,
  countUsedIncluded,
  insertLiveClassBooking,
  loadLiveClassSummary,
} from "@/lib/live-classes/store";
import { createLiveClassPayment, isMoyasarMockMode } from "@/lib/payments/moyasar";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    const role = normalizeRole((session?.user as { role?: string })?.role);

    if (!studentId || role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const confirmPaymentId = String(body.confirmPaymentId ?? "").trim();
    const supabase = getSupabase();

    if (confirmPaymentId) {
      if (!isMoyasarMockMode()) {
        return NextResponse.json({ error: "Not available" }, { status: 403 });
      }
      const confirmed = await confirmPaygBooking(supabase, confirmPaymentId);
      if (!confirmed.ok) {
        return NextResponse.json({ error: confirmed.error }, { status: 400 });
      }
      await supabase
        .from("payment_transactions")
        .update({ status: "paid", raw_payload: { mock: true } })
        .eq("moyasar_payment_id", confirmPaymentId);
      return NextResponse.json({ ok: true, confirmed: true });
    }

    const resumeBookingId = String(body.resumeBookingId ?? "").trim();
    if (resumeBookingId) {
      const { data: booking } = await supabase
        .from("live_class_bookings")
        .select(
          "id, student_id, course_key, session_type, starts_at, duration_minutes, billing, status, moyasar_payment_id"
        )
        .eq("id", resumeBookingId)
        .eq("student_id", studentId)
        .maybeSingle();
      if (!booking || booking.status !== "pending_payment") {
        return NextResponse.json({ error: "That booking is not waiting for payment." }, { status: 400 });
      }
      const { data: user } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", studentId)
        .maybeSingle();
      const sessionType =
        booking.session_type === "topic_group" ? "topic_group" : "one_to_one";
      const durationMinutes = Number(booking.duration_minutes) || DEFAULT_SESSION_MINUTES;
      const chargeHalalas = checkoutHalalasForPayg({ sessionType, durationMinutes });
      const productType = productTypeForSession(sessionType);
      const callbackPath =
        String(body.callbackPath ?? "").trim() || "/dashboard/ielts/student/live-classes";
      const baseUrl = getAppBaseUrl() || "http://localhost:3000";
      const callbackUrl = `${baseUrl}${callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`}`;
      const payment = await createLiveClassPayment({
        studentId,
        productType,
        amountHalalas: chargeHalalas,
        description: liveClassCheckoutDescription({ sessionType, durationMinutes }),
        callbackUrl,
        bookingId: booking.id,
        courseKey: String(booking.course_key),
      });
      if ("error" in payment) {
        return NextResponse.json({ error: payment.error }, { status: 503 });
      }
      const paymentId = payment.mode === "mock" ? payment.mockPaymentId : payment.paymentId;
      await supabase
        .from("live_class_bookings")
        .update({ moyasar_payment_id: paymentId })
        .eq("id", booking.id);
      await supabase.from("payment_transactions").upsert(
        {
          student_id: studentId,
          moyasar_payment_id: paymentId,
          track: "live",
          amount_halalas: chargeHalalas,
          currency: "SAR",
          status: "initiated",
          product_type: productType,
        },
        { onConflict: "moyasar_payment_id" }
      );
      return NextResponse.json({
        ok: true,
        billing: "payg",
        booking: { ...booking, moyasar_payment_id: paymentId },
        payment: {
          mode: payment.mode,
          paymentId,
          amountHalalas: chargeHalalas,
          priceLabel: paygPriceLabel({ sessionType, durationMinutes }),
          productType,
          publishableKey: payment.mode === "live" ? payment.publishableKey : null,
          mockMode: isMoyasarMockMode(),
          callbackUrl,
          description: liveClassCheckoutDescription({ sessionType, durationMinutes }),
          studentId,
          studentEmail: user?.email,
          studentName: user?.name,
          bookingId: booking.id,
        },
      });
    }

    const sessionTypeRaw = String(body.sessionType ?? "").trim();
    let sessionType: "topic_group" | "one_to_one" | "orientation" | null =
      sessionTypeRaw === "one_to_one"
        ? "one_to_one"
        : sessionTypeRaw === "topic_group"
          ? "topic_group"
          : sessionTypeRaw === "orientation"
            ? "orientation"
            : null;
    if (!sessionType) {
      return NextResponse.json({ error: "Choose a Group Live Class, One-on-One, or orientation slot." }, { status: 400 });
    }

    const durationMinutes = DEFAULT_SESSION_MINUTES;
    const startsAt = String(body.startsAt ?? "").trim();
    if (!startsAt || !Number.isFinite(new Date(startsAt).getTime())) {
      return NextResponse.json({ error: "Pick a valid session time." }, { status: 400 });
    }
    if (!startsAtMeetsNotice(startsAt, new Date(), sessionType)) {
      return NextResponse.json({ error: "That class time has already passed." }, { status: 400 });
    }
    const calendarType = sessionType === "topic_group" ? "topic_group" : "one_to_one";
    const windowError = offeredSlotViolation(startsAt, calendarType, durationMinutes);
    if (windowError) {
      return NextResponse.json({ error: windowError }, { status: 400 });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "name, email, enrolled_programs, program_selected, program_type, accelerator_track, checkout_track, payment_status, cefr_level, created_at"
      )
      .eq("id", studentId)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const courseWeeks = courseWeeksForStudent({
      acceleratorTrack: user.accelerator_track,
      checkoutTrack: user.checkout_track,
      programType: user.program_type,
      programSelected: user.program_selected,
    });
    if (!startsAtInStudentWindow(startsAt, user.created_at ?? new Date(), new Date(), courseWeeks)) {
      return NextResponse.json(
        { error: "That class is outside your course dates." },
        { status: 400 }
      );
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
    const requestedKey = String(body.courseKey ?? "").trim();
    const topicPackages = summary.entitlements.filter((pkg) => pkg.kindLabel === "topic");
    const selected =
      topicPackages.find((pkg) => pkg.courseKey === requestedKey) ?? topicPackages[0] ?? null;
    const liveOrientationUsed = await countActiveOrientations(supabase, studentId);
    const orientationRemaining = Math.max(
      0,
      ORIENTATION_INCLUDED_COUNT - liveOrientationUsed
    );

    if (sessionType === "one_to_one" && orientationRemaining > 0) {
      sessionType = "orientation";
    }

    if (sessionType === "orientation") {
      if (orientationRemaining <= 0 || liveOrientationUsed >= ORIENTATION_INCLUDED_COUNT) {
        return NextResponse.json(
          { error: "Your orientation is already booked. Pick a One-on-One slot instead." },
          { status: 400 }
        );
      }
      const oneToOne = await findOrOpenOneToOneSession(
        supabase,
        new Date(startsAt).toISOString(),
        durationMinutes
      );
      if ("error" in oneToOne) {
        return NextResponse.json({ error: oneToOne.error }, { status: 400 });
      }
      const inserted = await insertLiveClassBooking(supabase, {
        studentId,
        courseKey: orientationCourseKey(),
        sessionType: "orientation",
        startsAt: new Date(startsAt).toISOString(),
        durationMinutes,
        billing: "included",
        status: "confirmed",
        sessionId: oneToOne.id,
      });
      if (!inserted.ok) {
        return NextResponse.json({ error: inserted.error }, { status: 400 });
      }
      const usedAfter = await countActiveOrientations(supabase, studentId);
      if (usedAfter > ORIENTATION_INCLUDED_COUNT) {
        await supabase
          .from("live_class_bookings")
          .update({ status: "cancelled" })
          .eq("id", inserted.booking.id);
        return NextResponse.json(
          { error: "Your orientation is already booked. Pick a One-on-One slot instead." },
          { status: 409 }
        );
      }
      return NextResponse.json({
        ok: true,
        billing: "included",
        booking: inserted.booking,
        remainingAfter: 0,
        chargedHalalas: 0,
      });
    }

    if (!selected) {
      return NextResponse.json(
        { error: "Enroll in a course before booking live classes." },
        { status: 400 }
      );
    }

    if (sessionType === "topic_group") {
      const catalog = liveClassCatalogForUser(
        {
          enrolledPrograms: user.enrolled_programs,
          programSelected: user.program_selected,
          programType: user.program_type,
        },
        String(body.callbackPath ?? "")
      );
      if (catalog === "one_to_one_only") {
        return NextResponse.json(
          { error: "STEP live classes are One-on-One only. Group classes are not offered on this programme." },
          { status: 400 }
        );
      }
    }

    const used = await countUsedIncluded(supabase, studentId, selected.courseKey, ["one_to_one"]);
    const remaining = remainingIncluded(selected.included, used);
    const hasIncludedOneToOne = remaining > 0 && selected.policy !== "language_development";
    const payType = sessionType === "topic_group" ? "topic_group" : "one_to_one";
    if (sessionType === "topic_group" && hasIncludedOneToOne) {
      return NextResponse.json(
        { error: "Group classes unlock after you use your free One-on-One sessions." },
        { status: 400 }
      );
    }
    const useIncluded = payType === "one_to_one" && hasIncludedOneToOne;
    if (useIncluded && String(body.forcePaid ?? "") === "true") {
      return NextResponse.json(
        { error: "Use your included One-on-One classes before paying for extra sessions." },
        { status: 400 }
      );
    }

    let sessionId: string | null = String(body.sessionId ?? "").trim() || null;
    if (sessionType === "topic_group") {
      const group = await findOrOpenGroupSession(
        supabase,
        new Date(startsAt).toISOString(),
        durationMinutes
      );
      if ("error" in group) {
        return NextResponse.json({ error: group.error }, { status: 400 });
      }
      sessionId = group.id;
    } else {
      const oneToOne = await findOrOpenOneToOneSession(
        supabase,
        new Date(startsAt).toISOString(),
        durationMinutes
      );
      if ("error" in oneToOne) {
        return NextResponse.json({ error: oneToOne.error }, { status: 400 });
      }
      sessionId = oneToOne.id;
    }

    const price = checkoutHalalasForPayg({ sessionType: payType, durationMinutes });
    const credits = await creditBalanceHalalas(supabase, studentId);
    let billing: "included" | "payg" | "credit" = useIncluded ? "included" : "payg";
    let chargeHalalas = useIncluded ? 0 : price;

    if (!useIncluded && credits > 0) {
      const applied = await spendCredits(supabase, studentId, price);
      chargeHalalas = Math.max(0, price - applied);
      if (applied > 0 && chargeHalalas === 0) billing = "credit";
      else if (applied > 0) billing = "payg";
    }

    const bookingStatus =
      billing === "included" || chargeHalalas === 0
        ? payType === "one_to_one"
          ? "confirmed"
          : "reserved"
        : "pending_payment";

    const inserted = await insertLiveClassBooking(supabase, {
      studentId,
      courseKey: selected.courseKey,
      sessionType: payType,
      startsAt: new Date(startsAt).toISOString(),
      durationMinutes,
      billing,
      status: bookingStatus,
      sessionId,
    });

    if (!inserted.ok) {
      return NextResponse.json({ error: inserted.error }, { status: 400 });
    }

    if (bookingStatus !== "pending_payment") {
      if (payType === "topic_group") {
        await afterGroupEnrollment(supabase, sessionId);
      }
      return NextResponse.json({
        ok: true,
        billing,
        booking: inserted.booking,
        remainingAfter: useIncluded ? remaining - 1 : remaining,
        chargedHalalas: 0,
      });
    }

    const productType = productTypeForSession(payType);
    const callbackPath =
      String(body.callbackPath ?? "").trim() || "/dashboard/ielts/student/live-classes";
    const baseUrl = getAppBaseUrl() || "http://localhost:3000";
    const callbackUrl = `${baseUrl}${callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`}`;

    const payment = await createLiveClassPayment({
      studentId,
      productType,
      amountHalalas: chargeHalalas,
      description: liveClassCheckoutDescription({ sessionType: payType, durationMinutes }),
      callbackUrl,
      bookingId: inserted.booking.id,
      courseKey: selected.courseKey,
    });

    if ("error" in payment) {
      await supabase
        .from("live_class_bookings")
        .update({ status: "cancelled" })
        .eq("id", inserted.booking.id);
      return NextResponse.json({ error: payment.error }, { status: 503 });
    }

    const paymentId = payment.mode === "mock" ? payment.mockPaymentId : payment.paymentId;

    await supabase
      .from("live_class_bookings")
      .update({ moyasar_payment_id: paymentId })
      .eq("id", inserted.booking.id);

    await supabase.from("payment_transactions").upsert(
      {
        student_id: studentId,
        moyasar_payment_id: paymentId,
        track: "live",
        amount_halalas: chargeHalalas,
        currency: "SAR",
        status: "initiated",
        product_type: productType,
      },
      { onConflict: "moyasar_payment_id" }
    );

    return NextResponse.json({
      ok: true,
      billing: "payg",
      booking: { ...inserted.booking, moyasar_payment_id: paymentId },
      payment: {
        mode: payment.mode,
        paymentId,
        amountHalalas: chargeHalalas,
        priceLabel: paygPriceLabel({ sessionType: payType, durationMinutes }),
        productType,
        publishableKey: payment.mode === "live" ? payment.publishableKey : null,
        mockMode: isMoyasarMockMode(),
        callbackUrl,
        description: liveClassCheckoutDescription({ sessionType: payType, durationMinutes }),
        studentId,
        studentEmail: user.email,
        studentName: user.name,
        bookingId: inserted.booking.id,
      },
    });
  } catch (err) {
    console.error("[live-classes/book]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not book class" },
      { status: 500 }
    );
  }
}
