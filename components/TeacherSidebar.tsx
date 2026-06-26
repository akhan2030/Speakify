"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getInitials, PageSpinner } from "@/components/StudentSidebar";
import { normalizeRole } from "@/lib/roles";

export { PageSpinner };

export type TeacherActivePage =
  | "dashboard"
  | "students"
  | "homework"
  | "ai-practice"
  | "qa"
  | "reports"
  | "settings";

const NAV_ITEMS: {
  id: TeacherActivePage;
  label: string;
  href: string;
  badge?: "urgent";
}[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard/teacher" },
  { id: "students", label: "My Students", href: "/dashboard/teacher/students" },
  {
    id: "ai-practice",
    label: "AI Practice Bank",
    href: "/dashboard/teacher/ai-practice",
  },
  {
    id: "qa",
    label: "Trust & QA",
    href: "/dashboard/teacher/qa",
    badge: "urgent",
  },
  { id: "reports", label: "Progress Reports", href: "/dashboard/teacher/reports" },
  { id: "settings", label: "Settings", href: "/dashboard/teacher/settings" },
];

export default function TeacherSidebar({
  activePage,
}: {
  activePage: TeacherActivePage;
}) {
  const { data: session } = useSession();
  const teacherName = session?.user?.name ?? "Teacher";
  const initials = getInitials(teacherName);
  const [studentAccess, setStudentAccess] = useState(false);
  const [urgentQaCount, setUrgentQaCount] = useState(0);

  useEffect(() => {
    if (normalizeRole(session?.user?.role) !== "teacher") return;
    fetch("/api/teacher/me")
      .then((r) => r.json())
      .then((d) => setStudentAccess(Boolean(d.studentAccess)))
      .catch(() => setStudentAccess(false));
  }, [session?.user?.role]);

  useEffect(() => {
    if (normalizeRole(session?.user?.role) !== "teacher") return;
    fetch("/api/teacher/qa", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUrgentQaCount(Number(d.stats?.urgentCount ?? 0)))
      .catch(() => setUrgentQaCount(0));
  }, [session?.user?.role]);

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[200px] flex-col bg-[#0d1b35] px-4 py-6">
      <div className="flex flex-col items-center text-center">
        <div className="h-10 w-10 rounded-full bg-[#c9972c]" />
        <div className="mt-2 text-sm font-bold text-white">Speakify</div>
        <div className="text-[10px] text-[#c9972c]">Global Language Center</div>
      </div>

      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activePage;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-[#c9972c]/20 font-semibold text-[#c9972c]"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              {item.badge === "urgent" && urgentQaCount > 0 ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#dc2626] px-1.5 text-[10px] font-bold text-white">
                  {urgentQaCount > 99 ? "99+" : urgentQaCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c9972c] text-xs font-bold text-[#0d1b35]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{teacherName}</p>
            <p className="text-[10px] text-slate-400">IELTS Teacher</p>
          </div>
        </div>

        {studentAccess ? (
          <Link
            href="/dashboard/student"
            className="mt-3 block w-full rounded-lg border border-[#0d9488]/50 px-3 py-2 text-center text-[11px] font-semibold text-[#0d9488] transition-colors hover:bg-[#0d9488]/10"
          >
            Switch to Student View
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 w-full rounded-lg border border-[#c9972c]/40 bg-[#c9972c]/10 px-3 py-2 text-center text-[11px] font-semibold text-[#c9972c] transition-colors hover:bg-[#c9972c]/20"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
