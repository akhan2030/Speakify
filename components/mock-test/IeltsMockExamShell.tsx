"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { IELTS_MOCK_LOBBY_PATH } from "@/lib/mock-test/ieltsMockRoutes";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

export default function IeltsMockExamShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const inActiveExam = pathname?.includes("/mock-exam/exam");

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <header
        className="border-b border-white/10 px-4 py-3 sm:px-6"
        style={{ backgroundColor: NAVY }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <Link href="/courses/mock-exams" className="text-lg font-bold text-white hover:opacity-90">
              Speakify
            </Link>
            {!inActiveExam ? (
              <p className="mt-0.5 truncate text-xs font-medium uppercase tracking-wide" style={{ color: GOLD }}>
                IELTS Academic · Full mock exams
              </p>
            ) : (
              <p className="mt-0.5 truncate text-xs font-medium text-slate-300">
                Mock exam in progress
              </p>
            )}
          </div>
          <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
            {!inActiveExam ? (
              <>
                <Link
                  href={IELTS_MOCK_LOBBY_PATH}
                  className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-white/10 sm:inline-flex"
                >
                  My mocks
                </Link>
                <Link
                  href="/courses/mock-exams"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-white/10"
                >
                  Browse mocks
                </Link>
              </>
            ) : null}
            {session?.user ? (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/courses/mock-exams" })}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      {!inActiveExam ? (
        <footer className="border-t border-slate-200 bg-white px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm sm:flex-row">
            <p className="text-slate-500">© {new Date().getFullYear()} Speakify · Global Language Center</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/courses" className="font-medium text-[#0d1b35] hover:text-[#c9972c]">
                All courses
              </Link>
              <Link href="/courses/mock-exams" className="font-medium hover:underline" style={{ color: TEAL }}>
                IELTS Academic mock exams
              </Link>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
