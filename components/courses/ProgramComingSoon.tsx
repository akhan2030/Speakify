import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import { speakifyFraunces, speakifyInter } from "@/lib/brand/fonts";
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
        className={`${speakifyInter.variable} ${speakifyFraunces.variable} ${speakifyInter.className} bg-speakify-paper`}
      >
        <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-speakify-gold">
            Coming soon
          </p>
          <h1
            className={`${speakifyFraunces.className} mt-4 text-3xl font-semibold text-speakify-navy`}
          >
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-speakify-muted">
            {body}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/courses" className="btn-speakify-gold px-6 py-3 text-sm">
              Browse courses
            </Link>
            <Link href="/login" className="btn-speakify-navy-outline px-6 py-3 text-sm">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
