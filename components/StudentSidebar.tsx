"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { isProgramStudentPath } from "@/lib/programType";
import { normalizeRole } from "@/lib/roles";

export type ActivePage =
  | "dashboard"
  | "course"
  | "accelerator"
  | "writing"
  | "speaking"
  | "reading"
  | "listening"
  | "vocabulary"
  | "grammar"
  | "practice"
  | "progress"
  | "study-plan"
  | "settings";

const NAV_ITEMS: {
  id: ActivePage;
  label: string;
  href: string;
  badge?: string;
}[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard/student" },
  { id: "course", label: "My Course", href: "/dashboard/student/pathway" },
  { id: "accelerator", label: "IELTS Accelerator", href: "/dashboard/student/accelerator" },
  { id: "writing", label: "Writing", href: "/dashboard/student/writing" },
  { id: "speaking", label: "Speaking", href: "/dashboard/student/speaking" },
  { id: "reading", label: "Reading", href: "/dashboard/student/reading" },
  { id: "listening", label: "Listening", href: "/dashboard/student/listening" },
  { id: "vocabulary", label: "Vocabulary", href: "/dashboard/student/vocabulary" },
  { id: "grammar", label: "Grammar", href: "/dashboard/student/grammar" },
  {
    id: "practice",
    label: "Daily Practice",
    href: "/dashboard/student/practice",
    badge: "NEW",
  },
  { id: "progress", label: "My Progress", href: "/dashboard/student/progress" },
  { id: "study-plan", label: "Study Plan", href: "/dashboard/student/study-plan" },
  { id: "settings", label: "Settings", href: "/dashboard/student/settings" },
];

export function getInitials(name: string | null | undefined) {
  if (!name?.trim()) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1b35]">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
    </div>
  );
}

export function getRoleLabel(role: unknown) {
  return normalizeRole(role) === "teacher" ? "IELTS Teacher" : "IELTS Student";
}

export default function StudentSidebar({
  activePage,
}: {
  activePage: ActivePage;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  if (isProgramStudentPath(pathname)) {
    return null;
  }
  const studentName = session?.user?.name ?? "Student";
  const initials = getInitials(studentName);
  const roleLabel = getRoleLabel((session?.user as { role?: string })?.role);

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[200px] flex-col bg-[#0d1b35] px-4 py-6">
      <div className="flex flex-col items-center text-center">
        <div className="h-10 w-10 rounded-full bg-[#c9972c]" />
        <div className="mt-2 text-sm font-bold text-white">Speakify</div>
        <div className="text-[10px] text-[#c9972c]">Global Language Center</div>
      </div>

      <div className="mt-8 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c9972c] text-sm font-bold text-[#0d1b35]">
          {initials}
        </div>
        <div className="mt-2 line-clamp-2 text-sm font-medium text-white">
          {studentName}
        </div>
        <div className="text-xs text-slate-400">{roleLabel}</div>
      </div>

      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activePage;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-[#c9972c]/20 font-semibold text-[#c9972c]"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span className="rounded bg-[#c9972c] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0d1b35]">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-lg border border-[#c9972c] px-3 py-2 text-center text-[11px] text-[#c9972c]">
        Go Premium — Unlock all lessons
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-lg border border-[#c9972c]/40 bg-[#c9972c]/10 px-3 py-2 text-center text-[11px] font-semibold text-[#c9972c] transition-colors hover:bg-[#c9972c]/20"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
