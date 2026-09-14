"use client";

import { useState } from "react";

const LEGEND = [
  {
    label: "Book orientation",
    meaning:
      "uses one Monday time; the other Monday time that week stays a One-on-One. Nothing is booked until you tap a slot.",
  },
  {
    label: "Free live class",
    meaning:
      "an included One-on-One. After you book it, the button reads Your free live class.",
  },
  {
    label: "Paid One-on-One — 200 SAR",
    meaning:
      "a paid One-on-One session — wording adjusts slightly if you've used included classes before.",
  },
  {
    label: "Group — 100 SAR",
    meaning:
      "locked until your included One-on-Ones are used, then Book — 100 SAR. Seat copy goes from Be the first to join to Full.",
  },
] as const;

export function LiveClassStatusLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center justify-between rounded-xl border border-speakify-line bg-white px-4 py-3 text-left text-sm font-semibold text-speakify-navy ${
          open ? "rounded-b-none" : ""
        }`}
      >
        <span>How this works — tap to expand</span>
        <span className="text-speakify-gold" aria-hidden>
          {open ? "–" : "ⓘ"}
        </span>
      </button>
      {open ? (
        <div className="rounded-b-xl border border-t-0 border-speakify-line bg-white px-4 py-3 text-[13px] text-speakify-muted">
          {LEGEND.map((item) => (
            <p key={item.label} className="mb-1.5 last:mb-0">
              <span className="font-semibold text-speakify-ink">{item.label}</span>
              {" — "}
              {item.meaning}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
