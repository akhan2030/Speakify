"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/roles";
import {
  parseEnrollmentSlugs,
  type ProgramType,
} from "@/lib/programType";

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

const PROGRAMME_CARDS: Array<{
  id: ProgramType | "step";
  match: (slugs: string[]) => boolean;
  title: string;
  accent: string;
  icon: string;
  href: string;
  buttonLabel: string;
  kind: "pathway" | "ielts" | "generic";
}> = [
  {
    id: "pathway",
    match: (s) => s.includes("pathway"),
    title: "English Pathway",
    accent: "#0d9488",
    icon: "🗺",
    href: "/dashboard/pathway/student",
    buttonLabel: "Continue Pathway →",
    kind: "pathway",
  },
  {
    id: "ielts",
    match: (s) => s.includes("ielts"),
    title: "IELTS Accelerator",
    accent: "#c9972c",
    icon: "🎯",
    href: "/dashboard/ielts/student",
    buttonLabel: "Continue IELTS →",
    kind: "ielts",
  },
  {
    id: "ielts_general",
    match: (s) => s.includes("ielts_general"),
    title: "IELTS General Training",
    accent: "#0d9488",
    icon: "📝",
    href: "/dashboard/ielts-general/student",
    buttonLabel: "Continue GT →",
    kind: "generic",
  },
  {
    id: "step",
    match: (s) => s.includes("step"),
    title: "STEP Prep",
    accent: "#0d1b35",
    icon: "🇸🇦",
    href: "/dashboard/step/student",
    buttonLabel: "Continue STEP →",
    kind: "generic",
  },
  {
    id: "business_english",
    match: (s) => s.includes("business_english"),
    title: "Business English",
    accent: "#0369a1",
    icon: "💼",
    href: "/dashboard/business-english/student",
    buttonLabel: "Continue →",
    kind: "generic",
  },
  {
    id: "legal_english",
    match: (s) => s.includes("legal_english"),
    title: "Legal English",
    accent: "#7c3aed",
    icon: "⚖️",
    href: "/dashboard/legal-english/student",
    buttonLabel: "Continue →",
    kind: "generic",
  },
  {
    id: "kids_english",
    match: (s) => s.includes("kids_english"),
    title: "Kids English",
    accent: "#db2777",
    icon: "🎒",
    href: "/dashboard/kids-english/student",
    buttonLabel: "Continue →",
    kind: "generic",
  },
];

export default function ProgramHomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pathway, setPathway] = useState<PathwayPreview>(DEFAULT_PATHWAY);
  const [ielts, setIelts] = useState<IeltsPreview>(DEFAULT_IELTS);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const enrolledSlugs = useMemo(() => {
    const fromSession = parseEnrollmentSlugs(
      (session?.user as { enrolledPrograms?: unknown })?.enrolledPrograms
    );
    const selected = String(
      (session?.user as { programSelected?: string })?.programSelected ?? ""
    )
      .trim()
      .toLowerCase()
      .replace(/-/g, "_");
    if (selected && !fromSession.includes(selected)) {
      return [...fromSession, selected];
    }
    return fromSession;
  }, [session?.user]);

  const cards = useMemo(() => {
    const matched = PROGRAMME_CARDS.filter((c) => c.match(enrolledSlugs));
    // Fail closed: if we somehow have no enrollment, show nothing actionable
    // rather than inventing Pathway + IELTS for everyone.
    return matched;
  }, [enrolledSlugs]);

  useEffect(() => {
    if (normalizeRole(session?.user?.role) === "admin") {
      router.replace("/dashboard/admin");
    }
  }, [session?.user?.role, router]);

  useEffect(() => {
    // Single-programme students should not linger on the picker.
    if (!session?.user || cards.length !== 1) return;
    const only = cards[0];
    router.replace(only.href);
  }, [session?.user, cards, router]);

  useEffect(() => {
    if (!enrolledSlugs.includes("pathway")) return;
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
  }, [enrolledSlugs]);

  useEffect(() => {
    if (!enrolledSlugs.includes("ielts")) return;
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
  }, [enrolledSlugs]);

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
            {cards.length === 0
              ? "No programme is enrolled on this account yet. Contact support if this looks wrong."
              : "Choose a program to continue where you left off."}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {cards.map((card) => (
            <ProgramCard
              key={card.id}
              title={card.title}
              accent={card.accent}
              icon={card.icon}
              stats={
                card.kind === "pathway"
                  ? [
                      { label: "Current level", value: pathway.levelName },
                      { label: "Progress", value: pathway.weekLabel },
                    ]
                  : card.kind === "ielts"
                    ? [
                        { label: "Current track", value: ielts.trackName },
                        { label: "Target band", value: ielts.targetBand },
                      ]
                    : [
                        {
                          label: "Programme",
                          value: card.title,
                        },
                      ]
              }
              preview={
                card.kind === "pathway"
                  ? pathway.taskPreview
                  : card.kind === "ielts"
                    ? ielts.taskPreview
                    : `Open your ${card.title} dashboard`
              }
              href={card.href}
              buttonLabel={card.buttonLabel}
            />
          ))}
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
        <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0d1b35" }}>{title}</h2>
      </div>

      <div style={{ marginTop: "1.25rem", display: "grid", gap: "0.75rem" }}>
        {stats.map((s) => (
          <div key={s.label}>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>{s.label}</p>
            <p style={{ margin: "2px 0 0", fontWeight: 600, color: "#0d1b35" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <p style={{ marginTop: "1.25rem", color: "#64748b", fontSize: "14px", flex: 1 }}>
        {preview}
      </p>

      <Link
        href={href}
        style={{
          marginTop: "1rem",
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "0.85rem 1rem",
          borderRadius: "12px",
          background: accent,
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        {buttonLabel}
      </Link>
    </div>
  );
}
