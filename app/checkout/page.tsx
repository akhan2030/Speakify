"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ACCELERATOR_TRACKS, type AcceleratorTrackId } from "@/lib/accelerator/tracks";

const GOLD = "#c9972c";
const NAVY = "#0d1b35";

type CheckoutState = {
  track: AcceleratorTrackId;
  trackLabel: string;
  price: string;
  duration: string;
  target: string;
  mode: "mock" | "live";
  paymentId: string;
  mockMode: boolean;
  publishableKey: string | null;
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);

  const reason = searchParams.get("reason");

  const initCheckout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusRes = await fetch("/api/payments/status");
      const statusData = await statusRes.json();
      if (statusData.hasAccess) {
        router.replace(statusData.dashboardPath ?? "/dashboard/ielts/student");
        return;
      }
      if (!statusData.requiresPayment) {
        router.replace("/dashboard/ielts/student");
        return;
      }

      const res = await fetch("/api/payments/moyasar/create", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Could not start checkout");
      }

      setCheckout({
        track: data.track,
        trackLabel: data.trackLabel,
        price: data.price,
        duration: data.duration,
        target: data.target,
        mode: data.mode,
        paymentId: data.paymentId,
        mockMode: data.mockMode,
        publishableKey: data.publishableKey,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated") {
      initCheckout();
    }
  }, [status, router, initCheckout]);

  const completeMockPayment = async () => {
    if (!checkout) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: checkout.paymentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Payment failed");
      }
      await update({
        paymentStatus: "paid",
        hasDashboardAccess: true,
      });
      router.replace(data.dashboardPath ?? "/checkout/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const whatsappRaw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "966500000000";
  const whatsappHref = `https://wa.me/${whatsappRaw.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi Speakify, I would like to pay by bank transfer for my IELTS programme."
  )}`;

  const meta = checkout?.track ? ACCELERATOR_TRACKS[checkout.track] : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: NAVY }}>
      <header className="px-6 pt-6 sm:px-8">
        <p className="text-xl font-extrabold tracking-tight" style={{ color: GOLD }}>
          Speakify
        </p>
      </header>
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-[560px] rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <h1 className="text-xl font-bold text-[#0d1b35]">Complete your enrollment</h1>
          {reason === "payment_required" ? (
            <p className="mt-2 text-sm text-amber-700">
              Payment is required to access your IELTS dashboard.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              One-time payment unlocks your full study plan, daily practice, and AI feedback.
            </p>
          )}

          {loading ? (
            <div className="mt-8 flex justify-center py-12">
              <span
                className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
                style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }}
              />
            </div>
          ) : error ? (
            <div className="mt-6">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={initCheckout}
                className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-[#0d1b35]"
                style={{ backgroundColor: GOLD }}
              >
                Try again
              </button>
            </div>
          ) : checkout && meta ? (
            <>
              <div className="mt-6 rounded-xl border border-[#c9972c]/30 bg-[#c9972c]/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#c9972c]">
                  Your plan
                </p>
                <p className="mt-2 text-lg font-bold text-[#0d1b35]">{checkout.trackLabel}</p>
                <p className="mt-1 text-2xl font-bold text-[#0d1b35]">{checkout.price}</p>
                <p className="mt-2 text-sm text-slate-600">Target: {checkout.target}</p>
                <p className="text-sm text-slate-600">Duration: {checkout.duration}</p>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>✓ Daily IELTS practice & vocabulary</li>
                <li>✓ AI writing & speaking feedback</li>
                <li>✓ Full mock exams with band estimates</li>
                <li>✓ mada, Apple Pay, STC Pay & cards (via Moyasar)</li>
              </ul>

              {checkout.mockMode ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Test mode</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Moyasar keys are not configured. Use the button below to simulate a successful
                    payment in this environment.
                  </p>
                  <button
                    type="button"
                    disabled={paying}
                    onClick={completeMockPayment}
                    className="mt-4 w-full rounded-xl py-3.5 text-sm font-bold text-[#0d1b35] disabled:opacity-60"
                    style={{ backgroundColor: GOLD }}
                  >
                    {paying ? "Processing…" : `Pay ${checkout.price} (test)`}
                  </button>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-sm text-slate-600">
                    You will be redirected to Moyasar secure checkout. Payment is processed in SAR.
                  </p>
                  <button
                    type="button"
                    disabled={paying}
                    onClick={() => router.push("/checkout/success")}
                    className="mt-4 w-full rounded-xl py-3.5 text-sm font-bold text-[#0d1b35] disabled:opacity-60"
                    style={{ backgroundColor: GOLD }}
                  >
                    Pay {checkout.price} securely →
                  </button>
                </div>
              )}

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block text-center text-xs text-slate-500 underline"
              >
                Prefer bank transfer? Chat with support
              </a>
            </>
          ) : null}

          {session?.user?.email ? (
            <p className="mt-6 text-center text-xs text-slate-400">
              Signed in as {session.user.email}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
