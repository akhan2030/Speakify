import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import { speakifyFraunces, speakifyInter } from "@/lib/brand/fonts";
import { SPEAKIFY_COLOR, SPEAKIFY_RADIUS } from "@/lib/brand/tokens";
import "@/lib/brand/speakify-tokens.css";

export default function ProgramComingSoon({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <MarketingShell>
      <div
        className={`${speakifyInter.variable} ${speakifyFraunces.variable} ${speakifyInter.className}`}
        style={{ background: SPEAKIFY_COLOR.paper }}
      >
        <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
          <p
            className="text-sm font-semibold uppercase tracking-[0.14em]"
            style={{ color: SPEAKIFY_COLOR.gold }}
          >
            Coming soon
          </p>
          <h1
            className={`${speakifyFraunces.className} mt-4 text-3xl font-semibold`}
            style={{ color: SPEAKIFY_COLOR.navy900 }}
          >
            {title}
          </h1>
          <p
            className="mt-4 text-base leading-relaxed"
            style={{ color: SPEAKIFY_COLOR.inkSoft }}
          >
            {body}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/courses"
              className="px-6 py-3 text-sm font-semibold"
              style={{
                background: SPEAKIFY_COLOR.gold,
                color: SPEAKIFY_COLOR.navy900,
                borderRadius: SPEAKIFY_RADIUS.button,
                boxShadow: "none",
              }}
            >
              Browse courses
            </Link>
            <Link
              href="/login"
              className="border px-6 py-3 text-sm font-semibold"
              style={{
                borderColor: SPEAKIFY_COLOR.navy900,
                color: SPEAKIFY_COLOR.navy900,
                borderRadius: SPEAKIFY_RADIUS.button,
                background: SPEAKIFY_COLOR.card,
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
