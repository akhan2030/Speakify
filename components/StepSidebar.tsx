"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getInitials } from "@/components/StudentSidebar";
import { STEP_ROUTES } from "@/lib/step/paths";

export type StepActivePage =
  | "dashboard"
  | "weekly-plan"
  | "accelerator"
  | "reading"
  | "structure"
  | "listening"
  | "compositional"
  | "mini-mocks"
  | "mock-exam"
  | "progress"
  | "vocabulary"
  | "grammar"
  | "settings";

type NavItem = {
  id: StepActivePage;
  label: string;
  href: string;
  icon: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const BASE = STEP_ROUTES.home;

const NAV_GROUPS: NavGroup[] = [
  {
    label: "TODAY",
    items: [{ id: "dashboard", label: "Dashboard", href: BASE, icon: "🏠" }],
  },
  {
    label: "MY COURSE",
    items: [
      {
        id: "accelerator",
        label: "My Phase Journey",
        href: STEP_ROUTES.myJourney,
        icon: "🗺",
      },
      {
        id: "weekly-plan",
        label: "Weekly Plan",
        href: STEP_ROUTES.weeklyPlan,
        icon: "📅",
      },
    ],
  },
  {
    label: "STEP SECTIONS",
    items: [
      {
        id: "reading",
        label: "Reading",
        href: STEP_ROUTES.practice("reading"),
        icon: "📖",
      },
      {
        id: "structure",
        label: "Structure & Grammar",
        href: STEP_ROUTES.practice("structure"),
        icon: "✏️",
      },
      {
        id: "listening",
        label: "Listening",
        href: STEP_ROUTES.practice("listening"),
        icon: "🎧",
      },
      {
        id: "compositional",
        label: "Compositional",
        href: STEP_ROUTES.practice("compositional_analysis"),
        icon: "📋",
      },
    ],
  },
  {
    label: "ASSESSMENT",
    items: [
      {
        id: "mini-mocks",
        label: "Mini Mocks",
        href: STEP_ROUTES.miniMocks,
        icon: "⚡",
      },
      {
        id: "mock-exam",
        label: "Full Mock Exam",
        href: STEP_ROUTES.mockExam,
        icon: "📝",
      },
      {
        id: "progress",
        label: "My Progress",
        href: STEP_ROUTES.progress,
        icon: "📊",
      },
    ],
  },
  {
    label: "STUDY TOOLS",
    items: [
      {
        id: "vocabulary",
        label: "Vocabulary Builder",
        href: STEP_ROUTES.vocabulary,
        icon: "📚",
      },
      {
        id: "grammar",
        label: "Grammar Drills",
        href: STEP_ROUTES.grammarDrills,
        icon: "🔤",
      },
    ],
  },
];

const MOBILE_NAV = [
  { id: "dashboard" as const, label: "Home", href: BASE, icon: "🏠" },
  {
    id: "reading" as const,
    label: "Sections",
    href: STEP_ROUTES.practice("reading"),
    icon: "📖",
  },
  { id: "mini-mocks" as const, label: "Mini", href: STEP_ROUTES.miniMocks, icon: "⚡" },
  { id: "mock-exam" as const, label: "Mock", href: STEP_ROUTES.mockExam, icon: "📝" },
  { id: "progress" as const, label: "Progress", href: STEP_ROUTES.progress, icon: "📊" },
];

const ALL_ITEMS = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  { id: "settings" as const, label: "Settings", href: STEP_ROUTES.settings, icon: "⚙" },
];

function activeFromPath(pathname: string): StepActivePage {
  if (pathname === BASE) return "dashboard";
  const match = ALL_ITEMS.find(
    (item) => item.href !== BASE && pathname.startsWith(item.href)
  );
  return match?.id ?? "dashboard";
}

function NavLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors ${
        isActive
          ? "border-l-[#c9972c] bg-[#152a4d] font-semibold text-white"
          : "border-l-transparent text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="shrink-0">{item.icon}</span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export default function StepSidebar({ activePage }: { activePage?: StepActivePage }) {
  const pathname = usePathname();
  const current = activePage ?? activeFromPath(pathname);
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Student";
  const initials = getInitials(name);

  const [phaseLabel, setPhaseLabel] = useState("Phase 1");
  const [estimatedScore, setEstimatedScore] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/step/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        const phase = json.enrollment?.current_phase ?? 1;
        const phaseTitle =
          json.phases?.find((p: { phase: number }) => p.phase === phase)?.title ??
          `Phase ${phase}`;
        setPhaseLabel(`Phase ${phase}: ${phaseTitle}`);
        setEstimatedScore(json.enrollment?.estimated_score ?? null);
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <>
      <aside className="sticky top-0 z-20 hidden h-screen w-[220px] shrink-0 flex-col bg-[#0d1b35] px-3 py-6 md:flex">
        <div className="flex flex-col items-center text-center">
          <div className="h-10 w-10 rounded-full bg-[#c9972c]" />
          <div className="mt-2 text-sm font-bold text-white">Speakify</div>
          <div className="text-[10px] text-[#c9972c]">STEP Accelerator</div>
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c9972c] text-sm font-bold text-[#0d1b35]">
            {initials}
          </div>
          <div className="mt-2 line-clamp-2 text-sm font-medium text-white">{name}</div>
          <div className="mt-1 text-[10px] font-medium text-slate-400">{phaseLabel}</div>
          <div className="mt-1 rounded-full bg-[#c9972c]/20 px-2 py-0.5 text-[10px] font-semibold text-[#c9972c]">
            Est. {estimatedScore != null ? `${estimatedScore}/100` : "—"}
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
                  <NavLink key={item.id} item={item} isActive={item.id === current} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
          <Link
            href={STEP_ROUTES.settings}
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
