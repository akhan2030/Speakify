type Variant = "hero" | "panel" | "compact" | "banner";

type Props = {
  variant?: Variant;
  className?: string;
};

const STEPS = [
  "We will show you exactly where you are.",
  "We will show you exactly where you need to be.",
  "We will walk with you every step between those two points.",
];

export default function SpeakifyWay({ variant = "panel", className = "" }: Props) {
  if (variant === "hero") {
    return (
      <div className={`text-white ${className}`}>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#c9972c]">
          The Speakify way
        </p>
        <p className="mt-6 text-2xl font-bold leading-snug sm:text-3xl">
          You do not need more IELTS tricks.
          <br />
          <span className="text-[#c9972c]">You need better English.</span>
        </p>
        <ul className="mt-8 space-y-4">
          {STEPS.map((line) => (
            <li key={line} className="flex gap-3 text-base leading-relaxed text-slate-200 sm:text-lg">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0d9488]" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-lg leading-relaxed text-slate-300">
          When your English is ready —{" "}
          <span className="font-semibold text-white">your IELTS score will follow.</span>
        </p>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <section
        className={`overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1b35] to-[#152a4d] px-6 py-5 text-white sm:px-8 ${className}`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c9972c]">
          The Speakify way
        </p>
        <p className="mt-2 text-base font-bold leading-snug sm:text-lg">
          You don&apos;t need more IELTS tricks — you need better English.
        </p>
        <p className="mt-2 text-sm text-slate-300">
          We show you where you are, where you need to be, and walk every step with you.
          When your English is ready, your IELTS score will follow.
        </p>
      </section>
    );
  }

  if (variant === "compact") {
    return (
      <blockquote
        className={`border-l-4 border-[#c9972c] bg-[#c9972c]/5 px-4 py-3 ${className}`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
          The Speakify way
        </p>
        <p className="mt-1 text-sm font-medium leading-relaxed text-[#0d1b35]">
          Better English first — your IELTS score will follow.
        </p>
      </blockquote>
    );
  }

  return (
    <section
      className={`rounded-2xl border border-[#c9972c]/30 bg-gradient-to-br from-[#0d1b35] to-[#152a4d] p-6 text-white sm:p-8 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-[#c9972c]">
        The Speakify way
      </p>
      <p className="mt-4 text-xl font-bold leading-snug sm:text-2xl">
        You do not need more IELTS tricks.
        <br />
        <span className="text-[#c9972c]">You need better English.</span>
      </p>
      <ul className="mt-6 space-y-3">
        {STEPS.map((line) => (
          <li key={line} className="flex gap-3 text-sm leading-relaxed text-slate-200">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0d9488]" />
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm leading-relaxed text-slate-300 sm:text-base">
        When your English is ready —{" "}
        <span className="font-semibold text-white">your IELTS score will follow.</span>
      </p>
    </section>
  );
}
