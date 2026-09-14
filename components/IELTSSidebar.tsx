"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { resolveIeltsProgramDisplay } from "@/lib/programs/ieltsProgramIdentity";
import {
  isToeflEnrolment,
  PROGRAM_JOURNEYS,
} from "@/lib/dashboards/programJourneys";

export type IeltsActivePage =
  | "dashboard"
  | "today"
  | "progress"
  | "writing"
  | "speaking"
  | "speaking-history"
  | "reading"
  | "listening"
  | "practice"
  | "vocabulary"
  | "grammar"
  | "mock-exam"
  | "live-classes"
  | "settings";

type SidebarBadges = {
  skillBands: {
    writing: number | null;
    speaking: number | null;
    reading: number | null;
    listening: number | null;
  };
  nextMockNumber?: number;
};

type NavItem = {
  id: IeltsActivePage;
  label: string;
  href: string;
  icon: string;
  order?: number;
};

const PROGRESS_HREF = "/dashboard/ielts/student/progress";
const SPEAKING_HISTORY_HREF = "/dashboard/ielts/student/speaking/history";

const IELTS_EXAM_SKILLS: NavItem[] = PROGRAM_JOURNEYS.ielts_academic.steps.map((step, index) => ({
  id: step.key as IeltsActivePage,
  label: step.label,
  href: `/dashboard/ielts/student/${step.key}`,
  icon: step.icon,
  order: index + 1,
}));

const TOEFL_EXAM_SKILLS: NavItem[] = PROGRAM_JOURNEYS.toefl.steps.map((step, index) => ({
  id: step.key as IeltsActivePage,
  label: step.label,
  href: `/dashboard/ielts/student/${step.key}`,
  icon: step.icon,
  order: index + 1,
}));

const PRACTICE_TOOLS: NavItem[] = [
  { id: "practice", label: "Daily Practice", href: "/dashboard/ielts/student/practice", icon: "⚡" },
  { id: "live-classes", label: "Live classes", href: "/dashboard/ielts/student/live-classes", icon: "🎥" },
  { id: "vocabulary", label: "Vocabulary", href: "/dashboard/ielts/student/vocabulary", icon: "🔤" },
  { id: "grammar", label: "Grammar", href: "/dashboard/ielts/student/grammar", icon: "📝" },
];

const LEGACY_PROGRESS_PREFIXES = [
  "/dashboard/ielts/student/accelerator",
  "/dashboard/ielts/student/weekly-plan",
  "/dashboard/ielts/student/readiness",
  "/dashboard/ielts/student/history",
  "/dashboard/ielts/student/achievements",
];

const ALL_ITEMS: NavItem[] = [
  ...IELTS_EXAM_SKILLS,
  ...PRACTICE_TOOLS,
  { id: "mock-exam", label: "Full Mock", href: "/dashboard/ielts/student/mock-exam", icon: "📋" },
  { id: "progress", label: "My Progress", href: PROGRESS_HREF, icon: "📊" },
  { id: "speaking-history", label: "Session history", href: SPEAKING_HISTORY_HREF, icon: "📋" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard/ielts/student", icon: "🏠" },
  { id: "today", label: "Today", href: "/dashboard/ielts/student/today", icon: "📋" },
  { id: "settings", label: "Settings", href: "/dashboard/ielts/student/settings", icon: "⚙" },
];

const MOBILE_NAV: { id: IeltsActivePage; label: string; href: string; icon: string }[] = [
  { id: "dashboard", label: "Home", href: "/dashboard/ielts/student", icon: "🏠" },
  { id: "listening", label: "Skills", href: "/dashboard/ielts/student/listening", icon: "🎧" },
  { id: "practice", label: "Practice", href: "/dashboard/ielts/student/practice", icon: "⚡" },
  { id: "mock-exam", label: "Mock", href: "/dashboard/ielts/student/mock-exam", icon: "📋" },
  { id: "progress", label: "Progress", href: PROGRESS_HREF, icon: "📊" },
];

function activeFromPath(pathname: string): IeltsActivePage {
  if (pathname.startsWith(PROGRESS_HREF)) return "progress";
  if (LEGACY_PROGRESS_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!pathname.includes("/accelerator/")) return "progress";
  }
  if (pathname === "/dashboard/ielts/student") return "dashboard";
  const match = [...ALL_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => item.href !== "/dashboard/ielts/student" && pathname.startsWith(item.href));
  return match?.id ?? "dashboard";
}

function formatBand(band: number | null | undefined): string {
  if (band == null || !Number.isFinite(band)) return "—";
  return band.toFixed(1);
}

export default function IELTSSidebar({
  activePage,
}: {
  activePage?: IeltsActivePage;
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
    pathFallback: "ielts",
    trackName,
  });

  const toefl = isToeflEnrolment(sessionUser);
  const examSkills = toefl ? TOEFL_EXAM_SKILLS : IELTS_EXAM_SKILLS;
  const journey = toefl ? PROGRAM_JOURNEYS.toefl : PROGRAM_JOURNEYS.ielts_academic;

  const variantLabel = toefl
    ? "TOEFL iBT"
    : programDisplay.variant === "ielts_general"
      ? "IELTS General"
      : "IELTS Academic";

  useEffect(() => {
    fetch("/api/student/ielts-dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (!json.error && json.sidebar) {
          setBadges(json.sidebar);
          if (json.track?.name) setTrackName(json.track.name);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const mockNumber = badges?.nextMockNumber ?? 1;

  return (
    <>
      <aside className="side sticky top-0 z-20 hidden h-screen w-[240px] shrink-0 flex-col md:flex">
        <Link href="/dashboard/ielts/student" className="logo">
          Speakify
        </Link>
        <div className="sub">
          {variantLabel} · {trackName} Track
        </div>

        <nav className="flex-1 overflow-y-auto">
          <div className="side-group">
            <div className="side-label">{journey.sidebarGroup}</div>
            {examSkills.map((item) => {
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
              href="/dashboard/ielts/student/mock-exam"
              className={`side-item${current === "mock-exam" ? " active" : ""}`}
            >
              <span className="n">📋 Full Mock #{mockNumber}</span>
            </Link>
          </div>
        </nav>

        <div className="side-foot">
          <Link
            href={PROGRESS_HREF}
            className={`side-item${current === "progress" ? " active" : ""}`}
          >
            <span className="n">📊 My Progress</span>
          </Link>
          <Link
            href="/dashboard/ielts/student/settings"
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
