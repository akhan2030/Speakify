"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { resolveIeltsProgramDisplay } from "@/lib/programs/ieltsProgramIdentity";
import { PROGRAM_JOURNEYS } from "@/lib/dashboards/programJourneys";

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
  | "live-classes"
  | "progress"
  | "settings";

type SidebarBadges = {
  trackBadge: string;
  readinessPercent?: number;
  mockReady?: string;
  newAchievements?: number;
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
  order?: number;
};

const BASE = "/dashboard/ielts-general/student";
const PROGRESS_HREF = `${BASE}/progress`;
const JOURNEY = PROGRAM_JOURNEYS.ielts_general;

const EXAM_SKILLS: NavItem[] = JOURNEY.steps.map((step, index) => ({
  id: step.key as GeneralActivePage,
  label: step.label,
  href: `${BASE}/${step.key}`,
  icon: step.icon,
  order: index + 1,
}));

const PRACTICE_TOOLS: NavItem[] = [
  { id: "letter-practice", label: "Letter practice", href: `${BASE}/letter-practice`, icon: "✉" },
  { id: "live-classes", label: "Live classes", href: `${BASE}/live-classes`, icon: "🎥" },
  { id: "practice", label: "Daily Practice", href: `${BASE}/practice`, icon: "⚡" },
  { id: "grammar", label: "Grammar", href: `${BASE}/grammar`, icon: "📚" },
];

const ALL_ITEMS: NavItem[] = [
  ...EXAM_SKILLS,
  ...PRACTICE_TOOLS,
  { id: "mock-exam", label: "Full Mock", href: `${BASE}/mock-exam`, icon: "📋" },
  { id: "progress", label: "My Progress", href: PROGRESS_HREF, icon: "📊" },
  { id: "dashboard", label: "Dashboard", href: BASE, icon: "🏠" },
  { id: "settings", label: "Settings", href: `${BASE}/settings`, icon: "⚙" },
];

const MOBILE_NAV: NavItem[] = [
  { id: "dashboard", label: "Home", href: BASE, icon: "🏠" },
  { id: "listening", label: "Skills", href: `${BASE}/listening`, icon: "🎧" },
  { id: "practice", label: "Practice", href: `${BASE}/practice`, icon: "⚡" },
  { id: "mock-exam", label: "Mock", href: `${BASE}/mock-exam`, icon: "📋" },
  { id: "progress", label: "Progress", href: PROGRESS_HREF, icon: "📊" },
];

function activeFromPath(pathname: string): GeneralActivePage {
  if (pathname.startsWith(PROGRESS_HREF) || pathname.startsWith(`${BASE}/readiness`)) {
    return "progress";
  }
  if (pathname === BASE) return "dashboard";
  const match = [...ALL_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => item.href !== BASE && pathname.startsWith(item.href));
  return match?.id ?? "dashboard";
}

function formatBand(band: number | null | undefined): string {
  if (band == null || !Number.isFinite(band)) return "—";
  return band.toFixed(1);
}

export default function GeneralSidebar({
  activePage,
}: {
  activePage?: GeneralActivePage;
}) {
  const pathname = usePathname();
  const current = activePage ?? activeFromPath(pathname);
  const { data: session } = useSession();
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
            trackBadge: json.sidebar.trackBadge ?? "",
            skillBands: json.sidebar.skillBands,
            readinessPercent: json.exam?.examReadinessPercent ?? json.sidebar.readinessPercent,
            mockReady: json.sidebar.mockReady,
            newAchievements: json.sidebar.newAchievements,
          });
          if (json.track?.name) setTrackName(json.track.name);
        }
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <>
      <aside className="side sticky top-0 z-20 hidden h-screen w-[240px] shrink-0 flex-col md:flex">
        <Link href={BASE} className="logo">
          Speakify
        </Link>
        <div className="sub">
          {programDisplay.programLine} · {programDisplay.trackBadge}
        </div>

        <nav className="flex-1 overflow-y-auto">
          <div className="side-group">
            <div className="side-label">{JOURNEY.sidebarGroup}</div>
            {EXAM_SKILLS.map((item) => {
              const isActive = item.id === current;
              const band = badges?.skillBands?.[item.id as keyof SidebarBadges["skillBands"]];
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`side-item${isActive ? " active" : ""}`}
                >
                  <span className="n">
                    <span className={`order-badge skill-${item.id}`}>{item.order}</span>
                    {item.icon} {item.label}
                  </span>
                  <span className="score-chip">{formatBand(band)}</span>
                </Link>
              );
            })}
          </div>

          <div className="side-group">
            <div className="side-label">Practice tools</div>
            {PRACTICE_TOOLS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`side-item${item.id === current ? " active" : ""}`}
              >
                <span className="n">
                  {item.icon} {item.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="side-group">
            <div className="side-label">Mock exams</div>
            <Link
              href={`${BASE}/mock-exam`}
              className={`side-item${current === "mock-exam" ? " active" : ""}`}
            >
              <span className="n">📋 Full Mock</span>
              {badges?.mockReady ? <span className="score-chip">{badges.mockReady}</span> : null}
            </Link>
          </div>
        </nav>

        <div className="side-foot">
          <Link href={PROGRESS_HREF} className={`side-item${current === "progress" ? " active" : ""}`}>
            <span className="n">📊 My Progress</span>
            {badges?.readinessPercent != null ? (
              <span className="score-chip">{badges.readinessPercent}%</span>
            ) : null}
          </Link>
          <Link
            href={`${BASE}/settings`}
            className={`side-item${current === "settings" ? " active" : ""}`}
          >
            <span className="n">⚙ Settings</span>
          </Link>
          <button type="button" className="side-item" onClick={() => signOut({ callbackUrl: "/login" })}>
            <span className="n">🚪 Logout</span>
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-speakify-line bg-white md:hidden">
        {MOBILE_NAV.map((item) => {
          const isActive = item.id === current;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
                isActive ? "font-bold text-speakify-navy" : "text-speakify-muted"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {isActive ? <span className="h-0.5 w-6 rounded-full bg-speakify-gold" /> : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
