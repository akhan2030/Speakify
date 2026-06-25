"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { usePathwayStudent } from "@/components/pathway/usePathwayStudent";
import { getProgramTerminology } from "@/lib/programs/terminology";

type SidebarUser = {
  name?: string | null;
  email?: string | null;
};

export default function PathwaySidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const ctx = usePathwayStudent();
  const terms = getProgramTerminology("pathway");
  const active = (path: string) => pathname === path;

  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "ST";

  return (
    <aside
      style={{
        width: "260px",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        background: "#0d1b35",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      <div
        style={{
          padding: "1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <p
          style={{
            color: "#c9972c",
            fontWeight: 700,
            fontSize: "18px",
            margin: 0,
          }}
        >
          Speakify
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "12px",
            margin: "2px 0 0",
          }}
        >
          English Pathway
        </p>
      </div>

      <div
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#c9972c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0d1b35",
            fontWeight: 700,
            fontSize: "14px",
            marginBottom: "8px",
          }}
        >
          {initials}
        </div>
        <p
          style={{
            color: "white",
            fontWeight: 600,
            fontSize: "14px",
            margin: 0,
          }}
        >
          {user?.name ?? "Student"}
        </p>
        <p style={{ color: "#c9972c", fontSize: "12px", margin: "2px 0 0" }}>
          English Pathway
        </p>
        <span
          style={{
            display: "inline-block",
            background: "rgba(201,151,44,0.2)",
            color: "#c9972c",
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "4px",
            marginTop: "6px",
          }}
        >
          {ctx.levelName}
        </span>
      </div>

      <nav style={{ flex: 1, padding: "1rem 0" }}>
        <div style={{ padding: "0 1rem", marginBottom: "4px" }}>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "10px",
              letterSpacing: "2px",
              margin: "0 0 6px",
              padding: "0 0.5rem",
            }}
          >
            TODAY
          </p>
          <SidebarLink
            href="/dashboard/pathway/student"
            active={active("/dashboard/pathway/student")}
            icon="📋"
            label={terms.missionLabel}
            badge={`${ctx.missionCompleted}/${ctx.missionTotal} done`}
          />
        </div>

        <div style={{ padding: "0 1rem", marginTop: "12px", marginBottom: "4px" }}>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "10px",
              letterSpacing: "2px",
              margin: "0 0 6px",
              padding: "0 0.5rem",
            }}
          >
            MY PROGRAMME
          </p>
          <SidebarLink
            href="/dashboard/pathway/student/my-pathway"
            active={active("/dashboard/pathway/student/my-pathway")}
            icon="🗺"
            label={terms.trackLabel}
            badge={`${ctx.levelCode} · Week ${ctx.week}/${ctx.weekCount}`}
          />
          <SidebarLink
            href="/dashboard/pathway/student/weekly-plan"
            active={active("/dashboard/pathway/student/weekly-plan")}
            icon="📅"
            label="Weekly Plan"
          />
        </div>

        <div style={{ padding: "0 1rem", marginTop: "12px", marginBottom: "4px" }}>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "10px",
              letterSpacing: "2px",
              margin: "0 0 6px",
              padding: "0 0.5rem",
            }}
          >
            LANGUAGE SKILLS
          </p>
          <SidebarLink
            href="/dashboard/pathway/student/grammar"
            active={active("/dashboard/pathway/student/grammar")}
            icon="🔤"
            label="Grammar"
            badge={`Week ${ctx.week}`}
          />
          <SidebarLink
            href="/dashboard/pathway/student/vocabulary"
            active={active("/dashboard/pathway/student/vocabulary")}
            icon="📚"
            label="Vocabulary"
          />
          <SidebarLink
            href="/dashboard/pathway/student/reading"
            active={active("/dashboard/pathway/student/reading")}
            icon="📖"
            label="Reading"
          />
          <SidebarLink
            href="/dashboard/pathway/student/listening"
            active={active("/dashboard/pathway/student/listening")}
            icon="🎧"
            label="Listening"
          />
          <SidebarLink
            href="/dashboard/pathway/student/speaking"
            active={active("/dashboard/pathway/student/speaking")}
            icon="🎤"
            label="Speaking"
          />
          <SidebarLink
            href="/dashboard/pathway/student/writing"
            active={active("/dashboard/pathway/student/writing")}
            icon="✍"
            label="Writing"
          />
          <SidebarLink
            href="/dashboard/pathway/student/pronunciation"
            active={active("/dashboard/pathway/student/pronunciation")}
            icon="🗣"
            label="Pronunciation"
          />
        </div>

        <div style={{ padding: "0 1rem", marginTop: "12px", marginBottom: "4px" }}>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "10px",
              letterSpacing: "2px",
              margin: "0 0 6px",
              padding: "0 0.5rem",
            }}
          >
            ASSESSMENT
          </p>
          <SidebarLink
            href="/dashboard/pathway/student/progress-check"
            active={active("/dashboard/pathway/student/progress-check")}
            icon="✅"
            label={terms.progressCheckLabel}
          />
          <SidebarLink
            href="/dashboard/pathway/student/graduation"
            active={active("/dashboard/pathway/student/graduation")}
            icon="🎓"
            label="Graduation Test"
            badgeColor="#c9972c"
          />
          <SidebarLink
            href="/dashboard/pathway/student/certificates"
            active={active("/dashboard/pathway/student/certificates")}
            icon="📜"
            label="Certificates"
          />
        </div>

        <div style={{ padding: "0 1rem", marginTop: "12px", marginBottom: "4px" }}>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "10px",
              letterSpacing: "2px",
              margin: "0 0 6px",
              padding: "0 0.5rem",
            }}
          >
            PROGRESS
          </p>
          <SidebarLink
            href="/dashboard/pathway/student/progress"
            active={active("/dashboard/pathway/student/progress")}
            icon="📊"
            label="My Progress"
          />
          <SidebarLink
            href="/dashboard/pathway/student/achievements"
            active={active("/dashboard/pathway/student/achievements")}
            icon="🏆"
            label="Achievements"
            badge="2 new"
            badgeColor="#0d9488"
          />
        </div>
      </nav>

      <div
        style={{
          padding: "1rem",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <SidebarLink
          href="/dashboard/pathway/student/settings"
          active={active("/dashboard/pathway/student/settings")}
          icon="⚙"
          label="Settings"
        />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            width: "100%",
            textAlign: "left",
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            marginTop: "4px",
          }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  active,
  icon,
  label,
  badge,
  badgeColor,
}: {
  href: string;
  active: boolean;
  icon: string;
  label: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: "8px",
        marginBottom: "2px",
        background: active ? "rgba(201,151,44,0.15)" : "transparent",
        borderLeft: active ? "3px solid #c9972c" : "3px solid transparent",
        textDecoration: "none",
        transition: "all 0.15s",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span
          style={{
            color: active ? "#c9972c" : "rgba(255,255,255,0.8)",
            fontSize: "14px",
            fontWeight: active ? 600 : 400,
          }}
        >
          {label}
        </span>
      </span>
      {badge ? (
        <span
          style={{
            fontSize: "10px",
            background: badgeColor ? `${badgeColor}33` : "rgba(255,255,255,0.1)",
            color: badgeColor || "rgba(255,255,255,0.5)",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
