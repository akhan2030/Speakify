"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { resolveIeltsProgramDisplay } from "@/lib/programs/ieltsProgramIdentity";
import { getInitials } from "@/components/StudentSidebar";

export type GeneralActivePage =
  | "dashboard"
  | "practice"
  | "writing"
  | "letter-practice"
  | "speaking"
  | "reading"
  | "listening"
  | "grammar"
  | "mock-exam"
  | "readiness"
  | "settings";

type SidebarBadges = {
  trackBadge: string;
  skillBands: {
    writing: number | null;
    speaking: number | null;
    reading: number | null;
    listening: number | null;
  };
};

type NavItem = {
  id: GeneralActivePage;
  label: string;
  href: string;
  icon: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const BASE = "/dashboard/ielts-general/student";

const NAV_GROUPS: NavGroup[] = [
  {
    label: "TODAY",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: BASE,
        icon: "🏠",
      },
      {
        id: "practice",
        label: "Daily Practice",
        href: `${BASE}/practice`,
        icon: "⚡",
      },
    ],
  },
  {
    label: "IELTS SKILLS",
    items: [
      {
        id: "writing",
        label: "Writing (Letter + Essay)",
        href: `${BASE}/writing`,
        icon: "✍",
      },
      {
        id: "letter-practice",
        label: "Letter Practice",
        href: `${BASE}/letter-practice`,
        icon: "✉",
      },
      {
        id: "speaking",
        label: "Speaking",
        href: `${BASE}/speaking`,
        icon: "🎤",
      },
      {
        id: "reading",
        label: "Reading",
        href: `${BASE}/reading`,
        icon: "📖",
      },
      {
        id: "listening",
        label: "Listening",
        href: `${BASE}/listening`,
        icon: "🎧",
      },
      {
        id: "grammar",
        label: "Grammar Builder",
        href: `${BASE}/grammar`,
        icon: "📚",
      },
    ],
  },
  {
    label: "ASSESSMENT",
    items: [
      {
        id: "mock-exam",
        label: "Mock Exams",
        href: `${BASE}/mock-exam`,
        icon: "📝",
      },
      {
        id: "readiness",
        label: "IELTS Readiness",
        href: `${BASE}/readiness`,
        icon: "📊",
      },
    ],
  },
];

const MOBILE_NAV: { id: GeneralActivePage; label: string; href: string; icon: string }[] = [
  { id: "dashboard", label: "Home", href: BASE, icon: "🏠" },
  { id: "writing", label: "Writing", href: `${BASE}/writing`, icon: "✍" },
  { id: "mock-exam", label: "Mock", href: `${BASE}/mock-exam`, icon: "📝" },
  { id: "readiness", label: "Progress", href: `${BASE}/readiness`, icon: "📊" },
  { id: "speaking", label: "Speaking", href: `${BASE}/speaking`, icon: "🎤" },
];

const ALL_ITEMS = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  { id: "settings" as const, label: "Settings", href: `${BASE}/settings`, icon: "⚙" },
];

function activeFromPath(pathname: string): GeneralActivePage {
  if (pathname === BASE) return "dashboard";
  const match = ALL_ITEMS.find(
    (item) => item.href !== BASE && pathname.startsWith(item.href)
  );
  return match?.id ?? "dashboard";
}

function formatBand(band: number | null | undefined): string {
  if (band == null || !Number.isFinite(band)) return "—";
  return band.toFixed(1);
}

function badgeForItem(item: NavItem, badges: SidebarBadges | null): string | undefined {
  if (!badges) return undefined;

  switch (item.id) {
    case "writing":
      return `Band: ${formatBand(badges.skillBands.writing)}`;
    case "speaking":
      return `Band: ${formatBand(badges.skillBands.speaking)}`;
    case "reading":
      return `Band: ${formatBand(badges.skillBands.reading)}`;
    case "listening":
      return `Band: ${formatBand(badges.skillBands.listening)}`;
    default:
      return undefined;
  }
}

function NavLink({
  item,
  isActive,
  badge,
}: {
  item: NavItem;
  isActive: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={item.href}
      className={`flex items-center justify-between gap-2 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors ${
        isActive
          ? "border-l-[#c9972c] bg-[#152a4d] font-semibold text-white"
          : "border-l-transparent text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="flex items-center gap-2 truncate">
        <span className="shrink-0">{item.icon}</span>
        <span className="truncate">{item.label}</span>
      </span>
      {badge ? (
        <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#c9972c]">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function GeneralSidebar({
  activePage,
}: {
  activePage?: GeneralActivePage;
}) {
  const pathname = usePathname();
  const current = activePage ?? activeFromPath(pathname);
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Student";
  const initials = getInitials(name);
  const [badges, setBadges] = useState<SidebarBadges | null>(null);
  const [trackName, setTrackName] = useState("Plus");

  const sessionUser = session?.user as
    | {
        programType?: string | null;
        enrolledPrograms?: unknown;
        programSelected?: string | null;
      }
    | undefined;

  const programDisplay = resolveIeltsProgramDisplay({
    programType: sessionUser?.programType,
    enrolledPrograms: sessionUser?.enrolledPrograms,
    programSelected: sessionUser?.programSelected,
    pathFallback: "ielts_general",
    trackName,
  });

  useEffect(() => {
    fetch("/api/ielts-general/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (!json.error && json.sidebar) {
          setBadges({
            trackBadge: json.sidebar.trackBadge,
            skillBands: json.sidebar.skillBands,
          });
          if (json.track?.name) setTrackName(json.track.name);
        }
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <>
      <aside className="sticky top-0 z-20 hidden h-screen w-[220px] shrink-0 flex-col bg-[#0d1b35] px-3 py-6 md:flex">
        <div className="flex flex-col items-center text-center">
          <div className="h-10 w-10 rounded-full bg-[#c9972c]" />
          <div className="mt-2 text-sm font-bold text-white">Speakify</div>
          <div className="px-1 text-[10px] leading-snug text-[#c9972c]">
            {programDisplay.programLine}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c9972c] text-sm font-bold text-[#0d1b35]">
            {initials}
          </div>
          <div className="mt-2 line-clamp-2 text-sm font-medium text-white">{name}</div>
          <div className="mt-1 rounded-full bg-[#c9972c]/20 px-2 py-0.5 text-[10px] font-semibold text-[#c9972c]">
            {programDisplay.trackBadge}
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-4 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.id}
                    item={item}
                    isActive={item.id === current}
                    badge={badgeForItem(item, badges)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
          <Link
            href={`${BASE}/settings`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              current === "settings"
                ? "border-l-2 border-l-[#c9972c] bg-[#152a4d] font-semibold text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>⚙</span> Settings
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-slate-200 bg-white md:hidden">
        {MOBILE_NAV.map((item) => {
          const isActive = item.id === current;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
                isActive ? "font-bold text-[#0d1b35]" : "text-slate-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {isActive ? (
                <span className="h-0.5 w-6 rounded-full bg-[#c9972c]" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
