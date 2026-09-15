"use client";

import { useState } from "react";
import Link from "next/link";
import { speakifyFraunces, speakifyInter } from "@/lib/brand/fonts";
import ProgramSignInLink from "@/components/marketing/ProgramSignInLink";
import type { CourseCatalogItem } from "@/lib/courses/catalog";
import "./coursesHubBlueprint.css";

type Props = {
  recommended?: {
    course: CourseCatalogItem;
    placementBand: number;
  } | null;
};

type TierName = "Foundation" | "Plus" | "Elite";

const AC_TIERS: Record<TierName, { href: string; detail: React.ReactNode }> = {
  Foundation: {
    href: "/courses/ielts-foundation",
    detail: (
      <>
        Foundation — <b>Band 5.0–5.5</b> · 6 weeks · 1,200 SAR · 2 live classes
      </>
    ),
  },
  Plus: {
    href: "/courses/ielts-plus",
    detail: (
      <>
        Plus — <b>Band 6.0–6.5</b> · 6 weeks · 1,800 SAR · 3 live classes
      </>
    ),
  },
  Elite: {
    href: "/courses/ielts-elite",
    detail: (
      <>
        Elite — <b>Band 7.0+</b> · 4 weeks · 2,400 SAR · 4 live classes
      </>
    ),
  },
};

const GT_TIERS: Record<TierName, { href: string; detail: React.ReactNode }> = {
  Foundation: {
    href: "/courses/ielts-gt-foundation",
    detail: (
      <>
        Foundation — <b>Band 5.0–5.5</b> · 6 weeks · 1,200 SAR · 2 live classes
      </>
    ),
  },
  Plus: {
    href: "/courses/ielts-gt-plus",
    detail: (
      <>
        Plus — <b>Band 6.0–6.5</b> · 8 weeks · 1,800 SAR · 3 live classes
      </>
    ),
  },
  Elite: {
    href: "/courses/ielts-gt-elite",
    detail: (
      <>
        Elite — <b>Band 7.0+</b> · 10 weeks · 2,400 SAR · 4 live classes
      </>
    ),
  },
};

const PATHWAY_LEVELS = [
  { c: "AB", n: "Absolute Beginner", d: "Zero English, Arabic-only background", w: "6wk" },
  { c: "A1.1", n: "Beginner 1", d: "Knows alphabet, basic greetings", w: "6wk" },
  { c: "A1.2", n: "Beginner 2", d: "Simple words, basic sentences", w: "6wk" },
  { c: "A2.1", n: "Elementary 1", d: "Everyday survival English", w: "7wk" },
  { c: "A2.2", n: "Elementary 2", d: "Simple conversations, present/past", w: "7wk" },
  { c: "B1.1", n: "Pre-Intermediate 1", d: "Clear communication on familiar topics", w: "8wk" },
  { c: "B1.2", n: "Pre-Intermediate 2", d: "Extended communication, opinions", w: "8wk" },
  { c: "B2.1", n: "Intermediate 1", d: "Fluent on a wide range of topics", w: "8wk" },
  { c: "B2.2", n: "Intermediate 2", d: "Academic and professional English", w: "9wk" },
  { c: "C1.1", n: "Upper-Int. 1", d: "Complex ideas, flexible language", w: "9wk" },
  { c: "C1.2", n: "Upper-Int. 2", d: "Near-professional mastery", w: "9wk" },
  { c: "C2.1", n: "Advanced 1", d: "Near-native, nuanced expression", w: "10wk" },
  { c: "C2.2", n: "Advanced 2", d: "Full mastery, academic/literary", w: "10wk" },
] as const;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function CoursesHub(_props: Props) {
  const [acTier, setAcTier] = useState<TierName>("Foundation");
  const [gtTier, setGtTier] = useState<TierName>("Foundation");
  const [openLevel, setOpenLevel] = useState<number | null>(null);

  const openLv = openLevel === null ? null : PATHWAY_LEVELS[openLevel];

  return (
    <div className={`${speakifyInter.variable} ${speakifyFraunces.variable} ${speakifyInter.className} speakify-hub`}>
      <header>
        <div className="wrap nav">
          <Link href="/courses" className="logo">
            <span className="logo-dot" />
            Speakify
          </Link>
          <div className="nav-links">
            <button type="button" onClick={() => scrollToId("exams")}>
              Test Prep
            </button>
            <button type="button" onClick={() => scrollToId("cefr")}>
              General English
            </button>
            <button type="button" onClick={() => scrollToId("specialty")}>
              Specialty English
            </button>
            <Link href="/courses/mock-exams">Mock Exams</Link>
          </div>
          <div className="nav-cta">
            <ProgramSignInLink className="btn-ghost">Sign in</ProgramSignInLink>
            <Link href="/register" className="btn-gold">
              Register
            </Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <h1>What are you working toward?</h1>
          <p>Pick the path that matches your goal — we&apos;ll show you the right programme, not everything at once.</p>

          <div className="goal-picker">
            <button type="button" className="goal-card" onClick={() => scrollToId("exams")}>
              <span className="k">Path 1</span>
              <h3>I&apos;m sitting a specific exam</h3>
              <p>IELTS Academic, IELTS General, TOEFL, or STEP</p>
            </button>
            <button type="button" className="goal-card" onClick={() => scrollToId("cefr")}>
              <span className="k">Path 2</span>
              <h3>I want to build my English</h3>
              <p>Structured CEFR levels, Absolute Beginner to Advanced</p>
            </button>
            <button type="button" className="goal-card" onClick={() => scrollToId("specialty")}>
              <span className="k">Path 3</span>
              <h3>English for work, life, or my kids</h3>
              <p>Business, Legal, or Kids English</p>
            </button>
          </div>

          <div className="placement-line">
            Not sure which path fits?{" "}
            <Link href="/placement-test">Take the 10-minute placement test →</Link>
          </div>
        </div>
      </section>

      <section className="group" id="exams">
        <div className="wrap">
          <div className="group-head">
            <div>
              <h2>Exam preparation</h2>
              <p>
                Each programme includes Foundation, Plus, and Elite tiers — pick the exam, then the
                tier that matches your starting level.
              </p>
            </div>
            <Link href="/courses/mock-exams" className="mock-pill">
              🎯 Just want to practice? See all mock exams →
            </Link>
          </div>

          <div className="exam-grid">
            <div className="exam-card">
              <div className="exam-top">
                <div>
                  <h3>IELTS Academic</h3>
                  <div className="exam-meta">3 tiers · Self-paced · 6–10 weeks · 5 full mock exams</div>
                </div>
                <span className="band">Academic · 3 tiers</span>
              </div>
              <p className="exam-desc">
                For university admissions and professional registration. Graph/report writing included.
              </p>
              <div className="tier-toggle">
                {(["Foundation", "Plus", "Elite"] as const).map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`tier-btn${acTier === name ? " active" : ""}`}
                    onClick={() => setAcTier(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="tier-detail">{AC_TIERS[acTier].detail}</div>
              <div className="exam-actions">
                <Link href={AC_TIERS[acTier].href} className="btn-primary">
                  View course
                </Link>
                <Link href="/courses/mock-exams" className="btn-secondary">
                  Mock exams
                </Link>
              </div>
            </div>

            <div className="exam-card">
              <div className="exam-top">
                <div>
                  <h3>IELTS General Training</h3>
                  <div className="exam-meta">3 tiers · Self-paced · 6–10 weeks · 3 full mock exams</div>
                </div>
                <span className="band">General Training · 3 tiers</span>
              </div>
              <p className="exam-desc">
                For visas, immigration, and work abroad. Letters and everyday reading skills.
              </p>
              <div className="tier-toggle">
                {(["Foundation", "Plus", "Elite"] as const).map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`tier-btn${gtTier === name ? " active" : ""}`}
                    onClick={() => setGtTier(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="tier-detail">{GT_TIERS[gtTier].detail}</div>
              <div className="exam-actions">
                <Link href={GT_TIERS[gtTier].href} className="btn-primary">
                  View course
                </Link>
                <Link href="/courses/mock-exams/general" className="btn-secondary">
                  Mock exams
                </Link>
              </div>
            </div>

            <div className="exam-card">
              <div className="exam-top">
                <div>
                  <h3>TOEFL</h3>
                  <div className="exam-meta">1 tier · Self-paced · 8 weeks · Timed practice tests</div>
                </div>
                <span className="band">Intermediate</span>
              </div>
              <p className="exam-desc">
                Full TOEFL iBT preparation, built for US and Canadian university admissions.
              </p>
              <div className="exam-actions" style={{ marginTop: 56 }}>
                <Link href="/courses/toefl-accelerator" className="btn-primary">
                  Coming soon
                </Link>
                <span className="btn-secondary" aria-disabled="true">
                  Enrolment closed
                </span>
              </div>
            </div>

            <div className="exam-card">
              <div className="exam-top">
                <div>
                  <h3>STEP</h3>
                  <div className="exam-meta">1 tier · 10 weeks · Independent Qiyas prep</div>
                </div>
                <span className="band">Open</span>
              </div>
              <p className="exam-desc">
                Qiyas STEP (كفايات اللغة الإنجليزية) — CEFR-based MCQ prep. Weights 40/30/20/10.
                Live totals are approximately 100–130 scored items over roughly 2.5–3 hours.
                Not affiliated with Qiyas/ETEC.
              </p>
              <div className="exam-actions" style={{ marginTop: 56 }}>
                <Link href="/courses/step-preparation" className="btn-primary">
                  View course
                </Link>
                <Link href="/register/step-test" className="btn-secondary">
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="group" id="cefr">
        <div className="wrap">
          <div className="group-head">
            <div>
              <h2>General English pathway</h2>
              <p>One continuous journey from zero English to near-native fluency, in 13 four-to-ten-week levels.</p>
            </div>
          </div>

          <div className="cefr-card">
            <div className="cefr-top">
              <div>
                <h3>English Pathway</h3>
                <p>Self-paced · Starts at 900 SAR per level · live classes via marketplace</p>
              </div>
              <div className="exam-actions">
                <Link href="/courses/english-pathway" className="btn-primary">
                  Coming soon
                </Link>
                <span className="btn-secondary" aria-disabled="true">
                  Enrolment closed
                </span>
              </div>
            </div>

            <div className="ladder">
              {PATHWAY_LEVELS.map((lv, i) => (
                <button
                  key={lv.c}
                  type="button"
                  className={`rung${openLevel === i ? " open" : ""}`}
                  onClick={() => setOpenLevel((cur) => (cur === i ? null : i))}
                >
                  {lv.c}
                </button>
              ))}
            </div>
            <div className="ladder-caption">
              Click any level to see what it covers, or use the placement test to find your starting point.
            </div>
            <div className={`level-table${openLv ? " open" : ""}`}>
              {openLv ? (
                <div className="level-row">
                  <div className="code">{openLv.c}</div>
                  <div className="name">{openLv.n}</div>
                  <div className="desc">
                    {openLv.d} · {openLv.w}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="find-level">
              Not sure where you fit? <Link href="/placement-test">Take the placement test →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="group" id="specialty" style={{ borderBottom: "none" }}>
        <div className="wrap">
          <div className="group-head">
            <div>
              <h2>English for work, life, and family</h2>
              <p>Focused, self-paced courses that don&apos;t require picking a CEFR level first.</p>
            </div>
          </div>
          <div className="spec-grid">
            <div className="spec-card">
              <span className="spec-tag">Intermediate · Self-paced · 8 weeks</span>
              <h3>Business English</h3>
              <p>Workplace English for meetings, emails, and presentations.</p>
              <div className="exam-actions">
                <Link href="/courses/business-english" className="btn-primary">
                  Coming soon
                </Link>
                <span className="btn-secondary" aria-disabled="true">
                  Enrolment closed
                </span>
              </div>
            </div>
            <div className="spec-card">
              <span className="spec-tag">Advanced · Self-paced · 10 weeks</span>
              <h3>Legal English</h3>
              <p>Specialised English for contracts and legal writing.</p>
              <div className="exam-actions">
                <Link href="/courses/legal-english" className="btn-primary">
                  Coming soon
                </Link>
                <span className="btn-secondary" aria-disabled="true">
                  Enrolment closed
                </span>
              </div>
            </div>
            <div className="spec-card">
              <span className="spec-tag">Beginner · Self-paced</span>
              <h3>Kids English</h3>
              <p>Fun, age-appropriate English for children aged 6–12.</p>
              <div className="exam-actions">
                <Link href="/courses/kids-english" className="btn-primary">
                  Coming soon
                </Link>
                <span className="btn-secondary" aria-disabled="true">
                  Enrolment closed
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>© 2026 Speakify · Global Language Center</footer>
    </div>
  );
}
