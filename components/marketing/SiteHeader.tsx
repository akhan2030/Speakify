"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NAV_DROPDOWNS } from "@/lib/courses/catalog";
import ProgramSignInLink from "@/components/marketing/ProgramSignInLink";

type NavCourse = {
  name: string;
  href: string;
  levelBadge: string;
};

function NavDropdown({
  label,
  courses,
}: {
  label: string;
  courses: NavCourse[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
        aria-expanded={open}
      >
        {label}
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-white/10 bg-[#0d1b35] py-2 shadow-xl">
          {courses.map((course) => (
            <Link
              key={course.href}
              href={course.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5"
            >
              <span>{course.name}</span>
              <span className="text-xs text-slate-400">{course.levelBadge}</span>
            </Link>
          ))}
          <div className="mt-1 border-t border-white/10 px-2 pt-2">
            <Link
              href="/courses"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#c9972c] hover:bg-white/5"
            >
              View All Programs
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-white/10 bg-[#0d1b35]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/courses" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9972c]" />
          <span className="text-lg font-extrabold text-white">Speakify</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_DROPDOWNS.map((group) => (
            <NavDropdown key={group.id} label={group.label} courses={group.courses} />
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ProgramSignInLink className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 hover:text-white" />
          <Link
            href="/register"
            className="rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-semibold text-[#0d1b35] hover:opacity-95"
          >
            Register
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-white lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 px-4 py-4 lg:hidden">
          {NAV_DROPDOWNS.map((group) => (
            <div key={group.id} className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#c9972c]">
                {group.label}
              </p>
              <div className="mt-2 space-y-1">
                {group.courses.map((course) => (
                  <Link
                    key={course.href}
                    href={course.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                  >
                    {course.name}
                  </Link>
                ))}
                <Link
                  href="/courses"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#c9972c]"
                >
                  View All Programs
                </Link>
              </div>
            </div>
          ))}
          <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
            <ProgramSignInLink
              onClick={() => setMobileOpen(false)}
              className="flex-1 rounded-lg border border-white/20 py-2 text-center text-sm text-white"
            />
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="flex-1 rounded-lg bg-[#c9972c] py-2 text-center text-sm font-semibold text-[#0d1b35]"
            >
              Register
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
