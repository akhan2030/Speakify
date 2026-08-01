"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FOUNDING_50_FALLBACK_SPOTS_REMAINING,
  FOUNDING_50_SESSION_DISMISS_KEY,
  FOUNDING_50_TOTAL_SPOTS,
  getFoundingOffer,
  rememberFoundingOffer,
  type FoundingOfferProductId,
} from "@/lib/discounts";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

type Props = {
  productId: FoundingOfferProductId;
  /** Delay before considering show triggers (ms). Default 4500. */
  delayMs?: number;
  /** Scroll depth (0–1) that can trigger early. Default 0.4. */
  scrollDepth?: number;
};

export default function FoundingOfferPopup({
  productId,
  delayMs = 4500,
  scrollDepth = 0.4,
}: Props) {
  const offer = getFoundingOffer(productId);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [spotsRemaining, setSpotsRemaining] = useState(
    FOUNDING_50_FALLBACK_SPOTS_REMAINING
  );

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(FOUNDING_50_SESSION_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setEntered(false);
    window.setTimeout(() => setVisible(false), 220);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/offers/founding-spots")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const n = Number(data.spotsRemaining);
        if (Number.isFinite(n) && n >= 0) {
          setSpotsRemaining(Math.min(FOUNDING_50_TOTAL_SPOTS, Math.floor(n)));
        }
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(FOUNDING_50_SESSION_DISMISS_KEY) === "1") {
        return;
      }
    } catch {
      /* show anyway */
    }

    let shown = false;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    const show = () => {
      if (shown) return;
      shown = true;
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      if (delayTimer) clearTimeout(delayTimer);
      window.removeEventListener("scroll", onScroll);
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      if (window.scrollY / max >= scrollDepth) show();
    };

    delayTimer = setTimeout(show, delayMs);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [delayMs, scrollDepth, productId]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  if (!visible) return null;

  const claimed = Math.max(0, FOUNDING_50_TOTAL_SPOTS - spotsRemaining);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="founding50-title"
    >
      <button
        type="button"
        aria-label="Dismiss offer"
        className={`absolute inset-0 bg-[#0d1b35]/55 backdrop-blur-sm transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={dismiss}
      />

      <div
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-white/10 bg-white shadow-2xl transition-all duration-300 ease-out sm:rounded-2xl ${
          entered
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-[0.98] opacity-0 sm:translate-y-2"
        }`}
      >
        <div className="relative px-6 pb-2 pt-5 sm:px-7 sm:pt-6" style={{ backgroundColor: NAVY }}>
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            {offer.label}
          </p>
          <h2 id="founding50-title" className="mt-2 pr-8 text-2xl font-extrabold text-white">
            {offer.productName}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Limited launch pricing for our first {FOUNDING_50_TOTAL_SPOTS} students —{" "}
            {offer.discountPercent}% off this programme.
          </p>
        </div>

        <div className="px-6 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-end gap-3">
            <p className="text-3xl font-extrabold" style={{ color: TEAL }}>
              {offer.discountedPriceLabel}
            </p>
            <p className="pb-1 text-base text-slate-400 line-through">
              {offer.originalPriceLabel}
            </p>
            <span
              className="mb-1 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ backgroundColor: `${GOLD}22`, color: GOLD }}
            >
              Save {offer.discountPercent}%
            </span>
          </div>

          <p className="mt-4 text-sm font-medium text-slate-600">
            <span className="font-bold" style={{ color: NAVY }}>
              {spotsRemaining} of {FOUNDING_50_TOTAL_SPOTS}
            </span>{" "}
            founding spots left
            <span className="text-slate-400"> · {claimed} claimed</span>
          </p>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (claimed / FOUNDING_50_TOTAL_SPOTS) * 100)}%`,
                backgroundColor: TEAL,
              }}
            />
          </div>

          <Link
            href={offer.ctaHref}
            onClick={() => {
              rememberFoundingOffer();
              dismiss();
            }}
            className="mt-6 flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-sm font-bold transition-opacity hover:opacity-95"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            Claim founding price →
          </Link>

          <p className="mt-3 text-center text-xs text-slate-500">{offer.trustLine}</p>
        </div>
      </div>
    </div>
  );
}
