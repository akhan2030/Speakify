"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type PathwayPreview = {
  levelName: string;
  weekLabel: string;
  taskPreview: string;
};

type IeltsPreview = {
  trackName: string;
  targetBand: string;
  taskPreview: string;
};

const DEFAULT_PATHWAY: PathwayPreview = {
  levelName: "B1.1 Intermediate I",
  weekLabel: "Week 3 of 5",
  taskPreview: "Grammar lesson + vocabulary set — Input Day",
};

const DEFAULT_IELTS: IeltsPreview = {
  trackName: "Plus",
  targetBand: "6.5",
  taskPreview: "Writing Task 2 practice + reading drill",
};

export default function ProgramHomePage() {
  const { data: session } = useSession();
  const [pathway, setPathway] = useState<PathwayPreview>(DEFAULT_PATHWAY);
  const [ielts, setIelts] = useState<IeltsPreview>(DEFAULT_IELTS);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  useEffect(() => {
    fetch("/api/pathway/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        const levelId = json.currentLevel?.level_id ?? "b1_1";
        const levelNames: Record<string, string> = {
          a1_1: "A1.1 Foundation I",
          a1_2: "A1.2 Foundation II",
          a2_1: "A2.1 Elementary I",
          a2_2: "A2.2 Elementary II",
          b1_1: "B1.1 Intermediate I",
          b1_2: "B1.2 Intermediate II",
          b2_1: "B2.1 Upper-Int I",
          b2_2: "B2.2 Upper-Int II",
          c1_1: "C1.1 Advanced I",
          c1_2: "C1.2 Advanced II",
        };
        const week = json.currentLevel?.week_current ?? 3;
        setPathway({
          levelName: levelNames[levelId] ?? DEFAULT_PATHWAY.levelName,
          weekLabel: `Week ${week} of 5`,
          taskPreview: "Today's pathway mission — grammar & vocabulary focus",
        });
      })
      .catch(() => {});

    fetch("/api/student/ielts-dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        setIelts({
          trackName: json.track?.name?.replace(/ track$/i, "") ?? DEFAULT_IELTS.trackName,
          targetBand: json.bands?.target?.toFixed?.(1) ?? DEFAULT_IELTS.targetBand,
          taskPreview:
            json.today?.subtitle ??
            json.today?.tasks?.[0]?.title ??
            DEFAULT_IELTS.taskPreview,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        padding: "2.5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <p
            style={{
              color: "#c9972c",
              fontSize: "12px",
              letterSpacing: "3px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            SPEAKIFY
          </p>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 700,
              color: "#0d1b35",
              margin: "0.75rem 0 0",
            }}
          >
            Welcome back, {firstName} — which program are you studying today?
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px", marginTop: "0.5rem" }}>
            Choose a program to continue where you left off.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <ProgramCard
            title="English Pathway"
            accent="#0d9488"
            icon="🗺"
            stats={[
              { label: "Current level", value: pathway.levelName },
              { label: "Progress", value: pathway.weekLabel },
            ]}
            preview={pathway.taskPreview}
            href="/dashboard/pathway/student"
            buttonLabel="Continue Pathway →"
          />

          <ProgramCard
            title="IELTS Accelerator"
            accent="#c9972c"
            icon="🎯"
            stats={[
              { label: "Current track", value: ielts.trackName },
              { label: "Target band", value: ielts.targetBand },
            ]}
            preview={ielts.taskPreview}
            href="/dashboard/ielts/student"
            buttonLabel="Continue IELTS →"
          />
        </div>
      </div>
    </main>
  );
}

function ProgramCard({
  title,
  accent,
  icon,
  stats,
  preview,
  href,
  buttonLabel,
}: {
  title: string;
  accent: string;
  icon: string;
  stats: Array<{ label: string; value: string }>;
  preview: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "1.75rem",
        boxShadow: "0 4px 24px rgba(13,27,53,0.08)",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        minHeight: "320px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            fontSize: "28px",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            background: `${accent}18`,
          }}
        >
          {icon}
        </span>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0d1b35", margin: 0 }}>
          {title}
        </h2>
      </div>

      <dl style={{ marginTop: "1.25rem", display: "grid", gap: "10px" }}>
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{stat.label}</dt>
            <dd
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#0d1b35",
                margin: "2px 0 0",
              }}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div
        style={{
          marginTop: "auto",
          paddingTop: "1.25rem",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            color: "#64748b",
            margin: "0 0 1rem",
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 600, color: "#475569" }}>Today: </span>
          {preview}
        </p>
        <Link
          href={href}
          style={{
            display: "block",
            textAlign: "center",
            background: accent,
            color: "white",
            padding: "12px 20px",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}
