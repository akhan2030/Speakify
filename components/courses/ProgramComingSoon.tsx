import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";

export default function ProgramComingSoon({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <MarketingShell>
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-[#c9972c]">
          Coming soon
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[#0d1b35]">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/courses"
            className="rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-bold text-white hover:opacity-95"
          >
            Browse courses
          </Link>
          <Link
            href="/login"
            className="rounded-xl border-2 border-[#0d1b35] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}
