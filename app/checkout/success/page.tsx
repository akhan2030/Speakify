"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { dashboardPathForStudentUser } from "@/lib/studentLoginRedirect";

const GOLD = "#c9972c";
const NAVY = "#0d1b35";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch("/api/payments/status");
        const data = await res.json();
        if (cancelled) return;

        if (data.hasAccess) {
          await update({
            paymentStatus: "paid",
            hasDashboardAccess: true,
          });
          const path = dashboardPathForStudentUser(session?.user ?? {});
          setMessage("Payment confirmed! Redirecting to your dashboard…");
          window.setTimeout(() => {
            router.replace(path);
          }, 1200);
          return;
        }

        if (attempts >= 12) {
          setMessage(
            "Payment is still processing. If you completed payment, refresh in a moment or contact support."
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
  }, [status, router, update, session?.user]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 text-white"
      style={{ backgroundColor: NAVY }}
    >
      <p className="text-xl font-extrabold tracking-tight" style={{ color: GOLD }}>
        Speakify
      </p>
      <div className="mt-8 w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <span
          className="mx-auto mb-4 block h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }}
        />
        <p className="text-sm text-slate-700">{message}</p>
        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="mt-6 text-xs text-slate-500 underline"
        >
          Back to checkout
        </button>
      </div>
    </div>
  );
}
