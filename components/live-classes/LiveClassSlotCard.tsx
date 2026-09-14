"use client";

import type { GroupSlotDisplay } from "@/lib/live-classes/model";

export type LiveClassSlotView = GroupSlotDisplay & {
  startsAt: string;
  dateLabel?: string;
};

type Props = {
  slot: LiveClassSlotView;
  actionLabel?: string;
  disabled?: boolean;
  onAction?: () => void;
  compact?: boolean;
};

export default function LiveClassSlotCard({ slot, actionLabel, disabled, onAction, compact }: Props) {
  const statusClass =
    slot.status === "full"
      ? "border-speakify-line bg-speakify-paper"
      : slot.status === "confirmed"
        ? "border-speakify-gold/50 bg-white"
        : "border-speakify-line bg-white";

  return (
    <article className={`rounded-2xl border px-4 ${compact ? "py-2.5" : "py-3"} ${statusClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {slot.dateLabel ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-speakify-gold">{slot.dateLabel}</p>
            ) : null}
            <span className="rounded-full bg-speakify-paper px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-speakify-navy">
              {slot.typeLabel}
            </span>
          </div>
          <p className="mt-1 font-semibold text-speakify-navy">{slot.timeRangeLabel}</p>
          {slot.billingLabel ? (
            <p className="mt-1 text-sm font-semibold text-speakify-navy">{slot.billingLabel}</p>
          ) : null}
          {slot.seatsLabel ? <p className="mt-1 text-sm text-speakify-navy">{slot.seatsLabel}</p> : null}
          {slot.registeredLabel ? <p className="text-sm text-speakify-muted">{slot.registeredLabel}</p> : null}
          {slot.confirmLabel ? (
            <p
              className={`mt-1 text-sm font-semibold ${
                slot.sessionType === "topic_group" && slot.confirmedToRun
                  ? "text-[#1F7A4D]"
                  : "text-speakify-muted"
              }`}
            >
              {slot.confirmLabel}
            </p>
          ) : null}
        </div>
        {onAction ? (
          <button
            type="button"
            disabled={disabled || slot.full}
            onClick={onAction}
            className="rounded-speakify-btn bg-speakify-navy px-4 py-2 text-sm font-semibold text-white shadow-speakify-btn disabled:opacity-40"
          >
            {slot.full ? (slot.sessionType === "one_to_one" ? "Your free live class" : "Full") : actionLabel ?? "Book"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
