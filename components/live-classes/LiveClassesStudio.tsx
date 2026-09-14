"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MoyasarCheckoutForm } from "@/components/payments/MoyasarCheckoutForm";
import LiveClassBookingBoard from "@/components/live-classes/LiveClassBookingBoard";
import {
  LiveClassStatusLegend,
} from "@/components/live-classes/LiveClassStudentGuide";
import {
  DEFAULT_SESSION_MINUTES,
  studentBookingAction,
  liveClassKindLabel,
} from "@/lib/live-classes/model";
import {
  buildLiveClassIcs,
  liveClassCalendarDescription,
  liveClassIcsFilename,
} from "@/lib/live-classes/calendarInvite";
import {
  prioritySkillLabelFromDashboard,
  skillDashboardUrlForLiveClasses,
} from "@/lib/live-classes/priority";

type Entitlement = {
  courseKey: string;
  label: string;
  kindLabel: "orientation" | "topic";
  policy?: "test_prep" | "language_development";
  included: number;
  used: number;
  remaining: number;
  payg: boolean;
};

type Booking = {
  id: string;
  course_key: string;
  session_type: string;
  starts_at: string;
  duration_minutes: number;
  billing: string;
  status: string;
  recording_url: string | null;
  moyasar_payment_id?: string | null;
};

type Slot = {
  sessionId: string | null;
  startsAt: string;
  durationMinutes: number;
  sessionType?: "topic_group" | "one_to_one";
  typeLabel?: string;
  enrolled: number;
  needed: number;
  timeRangeLabel?: string;
  seatsLabel?: string;
  registeredLabel?: string;
  confirmLabel?: string;
  billingKind?: "included" | "paid";
  billingLabel?: string;
  status: "open" | "confirmed" | "full" | "cancelled";
  neededLabel: string;
};

type PaygPayment = {
  mode: "mock" | "live";
  paymentId: string;
  amountHalalas: number;
  priceLabel: string;
  productType: string;
  publishableKey: string | null;
  mockMode: boolean;
  callbackUrl: string;
  description: string;
  studentId: string;
  bookingId?: string;
};

type Props = {
  callbackPath: string;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    timeZone: "Asia/Riyadh",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readLiveClassesJson(res: Response): Promise<{
  error?: string;
  entitlements?: Entitlement[];
  bookings?: Booking[];
  marketplace?: Slot[];
  creditsHalalas?: number;
  billing?: string;
  payment?: PaygPayment & { bookingId?: string };
  booking?: { id?: string };
}> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      res.status >= 500
        ? "Live classes could not load. Refresh once — the server may still be restarting."
        : "Live classes returned an unexpected response."
    );
  }
}

export default function LiveClassesStudio({ callbackPath }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [marketplace, setMarketplace] = useState<Slot[]>([]);
  const [creditsHalalas, setCreditsHalalas] = useState(0);
  const [courseKey, setCourseKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payg, setPayg] = useState<PaygPayment | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [prioritySkill, setPrioritySkill] = useState<string | null>(null);
  const loadInFlight = useRef(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (loadInFlight.current) return;
    if (opts?.silent && typeof document !== "undefined" && document.hidden) return;
    loadInFlight.current = true;
    if (!opts?.silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch("/api/live-classes");
      const data = await readLiveClassesJson(res);
      if (!res.ok) throw new Error(data.error ?? "Could not load live classes");
      setEntitlements(data.entitlements ?? []);
      setBookings(data.bookings ?? []);
      setMarketplace(data.marketplace ?? []);
      setCreditsHalalas(Number(data.creditsHalalas ?? 0));
      const firstTopic = (data.entitlements ?? []).find((e: Entitlement) => e.kindLabel === "topic");
      if (firstTopic) setCourseKey((prev) => prev || firstTopic.courseKey);
    } catch (err) {
      if (!opts?.silent) {
        setError(err instanceof Error ? err.message : "Could not load live classes");
      }
    } finally {
      loadInFlight.current = false;
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const url = skillDashboardUrlForLiveClasses(callbackPath);
    if (!url) {
      setPrioritySkill(null);
      return;
    }
    let cancelled = false;
    void fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (cancelled) return;
        setPrioritySkill(prioritySkillLabelFromDashboard(payload));
      })
      .catch(() => {
        if (!cancelled) setPrioritySkill(null);
      });
    return () => {
      cancelled = true;
    };
  }, [callbackPath]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void load({ silent: true });
    }, 20_000);
    return () => window.clearInterval(id);
  }, [load]);

  const topicPackages = useMemo(
    () => entitlements.filter((e) => e.kindLabel === "topic"),
    [entitlements]
  );
  const selected = topicPackages.find((e) => e.courseKey === courseKey) ?? topicPackages[0];
  const orientation = entitlements.find((e) => e.kindLabel === "orientation");
  const isLanguage = selected?.policy === "language_development" || (selected?.included ?? 0) === 0;
  const remaining = selected?.remaining ?? 0;
  const usesIncluded = !isLanguage && remaining > 0;
  const remainingOrientation = orientation?.remaining ?? 0;
  const needsOrientation = remainingOrientation > 0;
  const visibleBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const status = String(booking.status ?? "").toLowerCase();
        if (status === "cancelled" || status === "pending_schedule") return false;
        if (booking.session_type === "orientation" && status === "completed") return false;
        return true;
      }),
    [bookings]
  );

  async function bookSlot(slot: {
    startsAt: string;
    sessionId: string | null;
    sessionType?: "topic_group" | "one_to_one";
  }) {
    if (slot.sessionType === "topic_group" && usesIncluded) {
      setFormError("Group classes unlock after you use your free One-on-One sessions.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setPayg(null);
    try {
      const sessionType =
        slot.sessionType === "topic_group"
          ? "topic_group"
          : remainingOrientation > 0
            ? "orientation"
            : "one_to_one";
      const res = await fetch("/api/live-classes/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseKey: selected?.courseKey,
          sessionType,
          durationMinutes: DEFAULT_SESSION_MINUTES,
          startsAt: slot.startsAt,
          sessionId: slot.sessionId,
          callbackPath,
        }),
      });
      const data = await readLiveClassesJson(res);
      if (!res.ok) throw new Error(data.error ?? "Could not book");
      if (data.billing === "payg" && data.payment) {
        await load({ silent: true });
        setPayg({ ...data.payment, bookingId: data.payment.bookingId ?? data.booking?.id });
      } else {
        await load();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not book");
    } finally {
      setSubmitting(false);
    }
  }

  async function payForBooking(booking: Booking) {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/live-classes/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeBookingId: booking.id, callbackPath }),
      });
      const data = await readLiveClassesJson(res);
      if (!res.ok) throw new Error(data.error ?? "Could not start payment");
      if (data.payment) {
        setPayg({ ...data.payment, bookingId: booking.id });
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not start payment");
    } finally {
      setSubmitting(false);
    }
  }

  function downloadCalendar(booking: Booking) {
    const title = `Speakify ${liveClassKindLabel(booking.session_type)}`;
    const pageUrl =
      typeof window !== "undefined" ? `${window.location.origin}${callbackPath}` : callbackPath;
    const ics = buildLiveClassIcs({
      id: booking.id,
      title,
      startsAt: booking.starts_at,
      durationMinutes: booking.duration_minutes || DEFAULT_SESSION_MINUTES,
      description: liveClassCalendarDescription({
        sessionType: booking.session_type,
        pageUrl,
      }),
      url: pageUrl,
    });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = liveClassIcsFilename({
      sessionType: booking.session_type,
      startsAt: booking.starts_at,
    });
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  async function completeMockPayg() {
    if (!payg) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/live-classes/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPaymentId: payg.paymentId }),
      });
      const data = await readLiveClassesJson(res);
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      setPayg(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-speakify-gold/30 border-t-speakify-gold" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="font-speakify-serif text-2xl font-bold text-speakify-navy">Live classes</h1>
      <p className="mt-1 text-sm text-speakify-muted">Book your One-on-One or Group class.</p>

      {prioritySkill ? (
        <div className="mt-4 rounded-xl border border-speakify-gold/35 bg-white px-4 py-3">
          <p className="text-sm font-bold text-speakify-navy">
            Your priority this week: {prioritySkill}
          </p>
          <p className="mt-1 text-sm leading-snug text-speakify-muted">
            Book a One-on-One and ask your teacher to focus there — it&apos;s where you&apos;ll
            gain the most, fastest.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <div className="rounded-xl border border-speakify-line bg-white px-4 py-3 text-[13.5px] text-speakify-muted">
          <span className="block text-base font-bold text-speakify-navy">
            {orientation ? `${orientation.used}/${orientation.included}` : "1/1"}
          </span>
          Orientation
        </div>
        <div className="rounded-xl border border-speakify-line bg-white px-4 py-3 text-[13.5px] text-speakify-muted">
          <span className="block text-base font-bold text-speakify-navy">
            {selected ? `${selected.remaining} left` : "—"}
          </span>
          Free One-on-One classes
        </div>
        <div className="rounded-xl border border-speakify-line bg-white px-4 py-3 text-[13.5px] text-speakify-muted">
          <span className="block text-base font-bold text-speakify-navy">
            {(creditsHalalas / 100).toLocaleString("en-US")} SAR
          </span>
          Refund credit
        </div>
      </div>

      <div className="mt-4">
        <LiveClassStatusLegend />
      </div>

      {topicPackages.length > 1 ? (
        <label className="mt-6 block text-sm font-medium text-speakify-navy">
          Book for
          <select
            className="mt-1 w-full rounded-xl border border-speakify-line px-3 py-2"
            value={selected?.courseKey ?? ""}
            onChange={(e) => setCourseKey(e.target.value)}
          >
            {topicPackages.map((pkg) => (
              <option key={pkg.courseKey} value={pkg.courseKey}>
                {pkg.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <section className="mt-4">
        <h2 className="font-speakify-serif text-lg font-bold text-speakify-navy">Book a slot</h2>
        <div className="mt-3">
          <LiveClassBookingBoard
            slots={marketplace}
            remainingIncluded={remaining}
            usesIncluded={usesIncluded}
            packageIncluded={selected?.included ?? 0}
            needsOrientation={needsOrientation}
            myBookings={visibleBookings.map((booking) => ({
              startsAt: booking.starts_at,
              sessionType: booking.session_type,
              billing: booking.billing,
              status: booking.status,
            }))}
            submitting={submitting}
            bookDisabled={!selected}
            showActions
            onBook={bookSlot}
          />
        </div>
      </section>

      {formError ? <p className="mt-4 text-sm text-red-600">{formError}</p> : null}

      <section className="mt-6">
        <h2 className="font-speakify-serif text-lg font-bold text-speakify-navy">Your sessions</h2>
        {visibleBookings.length === 0 ? (
          <p className="mt-3 text-sm text-speakify-muted">No bookings yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {visibleBookings.map((booking) => {
              const action = studentBookingAction({
                status: booking.status,
                sessionType: booking.session_type,
                startsAt: booking.starts_at,
                durationMinutes: booking.duration_minutes,
                recordingUrl: booking.recording_url,
                now,
              });
              const payingHere = payg && payg.bookingId === booking.id;
              const typeLabel = liveClassKindLabel(booking.session_type);
              return (
                <li key={booking.id} className="rounded-2xl border border-speakify-line bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-speakify-navy">
                        {typeLabel} · {formatWhen(booking.starts_at)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-speakify-navy">{action.headline}</p>
                      <p className="mt-0.5 text-sm text-speakify-muted">{action.detail}</p>
                    </div>
                    {action.kind === "pay" && !payingHere ? (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void payForBooking(booking)}
                        className="rounded-speakify-btn bg-speakify-gold px-4 py-2 text-sm font-bold text-speakify-navy shadow-speakify-btn"
                      >
                        {action.ctaLabel}
                      </button>
                    ) : null}
                    {action.kind === "replay" && booking.recording_url ? (
                      <a
                        href={booking.recording_url}
                        className="rounded-speakify-btn bg-speakify-navy px-4 py-2 text-sm font-semibold text-white shadow-speakify-btn"
                      >
                        {action.ctaLabel}
                      </a>
                    ) : null}
                    {action.kind === "join" ? (
                      <span className="rounded-speakify-btn bg-speakify-navy px-4 py-2 text-sm font-semibold text-white">
                        Join class
                      </span>
                    ) : null}
                    {action.kind === "countdown" || action.kind === "join" ? (
                      <button
                        type="button"
                        onClick={() => downloadCalendar(booking)}
                        className="rounded-xl border border-speakify-navy px-4 py-2 text-sm font-semibold text-speakify-navy"
                      >
                        Add to calendar
                      </button>
                    ) : null}
                  </div>
                  {payingHere ? (
                    <div className="mt-4 rounded-xl border border-speakify-gold/40 bg-speakify-paper p-4">
                      <p className="text-sm font-semibold text-speakify-navy">Pay {payg.priceLabel}</p>
                      {payg.mockMode ? (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={completeMockPayg}
                          className="mt-3 rounded-speakify-btn bg-speakify-gold px-4 py-2 text-sm font-bold text-speakify-navy shadow-speakify-btn"
                        >
                          Pay {payg.priceLabel}
                        </button>
                      ) : payg.publishableKey ? (
                        <div className="mt-3">
                          <MoyasarCheckoutForm
                            amountHalalas={payg.amountHalalas}
                            publishableKey={payg.publishableKey}
                            callbackUrl={payg.callbackUrl}
                            description={payg.description}
                            studentId={payg.studentId}
                            metadata={{ product_type: payg.productType }}
                            onError={setFormError}
                          />
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-red-600">Payment form could not load.</p>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
