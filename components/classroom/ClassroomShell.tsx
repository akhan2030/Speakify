"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CLASSROOM_LEVELS } from "@/lib/classroom/levels";

export default function ClassroomShell({
  children,
  mode = "student",
  showLevelNav = false,
}: {
  children: React.ReactNode;
  mode?: "student" | "teacher" | "admin";
  /** Student layout usually leaves level badge to children; set true for level nav strip */
  showLevelNav?: boolean;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Speakify";

  const brandHref =
    mode === "admin"
      ? "/admin/classroom"
      : mode === "teacher"
        ? "/classroom-teacher"
        : "/classroom";

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f7f4ef]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href={brandHref} className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6a1f]">
              Speakify Global Language Center
            </p>
            <p className="truncate text-lg font-semibold tracking-tight text-slate-900">
              {mode === "admin"
                ? "Classroom Admin"
                : mode === "teacher"
                  ? "Teacher Classroom"
                  : "In-Person Classroom"}
            </p>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">{name}</span>
            {mode === "teacher" && (
              <Link
                href="/classroom"
                className="rounded-md px-2 py-1 text-slate-600 hover:bg-white"
              >
                Student view
              </Link>
            )}
            {mode === "admin" && (
              <Link
                href="/dashboard/admin"
                className="rounded-md px-2 py-1 text-slate-600 hover:bg-white"
              >
                LMS Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {mode === "student" && showLevelNav ? (
        <nav className="border-b border-slate-200 bg-white/70">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {CLASSROOM_LEVELS.map((level) => {
              const href = `/classroom/${encodeURIComponent(level.slug)}`;
              const active = pathname?.startsWith(href);
              return (
                <Link
                  key={level.code}
                  href={href}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {level.code}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
