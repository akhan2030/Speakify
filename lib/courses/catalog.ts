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
  duration?: string;
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
    description: "Structured CEFR progression for everyday and academic English.",
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
    ctaHref: "/register/ielts-accelerator",
    duration: foundation.duration,
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
    ctaHref: "/register/ielts-accelerator",
    duration: plus.duration,
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
    ctaHref: "/register/ielts-accelerator",
    duration: elite.duration,
    highlights: elite.bullets,
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
    name: "STEP Preparation",
    tagline: "Saudi university admissions",
    shortDescription: "STEP exam prep for Saudi university admissions.",
    description:
      "Targeted preparation for the Saudi Standardized Test of English Proficiency (STEP) with academic vocabulary, reading comprehension, and grammar mastery.",
    levelBadge: "Advanced",
    category: "test-prep",
    accent: "#059669",
    ctaLabel: "View Course",
    ctaHref: "/placement-test",
    duration: "6 weeks",
    highlights: [
      "STEP-format reading & grammar drills",
      "Academic vocabulary for university contexts",
      "Timed practice sections with score tracking",
      "Weak-area review and mock exams",
    ],
  },
  {
    slug: "english-pathway",
    name: "English Pathway",
    tagline: "CEFR level progression",
    shortDescription: "Structured CEFR English from A1 to C1.",
    description:
      "Structured general English from A1 to C1 with weekly lessons, skill practice, level assessments, and graduation certificates.",
    levelBadge: "Beginner",
    category: "general-english",
    accent: "#0d9488",
    ctaLabel: "Start Learning",
    ctaHref: "/register/pathway",
    duration: "Self-paced levels",
    highlights: [
      "CEFR level progression (A1 → C1)",
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
    duration: "Ongoing levels",
    highlights: [
      "Phonics & pronunciation foundations",
      "Story-based vocabulary building",
      "Interactive speaking games",
      "Parent progress reports",
    ],
  },
];

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
export const NAV_DROPDOWNS = [
  {
    id: "test-prep" as const,
    label: "Test Prep",
    courses: getCoursesByCategory("test-prep").map((c) => ({
      name: c.name,
      href: `/courses/${c.slug}`,
      levelBadge: c.levelBadge,
    })),
  },
  {
    id: "programs" as const,
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
