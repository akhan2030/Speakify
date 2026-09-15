import {
  STEP_INDEPENDENT_PREP_DISCLOSURE,
  STEP_PUBLISHED_ITEM_RANGE,
  STEP_PUBLISHED_SEAT_RANGE,
} from "@/lib/step/officialBlueprint";

type Tone = "hero" | "form" | "page";

type Props = {
  tone?: Tone;
  /** Extra line under the affiliation disclosure (weights vs ranges). */
  showStructureLine?: boolean;
};

/**
 * Visible independent-prep disclosure — not fine print.
 * Used on the public course page and STEP register page.
 */
export default function StepIndependentPrepNotice({
  tone = "page",
  showStructureLine = true,
}: Props) {
  const box =
    tone === "hero"
      ? "border-2 border-[#c9972c] bg-[#0d1b35]/80 text-white"
      : "border-2 border-[#c9972c] bg-[#fff8e8] text-[#0d1b35]";
  const kicker = tone === "hero" ? "text-[#c9972c]" : "text-[#8a6a1a]";
  const body = tone === "hero" ? "text-slate-100" : "text-slate-800";

  return (
    <aside className={`mt-6 rounded-xl px-4 py-4 sm:px-5 ${box}`} role="note">
      <p className={`text-xs font-extrabold uppercase tracking-[0.14em] ${kicker}`}>
        Independent prep — not an official Qiyas product
      </p>
      <p className={`mt-2 text-sm font-semibold leading-relaxed sm:text-base ${body}`}>
        {STEP_INDEPENDENT_PREP_DISCLOSURE}
      </p>
      {showStructureLine ? (
        <p className={`mt-2 text-sm leading-relaxed ${body}`}>
          Component weights we teach are Reading 40% · Structure 30% · Listening 20% ·
          Analysis 10%. Public sources disagree on totals, so we describe the live exam as{" "}
          {STEP_PUBLISHED_ITEM_RANGE} over {STEP_PUBLISHED_SEAT_RANGE} — not a single fixed
          figure. Section order and per-section clocks in Speakify are our study sequence,
          not confirmed test-day order.
        </p>
      ) : null}
    </aside>
  );
}
