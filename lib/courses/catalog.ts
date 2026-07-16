import { ACCELERATOR_TRACKS } from "@/lib/accelerator/tracks";

export type CourseCategoryId = "test-prep" | "general-english" | "specialty";

export type CourseCategory = {
  id: CourseCategoryId;
  label: string;
  description: string;
};

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export type CourseCatalogItem = {
  slug: string;
  name: string;
  /** One-line summary for hub cards */
  shortDescription: string;
  /** Full copy for the course detail page */
  description: string;
  levelBadge: CourseLevel;
  category: CourseCategoryId;
  accent: string;
  ctaLabel: "Start Learning" | "View Course";
  ctaHref: string;
  highlights: string[];
  /** Always store as “N weeks”, “N weeks per level”, or “Self-paced” */
  duration?: string;
  /** Display price e.g. "1,800 SAR" or "Starts at 900 SAR" */
  price?: string;
  tagline?: string;
};

export const COURSE_CATEGORIES: CourseCategory[] = [
  {
    id: "test-prep",
    label: "Test Prep",
    description: "Exam-focused programmes with mock tests, band tracking, and AI feedback.",
  },
  {
    id: "general-english",
    label: "General English",
    description:
      "Structured CEFR pathway from A1.1 through C2.2 — 12 micro-levels with weekly lessons and certificates.",
  },
  {
    id: "specialty",
    label: "Specialty Programs",
    description: "Purpose-built courses for professional and young learners.",
  },
];

const foundation = ACCELERATOR_TRACKS.foundation;
const plus = ACCELERATOR_TRACKS.plus;
const elite = ACCELERATOR_TRACKS.elite;

export const COURSE_CATALOG: CourseCatalogItem[] = [
  {
    slug: "ielts-foundation",
    name: "IELTS Foundation",
    tagline: "Build core IELTS skills",
    shortDescription: "Core IELTS skills for Band 5.0–5.5 learners.",
    description:
      "Six-week programme for learners targeting Band 5.0–5.5. Master IELTS format, essential vocabulary, and fundamentals across all four skills.",
    levelBadge: "Beginner",
    category: "test-prep",
    accent: "#6366f1",
    ctaLabel: "Start Learning",
    ctaHref: "/register/ielts-accelerator?track=foundation",
    duration: "6 weeks",
    price: foundation.price,
    highlights: foundation.bullets,
  },
  {
    slug: "ielts-plus",
    name: "IELTS Plus",
    tagline: "Most popular track",
    shortDescription: "Intermediate IELTS prep with mocks and AI feedback.",
    description:
      "Six-week intermediate IELTS preparation for Band 6.0–6.5. Strategy drills, full mock tests, and AI-powered speaking and writing feedback.",
    levelBadge: "Intermediate",
    category: "test-prep",
    accent: "#c9972c",
    ctaLabel: "Start Learning",
    ctaHref: "/register/ielts-accelerator?track=plus",
    duration: "6 weeks",
    price: plus.price,
    highlights: plus.bullets,
  },
  {
    slug: "ielts-elite",
    name: "IELTS Elite",
    tagline: "High-band intensive",
    shortDescription: "Intensive Band 7.0+ accelerator with timed mocks.",
    description:
      "Four-week intensive accelerator for Band 7.0+. Advanced language precision, timed tasks, and exam-day strategy for ambitious test takers.",
    levelBadge: "Advanced",
    category: "test-prep",
    accent: "#0d1b35",
    ctaLabel: "Start Learning",
    ctaHref: "/register/ielts-accelerator?track=elite",
    duration: "4 weeks",
    price: elite.price,
    highlights: elite.bullets,
  },
  {
    slug: "ielts-gt-foundation",
    name: "IELTS General Training — Foundation",
    tagline: "GT core skills",
    shortDescription: "Six-week GT programme for Band 5.0–5.5 learners.",
    description:
      "Six-week programme for learners targeting Band 5.0–5.5. Master GT letter writing, everyday reading, and essential listening skills.",
    levelBadge: "Beginner",
    category: "test-prep",
    accent: "#0d9488",
    ctaLabel: "Start Learning",
    ctaHref: "/register/ielts-general",
    duration: "6 weeks",
    price: foundation.price,
    highlights: [
      "GT format & letter types overview",
      "Formal, semi-formal & informal letter foundations",
      "GT reading strategies for everyday texts",
      "General Task 2 essay basics",
      "Listening skills for social contexts",
      "Full skills integration by Week 6",
    ],
  },
  {
    slug: "ielts-gt-plus",
    name: "IELTS General Training — Plus",
    tagline: "Most popular GT track",
    shortDescription: "Eight-week GT prep for Band 6.0–6.5 with AI scoring.",
    description:
      "Eight-week programme for Band 6.0–6.5. Master all letter types, GT reading sections, and AI-scored mock tests.",
    levelBadge: "Intermediate",
    category: "test-prep",
    accent: "#c9972c",
    ctaLabel: "Start Learning",
    ctaHref: "/register/ielts-general",
    duration: "8 weeks",
    price: plus.price,
    highlights: [
      "Formal letter mastery (Weeks 1–2)",
      "Semi-formal & informal letter precision",
      "GT Reading Sections 1–3 practice",
      "General Task 2 essay writing",
      "AI band scoring on every writing submission",
      "Full mock tests with AI feedback",
    ],
  },
  {
    slug: "ielts-gt-elite",
    name: "IELTS General Training — Elite",
    tagline: "Band 7+ GT intensive",
    shortDescription: "Ten-week intensive for Band 7.0+ GT candidates.",
    description:
      "Ten-week intensive for Band 7.0+. Advanced letter writing, complex reading, timed mocks, and Speaking mastery.",
    levelBadge: "Advanced",
    category: "test-prep",
    accent: "#0d1b35",
    ctaLabel: "Start Learning",
    ctaHref: "/register/ielts-general",
    duration: "10 weeks",
    price: elite.price,
    highlights: [
      "Band 7+ letter writing with sophistication",
      "Advanced GT reading under timed conditions",
      "Advanced General Task 2 essay types",
      "Speaking Parts 1–3 at Band 7 level",
      "Full timed mock tests with detailed AI feedback",
      "Final exam-day preparation",
    ],
  },
  {
    slug: "toefl-accelerator",
    name: "TOEFL Accelerator",
    tagline: "TOEFL iBT preparation",
    shortDescription: "Full TOEFL iBT prep with timed practice tests.",
    description:
      "Comprehensive TOEFL iBT prep with reading, listening, speaking, and writing practice, timed tests, and personalised study plans.",
    levelBadge: "Intermediate",
    category: "test-prep",
    accent: "#2563eb",
    ctaLabel: "Start Learning",
    ctaHref: "/register/toefl-prep",
    duration: "8 weeks",
    highlights: [
      "Reading, listening, speaking & writing practice",
      "Timed practice tests",
      "Progress tracking toward your target score",
      "Integrated skills strategy sessions",
    ],
  },
  {
    slug: "step-preparation",
    name: "Speakify STEP Accelerator",
    tagline: "One adaptive Qiyas course",
    shortDescription: "Eight-week adaptive STEP course to 80+.",
    description:
      "One comprehensive Qiyas-aligned STEP programme over 8 weeks (four 2-week stages). Diagnostic sets your entry point; exit checks advance you through Reading, Structure, Listening, and Analysis.",
    levelBadge: "Advanced",
    category: "test-prep",
    accent: "#059669",
    ctaLabel: "View Course",
    ctaHref: "/register/step-test",
    duration: "8 weeks",
    highlights: [
      "Reading 40% · Structure 30% · Listening 20% · Analysis 10%",
      "Qiyas-aligned MCQ format — no speaking or essay",
      "Timed section drills and full mock practice",
      "Score tracking toward 65–80+ university targets",
    ],
  },
  {
    slug: "english-pathway",
    name: "English Pathway",
    tagline: "CEFR A1.1 → C2.2",
    shortDescription:
      "Full CEFR pathway — 12 micro-levels from A1.1 through C2.2.",
    description:
      "Structured general English from A1.1 to C2.2 across 12 micro-levels. Each level is about 4 weeks with weekly lessons, skill practice, readiness checks, and graduation certificates.",
    levelBadge: "Beginner",
    category: "general-english",
    accent: "#0d9488",
    ctaLabel: "Start Learning",
    ctaHref: "/register/pathway",
    duration: "4 weeks per level",
    price: "Starts at 900 SAR",
    highlights: [
      "CEFR progression A1.1 → C2.2 (12 micro-levels)",
      "Weekly grammar & vocabulary focus",
      "Speaking, reading, listening & writing practice",
      "Level readiness checks & certificates",
    ],
  },
  {
    slug: "business-english",
    name: "Business English",
    tagline: "Professional communication",
    shortDescription: "Workplace English for meetings, emails, and presentations.",
    description:
      "Practical English for meetings, presentations, emails, and negotiations. Build confidence in global workplace communication.",
    levelBadge: "Intermediate",
    category: "specialty",
    accent: "#7c3aed",
    ctaLabel: "Start Learning",
    ctaHref: "/register/business-english",
    duration: "8 weeks",
    highlights: [
      "Meeting & presentation language",
      "Professional email & report writing",
      "Negotiation and networking vocabulary",
      "Industry-specific role-play scenarios",
    ],
  },
  {
    slug: "legal-english",
    name: "Legal English",
    tagline: "Law & compliance contexts",
    shortDescription: "Specialised English for contracts and legal writing.",
    description:
      "Specialised English for legal professionals covering contracts, case summaries, client communication, and international law terminology.",
    levelBadge: "Advanced",
    category: "specialty",
    accent: "#1e40af",
    ctaLabel: "Start Learning",
    ctaHref: "/register/legal-english",
    duration: "10 weeks",
    highlights: [
      "Contract & clause analysis language",
      "Legal writing and summarisation",
      "Client consultation role-plays",
      "International law vocabulary bank",
    ],
  },
  {
    slug: "kids-english",
    name: "Kids English",
    tagline: "Young learners programme",
    shortDescription: "Fun, age-appropriate English for children aged 6–12.",
    description:
      "Engaging, age-appropriate English for children with stories, games, phonics, and speaking activities designed for young minds.",
    levelBadge: "Beginner",
    category: "specialty",
    accent: "#f59e0b",
    ctaLabel: "Start Learning",
    ctaHref: "/register/kids-english",
    duration: "Self-paced",
    highlights: [
      "Phonics & pronunciation foundations",
      "Story-based vocabulary building",
      "Interactive speaking games",
      "Parent progress reports",
    ],
  },
];

export function getIeltsAcademicCourses(): CourseCatalogItem[] {
  return COURSE_CATALOG.filter((c) =>
    ["ielts-foundation", "ielts-plus", "ielts-elite"].includes(c.slug)
  );
}

export function getIeltsGeneralCourses(): CourseCatalogItem[] {
  return COURSE_CATALOG.filter((c) =>
    ["ielts-gt-foundation", "ielts-gt-plus", "ielts-gt-elite"].includes(c.slug)
  );
}

export function getOtherTestPrepCourses(): CourseCatalogItem[] {
  return getCoursesByCategory("test-prep").filter(
    (c) =>
      !getIeltsAcademicCourses().some((a) => a.slug === c.slug) &&
      !getIeltsGeneralCourses().some((g) => g.slug === c.slug)
  );
}

export type NavCourseLink = {
  name: string;
  href: string;
  levelBadge: string;
};

export type NavDropdownSection = {
  sectionLabel: string;
  courses: NavCourseLink[];
};

export type NavDropdownGroup = {
  id: "test-prep" | "programs";
  label: string;
  sections?: NavDropdownSection[];
  courses?: NavCourseLink[];
};

export function getCourseBySlug(slug: string): CourseCatalogItem | undefined {
  return COURSE_CATALOG.find((c) => c.slug === slug);
}

export function getCoursesByCategory(category: CourseCategoryId): CourseCatalogItem[] {
  return COURSE_CATALOG.filter((c) => c.category === category);
}

export const COURSE_SLUGS = COURSE_CATALOG.map((c) => c.slug);

const LEVEL_BADGE_COLORS: Record<CourseLevel, string> = {
  Beginner: "#0d9488",
  Intermediate: "#c9972c",
  Advanced: "#0d1b35",
};

export function levelBadgeColor(level: CourseLevel): string {
  return LEVEL_BADGE_COLORS[level];
}

/** Main nav: Test Prep + Programs (General English + Specialty) */
export const NAV_DROPDOWNS: NavDropdownGroup[] = [
  {
    id: "test-prep",
    label: "Test Prep",
    sections: [
      {
        sectionLabel: "IELTS Academic",
        courses: getIeltsAcademicCourses().map((c) => ({
          name: c.name,
          href: `/courses/${c.slug}`,
          levelBadge: c.levelBadge,
        })),
      },
      {
        sectionLabel: "IELTS General Training",
        courses: getIeltsGeneralCourses().map((c) => ({
          name: c.name.replace("IELTS General Training — ", "GT "),
          href: `/courses/${c.slug}`,
          levelBadge: c.levelBadge,
        })),
      },
      {
        sectionLabel: "Other test prep",
        courses: getOtherTestPrepCourses().map((c) => ({
          name: c.name,
          href: `/courses/${c.slug}`,
          levelBadge: c.levelBadge,
        })),
      },
    ],
  },
  {
    id: "programs",
    label: "Programs",
    courses: [
      ...getCoursesByCategory("general-english"),
      ...getCoursesByCategory("specialty"),
    ].map((c) => ({
      name: c.name,
      href: `/courses/${c.slug}`,
      levelBadge: c.levelBadge,
    })),
  },
];
