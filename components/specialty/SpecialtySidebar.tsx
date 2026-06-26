"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { getInitials } from "@/components/StudentSidebar";
import {
  getSpecialtyProgram,
  type SpecialtyProgramId,
} from "@/lib/specialtyPrograms";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
};

function navItems(base: string): NavItem[] {
  return [
    { id: "home", label: "Dashboard", href: base, icon: "🏠" },
    { id: "modules", label: "Modules", href: `${base}/modules`, icon: "📚" },
    { id: "weekly-plan", label: "Weekly Plan", href: `${base}/weekly-plan`, icon: "📅" },
    { id: "practice", label: "Practice", href: `${base}/practice`, icon: "⚡" },
    { id: "progress", label: "My Progress", href: `${base}/progress`, icon: "📊" },
    { id: "settings", label: "Settings", href: `${base}/settings`, icon: "⚙️" },
  ];
}

function activeId(pathname: string, base: string, items: NavItem[]): string {
  if (pathname === base) return "home";
  const match = items.find(
    (item) => item.id !== "home" && pathname.startsWith(item.href)
  );
  return match?.id ?? "home";
}

export default function SpecialtySidebar({ programId }: { programId: SpecialtyProgramId }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const program = getSpecialtyProgram(programId);
  const base = program.dashboardBase;
  const items = navItems(base);
  const active = activeId(pathname ?? "", base, items);
  const name = session?.user?.name ?? "Student";
  const email = session?.user?.email ?? "";

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg text-white"
              style={{ backgroundColor: program.accent }}
            >
              {programId === "kids_english" ? "🌟" : "S"}
            </div>
            <div>
              <p className="text-sm font-bold text-[#0d1b35]">{program.name}</p>
              <p className="text-xs text-slate-500">{program.tagline}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            My Programme
          </p>
          <ul className="mt-2 space-y-1">
            {items.map((item) => {
              const isActive = item.id === active;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#0d1b35]"
                    }`}
                    style={isActive ? { backgroundColor: program.accent } : undefined}
                  >
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: program.accent }}
            >
              {getInitials(name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0d1b35]">{name}</p>
              <p className="truncate text-xs text-slate-500">{email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: `/login?callbackUrl=${encodeURIComponent(base)}` })}
            className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white md:hidden">
        {items.slice(0, 5).map((item) => {
          const isActive = item.id === active;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                isActive ? "text-[#0d1b35]" : "text-slate-500"
              }`}
              style={isActive ? { color: program.accent } : undefined}
            >
              <span className="text-base">{item.icon}</span>
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
