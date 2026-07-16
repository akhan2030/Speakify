import Link from "next/link";
import SiteHeader from "@/components/marketing/SiteHeader";
import ProgramSignInLink from "@/components/marketing/ProgramSignInLink";
import { MarketingLocaleProvider } from "@/components/marketing/MarketingLocale";

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <MarketingLocaleProvider>
      <div className="flex min-h-screen flex-col bg-[#f8fafc]">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Speakify · Global Language Center
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link href="/courses" className="font-medium text-[#0d1b35] hover:text-[#c9972c]">
                All Courses
              </Link>
              <Link href="/placement-test" className="text-slate-500 hover:text-[#0d1b35]">
                Placement Test
              </Link>
              <ProgramSignInLink className="text-slate-500 hover:text-[#0d1b35]" />
            </div>
          </div>
        </footer>
      </div>
    </MarketingLocaleProvider>
  );
}
