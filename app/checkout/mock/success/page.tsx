"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  GT_MOCK_LOBBY_PATH,
  IELTS_MOCK_LOBBY_PATH,
} from "@/lib/mock-test/ieltsMockRoutes";

const GOLD = "#c9972c";
const NAVY = "#0d1b35";
const TEAL = "#0d9488";

function MockCheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const paymentId = searchParams.get("paymentId")?.trim() ?? "";
  const programme =
    String(searchParams.get("programme") ?? "").trim().toLowerCase() ===
    "ielts_general"
      ? "ielts_general"
      : "ielts";
  const defaultLobby =
    programme === "ielts_general" ? GT_MOCK_LOBBY_PATH : IELTS_MOCK_LOBBY_PATH;
  const [message, setMessage] = useState("Confirming your payment…");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(defaultLobby)}`);
      return;
    }
    if (status !== "authenticated") return;

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const params = new URLSearchParams({ programme });
        if (paymentId) params.set("paymentId", paymentId);
        const res = await fetch(`/api/payments/mock-status?${params.toString()}`);
        const data = await res.json();
        if (cancelled) return;

        if (data.paymentConfirmed || data.hasPurchases) {
          setDone(true);
          setMessage("Payment confirmed! Redirecting to your mock exams…");
          window.setTimeout(
            () => router.replace(data.redirect ?? defaultLobby),
            1200
          );
          return;
        }

        if (attempts >= 12) {
          setMessage(
            "Payment is still processing. If you completed payment, open your mock exam lobby or contact support."
          );
          return;
        }

        window.setTimeout(poll, 2000);
      } catch {
        if (!cancelled && attempts < 12) {
          window.setTimeout(poll, 2000);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [status, router, paymentId, programme, defaultLobby]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 text-white"
      style={{ backgroundColor: NAVY }}
    >
      <p className="text-xl font-extrabold tracking-tight" style={{ color: GOLD }}>
        Speakify
      </p>
      <div className="mt-8 w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        {!done ? (
          <span
            className="mx-auto mb-4 block h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }}
          />
        ) : (
          <span
            className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: TEAL }}
          >
            ✓
          </span>
        )}
        <h1 className="text-xl font-bold text-[#0d1b35]">Mock exam purchase</h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        <Link
          href={defaultLobby}
          className="mt-6 inline-block text-sm font-semibold hover:underline"
          style={{ color: TEAL }}
        >
          Go to mock exam lobby →
        </Link>
      </div>
    </div>
  );
}

export default function MockCheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center text-white"
          style={{ backgroundColor: NAVY }}
        >
          Loading…
        </div>
      }
    >
      <MockCheckoutSuccessContent />
    </Suspense>
  );
}
