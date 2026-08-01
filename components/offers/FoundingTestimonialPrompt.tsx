"use client";

import { useEffect, useState } from "react";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";
const DISMISS_KEY = "founding_testimonial_dismissed";

type PromptState = {
  shouldPrompt: boolean;
  productId?: string | null;
  overallBand?: number | null;
};

export default function FoundingTestimonialPrompt({
  overallBand,
}: {
  overallBand?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [bandScore, setBandScore] = useState(
    overallBand != null && Number.isFinite(overallBand) ? String(overallBand) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* continue */
    }

    let cancelled = false;
    fetch("/api/offers/founding-testimonial")
      .then((r) => r.json())
      .then((data: PromptState) => {
        if (cancelled || !data.shouldPrompt) return;
        setProductId(data.productId ?? null);
        if (data.overallBand != null && !bandScore) {
          setBandScore(String(data.overallBand));
        }
        setOpen(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setEntered(true));
        });
      })
      .catch(() => {
        /* silent */
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot prompt on mount
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setEntered(false);
    window.setTimeout(() => setOpen(false), 220);
    fetch("/api/offers/founding-testimonial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismiss: true, productId }),
    }).catch(() => {
      /* ignore */
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const band = bandScore.trim() ? Number(bandScore) : null;
      const res = await fetch("/api/offers/founding-testimonial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          reviewText: reviewText.trim() || null,
          bandScore: Number.isFinite(band as number) ? band : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save review");
      try {
        sessionStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
      setDone(true);
      window.setTimeout(() => {
        setEntered(false);
        window.setTimeout(() => setOpen(false), 220);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="founding-testimonial-title"
    >
      <button
        type="button"
        aria-label="Dismiss"
        className={`absolute inset-0 bg-[#0d1b35]/55 backdrop-blur-sm transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={dismiss}
      />
      <div
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-white/10 bg-white shadow-2xl transition-all duration-300 ease-out sm:rounded-2xl ${
          entered
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-[0.98] opacity-0"
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
            Founding 50
          </p>
          <h2 id="founding-testimonial-title" className="mt-2 pr-8 text-xl font-extrabold text-white">
            How was your mock experience?
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            A quick rating helps us improve — optional, never required.
          </p>
        </div>

        <div className="px-6 py-5 sm:px-7 sm:py-6">
          {done ? (
            <p className="text-center text-sm font-semibold" style={{ color: TEAL }}>
              Thank you — your feedback was saved.
            </p>
          ) : (
            <>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="h-10 w-10 rounded-full text-sm font-bold transition-colors"
                    style={{
                      backgroundColor: n <= rating ? GOLD : "#f1f5f9",
                      color: n <= rating ? NAVY : "#64748b",
                    }}
                    aria-label={`${n} stars`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Band score (optional)
                <input
                  type="number"
                  min={0}
                  max={9}
                  step={0.5}
                  value={bandScore}
                  onChange={(e) => setBandScore(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-[#0d1b35]"
                  placeholder="e.g. 6.5"
                />
              </label>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Short review (optional)
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  maxLength={600}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-[#0d1b35]"
                  placeholder="What helped most?"
                />
              </label>

              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="mt-5 flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-sm font-bold disabled:opacity-60"
                style={{ backgroundColor: GOLD, color: NAVY }}
              >
                {submitting ? "Saving…" : "Submit feedback"}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="mt-2 w-full py-2 text-center text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Not now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
