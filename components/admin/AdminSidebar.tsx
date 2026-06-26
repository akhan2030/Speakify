"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { getInitials, PageSpinner } from "@/components/StudentSidebar";
import { ADMIN_NAV_ITEMS, type AdminActivePage } from "@/lib/adminNav";

export { PageSpinner };

export default function AdminSidebar({ activePage }: { activePage: AdminActivePage }) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Admin";
  const email = session?.user?.email ?? "";
  const initials = getInitials(name);

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[240px] flex-col border-r border-white/10 bg-[#0d1b35]">
      <div className="border-b border-white/10 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9972c] text-sm font-bold text-[#0d1b35]">
            S
          </div>
          <div>
            <p className="text-sm font-bold text-white">Speakify</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#c9972c]">
              Admin Console
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Management
        </p>
        <ul className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = item.id === activePage;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    isActive
                      ? "bg-[#c9972c]/15 text-[#c9972c]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="mt-0.5 text-base leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="block text-[11px] text-slate-500">{item.description}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c9972c] text-xs font-bold text-[#0d1b35]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-[11px] text-slate-400">{email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 w-full rounded-lg border border-white/15 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
