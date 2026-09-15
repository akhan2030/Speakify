"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { getPhaseDefinition } from "@/lib/step/phases";
import { STEP_ROUTES } from "@/lib/step/paths";

export type StepActivePage =
  | "dashboard"
  | "exam-brief"
  | "weekly-plan"
  | "accelerator"
  | "reading"
  | "structure"
  | "listening"
  | "compositional"
  | "mini-mocks"
  | "exit-test"
  | "mock-exam"
  | "progress"
  | "vocabulary"
  | "grammar"
  | "live-classes"
  | "settings";

type NavItem = {
  id: StepActivePage;
  label: string;
  href: string;
  icon: string;
  order?: number;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

type ExitTestBadge = {
  text: string;
  className: string;
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
        id: "exam-brief",
        label: "Exam brief",
        href: STEP_ROUTES.examBrief,
        icon: "📘",
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
    label: "Test sections",
    items: [
      {
        id: "reading",
        label: "Reading",
        href: STEP_ROUTES.practice("reading"),
        icon: "📖",
        order: 1,
      },
      {
        id: "structure",
        label: "Structure",
        href: STEP_ROUTES.practice("structure"),
        icon: "✏️",
        order: 2,
      },
      {
        id: "listening",
        label: "Listening",
        href: STEP_ROUTES.practice("listening"),
        icon: "🎧",
        order: 3,
      },
      {
        id: "compositional",
        label: "Compositional",
        href: STEP_ROUTES.practice("compositional_analysis"),
        icon: "📋",
        order: 4,
      },
    ],
  },
  {
    label: "ASSESSMENT",
    items: [
      {
        id: "mini-mocks",
        label: "Mini Mocks",
        href: "/dashboard/step/student/mini-mock",
        icon: "⚡",
      },
      {
        id: "exit-test",
        label: "Phase Exit Test",
        href: STEP_ROUTES.exitTest,
        icon: "📋",
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
        id: "live-classes",
        label: "Live classes",
        href: STEP_ROUTES.liveClasses,
        icon: "🎥",
      },
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
  { id: "mini-mocks" as const, label: "Mini", href: "/dashboard/step/student/mini-mock", icon: "⚡" },
  { id: "mock-exam" as const, label: "Mock", href: STEP_ROUTES.mockExam, icon: "📝" },
  { id: "progress" as const, label: "Progress", href: STEP_ROUTES.progress, icon: "📊" },
];

const ALL_ITEMS = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  { id: "settings" as const, label: "Settings", href: STEP_ROUTES.settings, icon: "⚙" },
];

function activeFromPath(pathname: string): StepActivePage {
  if (pathname === BASE) return "dashboard";
  if (pathname.startsWith(STEP_ROUTES.exitTest)) return "exit-test";
  if (pathname.startsWith("/dashboard/step/student/mini-mock")) return "mini-mocks";
  const match = ALL_ITEMS.find(
    (item) => item.href !== BASE && pathname.startsWith(item.href)
  );
  return match?.id ?? "dashboard";
}

function NavLink({
  item,
  isActive,
  badge,
}: {
  item: NavItem;
  isActive: boolean;
  badge?: ExitTestBadge;
}) {
  return (
    <Link
      href={item.href}
      className={`side-item${isActive ? " active" : ""}`}
    >
      <span className="n">
        {item.order != null ? (
          <span className={`order-badge skill-${item.id}`}>{item.order}</span>
        ) : null}
        <span className="shrink-0">{item.icon}</span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </span>
      {badge ? (
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${badge.className}`}
        >
          {badge.text}
        </span>
      ) : null}
    </Link>
  );
}

export default function StepSidebar({ activePage }: { activePage?: StepActivePage }) {
  const pathname = usePathname();
  const current = activePage ?? activeFromPath(pathname);

  const [phaseLabel, setPhaseLabel] = useState("Phase 1 · Foundation");
  const [estimatedScore, setEstimatedScore] = useState<number | null>(null);
  const [exitTestBadge, setExitTestBadge] = useState<ExitTestBadge | null>(null);

  useEffect(() => {
    fetch("/api/step/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        const phase = json.phaseProgress?.currentPhase ?? json.enrollment?.current_phase ?? 1;
        const title =
          getPhaseDefinition(phase)?.title ??
          json.phaseProgress?.phases?.find((p: { phase: number }) => p.phase === phase)
            ?.title ??
          "Foundation";
        setPhaseLabel(`Phase ${phase} · ${title}`);
        setEstimatedScore(json.enrollment?.estimated_score ?? null);
      })
      .catch(() => {});

    fetch("/api/step/exit-test/status")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        if (json.ready) {
          setExitTestBadge({
            text: "Ready",
            className: "bg-emerald-500/20 text-emerald-300",
          });
        } else if (json.cooldownDays > 0) {
          setExitTestBadge({
            text: `${json.cooldownDays}d`,
            className: "bg-amber-500/20 text-amber-300",
          });
        } else {
          setExitTestBadge({
            text: `Wk ${json.week}/${json.weeksInPhase}`,
            className: "bg-white/10 text-slate-400",
          });
        }
      })
      .catch(() => {});
  }, [pathname]);

  const scoreDisplay =
    estimatedScore == null || estimatedScore === 0
      ? { text: "Est. —/100", className: "text-slate-500 bg-slate-500/10" }
      : { text: `Est. ${estimatedScore}/100`, className: "text-speakify-gold bg-speakify-gold/20" };

  return (
    <>
      <aside className="side sticky top-0 z-20 hidden h-screen w-[240px] shrink-0 flex-col md:flex">
        <Link href={BASE} className="logo">
          Speakify
        </Link>
        <div className="sub">
          STEP Accelerator · {phaseLabel}
          {scoreDisplay.text ? ` · ${scoreDisplay.text}` : ""}
        </div>

        <nav className="flex-1 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="side-group">
              <div className="side-label">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.id}
                  item={item}
                  isActive={item.id === current}
                  badge={item.id === "exit-test" ? exitTestBadge ?? undefined : undefined}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="side-foot">
          <Link
            href={STEP_ROUTES.settings}
            className={`side-item${current === "settings" ? " active" : ""}`}
          >
            <span className="n">⚙ Settings</span>
          </Link>
          <button type="button" className="side-item" onClick={() => signOut({ callbackUrl: "/login" })}>
            <span className="n">🚪 Logout</span>
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
                isActive ? "font-bold text-speakify-navy" : "text-slate-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {isActive ? (
                <span className="h-0.5 w-6 rounded-full bg-speakify-gold" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
