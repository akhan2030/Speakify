"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MoyasarCheckoutForm } from "@/components/payments/MoyasarCheckoutForm";
import { readRememberedFoundingOffer } from "@/lib/discounts";
import type { MockProductType } from "@/lib/mock-test/academicMockCatalog";

const GOLD = "#c9972c";
const NAVY = "#0d1b35";
const TEAL = "#0d9488";

type MockCheckoutState = {
  product: MockProductType;
  productType: string;
  mockNumbers: number[];
  unlockingMockNumbers: number[];
  alreadyOwnedMockNumbers: number[];
  price: string;
  description: string;
  mode: "mock" | "live";
  paymentId: string;
  mockMode: boolean;
  publishableKey: string | null;
  amountHalalas: number;
  callbackUrl: string;
  studentId: string;
  foundingOfferFull?: boolean;
  foundingOfferMessage?: string | null;
};

function parseProduct(value: string | null): MockProductType | null {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "single" || v === "pack3" || v === "pack5") return v;
  return null;
}

export default function MockCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<MockCheckoutState | null>(null);

  const product = parseProduct(searchParams.get("product"));
  const mockNumber = Number(searchParams.get("mock"));
  const offer = searchParams.get("offer") || readRememberedFoundingOffer();

  const checkoutQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (product) params.set("product", product);
    if (product === "single" && Number.isFinite(mockNumber)) {
      params.set("mock", String(mockNumber));
    }
    if (offer) params.set("offer", offer);
    return params.toString();
  }, [product, mockNumber, offer]);

  const initCheckout = useCallback(async () => {
    if (!product) {
      setError("Missing checkout product. Choose a mock from the courses page.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setFormError(null);

    try {
      const res = await fetch("/api/payments/moyasar/create-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          mockNumber: product === "single" ? mockNumber : undefined,
          ...(offer ? { offer } : {}),
        }),
      });
      const data = await res.json();

      if (res.status === 401) {
        const loginTarget = `/checkout/mock${checkoutQuery ? `?${checkoutQuery}` : ""}`;
        router.replace(`/login?callbackUrl=${encodeURIComponent(loginTarget)}`);
        return;
      }

      if (!res.ok) {
        if (data.redirect) {
          router.replace(data.redirect);
          return;
        }
        throw new Error(data.error ?? "Could not start checkout");
      }

      setCheckout({
        product,
        productType: data.productType,
        mockNumbers: data.mockNumbers ?? [],
        unlockingMockNumbers: data.unlockingMockNumbers ?? data.mockNumbers ?? [],
        alreadyOwnedMockNumbers: data.alreadyOwnedMockNumbers ?? [],
        price: data.price,
        description: data.description,
        mode: data.mode,
        paymentId: data.paymentId,
        mockMode: data.mockMode,
        publishableKey: data.publishableKey,
        amountHalalas: data.amountHalalas,
        callbackUrl: data.callbackUrl,
        studentId: data.studentId,
        foundingOfferFull: Boolean(data.foundingOfferFull),
        foundingOfferMessage: data.foundingOfferMessage ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [product, mockNumber, router, checkoutQuery, offer]);

  useEffect(() => {
    if (!product) {
      setLoading(false);
      setError("Missing checkout product.");
      return;
    }

    if (product === "single" && (!Number.isInteger(mockNumber) || mockNumber < 1 || mockNumber > 5)) {
      setLoading(false);
      setError("Invalid mock number.");
      return;
    }

    if (status === "unauthenticated") {
      const loginTarget = `/checkout/mock?${checkoutQuery}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(loginTarget)}`);
      return;
    }

    if (status === "authenticated") {
      initCheckout();
    }
  }, [status, product, mockNumber, router, checkoutQuery, initCheckout]);

  const completeMockPayment = async () => {
    if (!checkout) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/mock-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: checkout.paymentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Payment failed");
      }
      router.replace(`/checkout/mock/success?paymentId=${encodeURIComponent(checkout.paymentId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const showLiveForm =
    checkout &&
    !checkout.mockMode &&
    checkout.publishableKey &&
    checkout.amountHalalas > 0;

  const overlapNotice =
    checkout && checkout.alreadyOwnedMockNumbers.length > 0 ? (
      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        You already own Mock{checkout.alreadyOwnedMockNumbers.length > 1 ? "s" : ""}{" "}
        {checkout.alreadyOwnedMockNumbers.map((n) => `#${n}`).join(", ")}. This purchase
        still costs {checkout.price} and unlocks Mock
        {checkout.unlockingMockNumbers.length > 1 ? "s" : ""}{" "}
        {checkout.unlockingMockNumbers.map((n) => `#${n}`).join(", ")}.
      </p>
    ) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: NAVY }}>
      <header className="px-6 pt-6 sm:px-8">
        <p className="text-xl font-extrabold tracking-tight" style={{ color: GOLD }}>
          Speakify
        </p>
      </header>
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-[560px] rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <p
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: TEAL }}
          >
            IELTS Academic mock exam
          </p>
          <h1 className="mt-2 text-xl font-bold text-[#0d1b35]">Complete your purchase</h1>
          <p className="mt-2 text-sm text-slate-600">
            One-time payment unlocks the mock(s) below — unlimited retakes, AI + human review.
          </p>

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
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={initCheckout}
                  className="w-full rounded-xl py-3 text-sm font-bold text-[#0d1b35]"
                  style={{ backgroundColor: GOLD }}
                >
                  Try again
                </button>
                <Link
                  href="/courses/mock-exams"
                  className="text-center text-sm font-medium text-slate-600 underline"
                >
                  Back to mock exams
                </Link>
              </div>
            </div>
          ) : checkout ? (
            <>
              <div
                className="mt-6 rounded-xl border p-4"
                style={{ borderColor: `${TEAL}40`, backgroundColor: `${TEAL}10` }}
              >
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: TEAL }}>
                  Your order
                </p>
                <p className="mt-2 text-lg font-bold text-[#0d1b35]">{checkout.description}</p>
                <p className="mt-1 text-2xl font-bold text-[#0d1b35]">{checkout.price}</p>
                {checkout.foundingOfferMessage ? (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {checkout.foundingOfferMessage}
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-slate-600">
                  Unlocks: Mock {checkout.unlockingMockNumbers.join(", Mock ")}
                </p>
                {overlapNotice}
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>✓ Full 4-skill Academic mock (~3 hours)</li>
                <li>✓ Unlimited retakes on purchased mocks</li>
                <li>✓ AI band prediction + human Writing/Speaking review</li>
                <li>✓ mada, Apple Pay, STC Pay & cards (via Moyasar)</li>
              </ul>

              {checkout.mockMode ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Test mode</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Moyasar keys are not configured. Simulate a successful payment below.
                  </p>
                  <button
                    type="button"
                    disabled={paying}
                    onClick={completeMockPayment}
                    className="mt-4 w-full rounded-xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
                    style={{ backgroundColor: TEAL }}
                  >
                    {paying ? "Processing…" : `Pay ${checkout.price} (test)`}
                  </button>
                </div>
              ) : showLiveForm ? (
                <div className="mt-6">
                  {formError ? (
                    <p className="mb-2 text-sm text-red-600">{formError}</p>
                  ) : null}
                  <MoyasarCheckoutForm
                    amountHalalas={checkout.amountHalalas}
                    publishableKey={checkout.publishableKey!}
                    callbackUrl={checkout.callbackUrl}
                    description={checkout.description}
                    studentId={checkout.studentId}
                    metadata={{
                      product_type: checkout.productType,
                      mock_numbers: checkout.mockNumbers.join(","),
                    }}
                    onError={setFormError}
                  />
                </div>
              ) : (
                <p className="mt-6 text-sm text-red-600">
                  Payment form could not load. Check Moyasar keys in Vercel.
                </p>
              )}
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
