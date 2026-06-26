import { getCoursePageContent } from "@/lib/courses/pageContent";

export type SpecialtySlug = "business-english" | "legal-english" | "kids-english";

export type SpecialtyProgramId = "business_english" | "legal_english" | "kids_english";

export type SpecialtySkill = {
  id: string;
  label: string;
  icon: string;
  description: string;
};

export type SpecialtyProgramConfig = {
  id: SpecialtyProgramId;
  slug: SpecialtySlug;
  name: string;
  tagline: string;
  accent: string;
  accentLight: string;
  headerGradient: string;
  duration: string;
  entryLevel: string;
  targetLabel: string;
  testEmail: string;
  testPassword: string;
  registerPath: string;
  dashboardBase: string;
  skills: SpecialtySkill[];
  weekCount: number;
  currentWeek: number;
  progressPercent: number;
};

const BUSINESS_SKILLS: SpecialtySkill[] = [
  { id: "meetings", label: "Meetings", icon: "🤝", description: "Agendas, turn-taking, and professional tone" },
  { id: "presentations", label: "Presentations", icon: "📊", description: "Structuring ideas and handling Q&A" },
  { id: "email", label: "Email & Reports", icon: "✉️", description: "Clear workplace writing" },
  { id: "negotiation", label: "Negotiation", icon: "💼", description: "Persuasion and diplomacy" },
  { id: "networking", label: "Networking", icon: "🌐", description: "Small talk and relationship building" },
];

const LEGAL_SKILLS: SpecialtySkill[] = [
  { id: "contracts", label: "Contracts", icon: "📜", description: "Clause language and document review" },
  { id: "legal-writing", label: "Legal Writing", icon: "✍️", description: "Summaries, memos, and drafting" },
  { id: "client-meetings", label: "Client Meetings", icon: "🗣️", description: "Consultations and professional tone" },
  { id: "case-analysis", label: "Case Analysis", icon: "⚖️", description: "Argument structure and terminology" },
];

const KIDS_SKILLS: SpecialtySkill[] = [
  { id: "phonics", label: "Phonics", icon: "🔤", description: "Sounds, letters, and first words" },
  { id: "stories", label: "Stories", icon: "📚", description: "Picture stories and guided repetition" },
  { id: "games", label: "Games", icon: "🎮", description: "Play-based vocabulary practice" },
  { id: "speaking", label: "Speaking", icon: "🗣️", description: "Simple conversations and songs" },
  { id: "listening", label: "Listening", icon: "👂", description: "Stories, instructions, and songs" },
];

export const SPECIALTY_PROGRAMS: Record<SpecialtyProgramId, SpecialtyProgramConfig> = {
  business_english: {
    id: "business_english",
    slug: "business-english",
    name: "Business English",
    tagline: "Professional communication",
    accent: "#7c3aed",
    accentLight: "#ede9fe",
    headerGradient: "linear-gradient(135deg, #0d1b35 0%, #4c1d95 100%)",
    duration: "8 weeks",
    entryLevel: "B1+",
    targetLabel: "Professional fluency",
    testEmail: "business@test.com",
    testPassword: "123456",
    registerPath: "/register/business-english",
    dashboardBase: "/dashboard/business-english/student",
    skills: BUSINESS_SKILLS,
    weekCount: 8,
    currentWeek: 2,
    progressPercent: 24,
  },
  legal_english: {
    id: "legal_english",
    slug: "legal-english",
    name: "Legal English",
    tagline: "Law & compliance contexts",
    accent: "#1e40af",
    accentLight: "#dbeafe",
    headerGradient: "linear-gradient(135deg, #0d1b35 0%, #1e3a8a 100%)",
    duration: "10 weeks",
    entryLevel: "B2+",
    targetLabel: "Legal professional English",
    testEmail: "legal@test.com",
    testPassword: "123456",
    registerPath: "/register/legal-english",
    dashboardBase: "/dashboard/legal-english/student",
    skills: LEGAL_SKILLS,
    weekCount: 10,
    currentWeek: 1,
    progressPercent: 10,
  },
  kids_english: {
    id: "kids_english",
    slug: "kids-english",
    name: "Kids English",
    tagline: "Fun learning for ages 6–12",
    accent: "#ea580c",
    accentLight: "#ffedd5",
    headerGradient: "linear-gradient(135deg, #0d1b35 0%, #c2410c 100%)",
    duration: "4 units",
    entryLevel: "Beginner",
    targetLabel: "Ages 6–12",
    testEmail: "kids@test.com",
    testPassword: "123456",
    registerPath: "/register/kids-english",
    dashboardBase: "/dashboard/kids-english/student",
    skills: KIDS_SKILLS,
    weekCount: 4,
    currentWeek: 1,
    progressPercent: 15,
  },
};

export const SPECIALTY_PROGRAM_IDS = Object.keys(
  SPECIALTY_PROGRAMS
) as SpecialtyProgramId[];

export function isSpecialtyProgramId(value: string): value is SpecialtyProgramId {
  return value in SPECIALTY_PROGRAMS;
}

export function specialtySlugFromProgramId(id: SpecialtyProgramId): SpecialtySlug {
  return SPECIALTY_PROGRAMS[id].slug;
}

export function programIdFromSpecialtySlug(slug: string): SpecialtyProgramId | null {
  const normalized = slug.trim().toLowerCase();
  for (const program of Object.values(SPECIALTY_PROGRAMS)) {
    if (program.slug === normalized) return program.id;
  }
  return null;
}

export function getSpecialtyProgram(id: SpecialtyProgramId): SpecialtyProgramConfig {
  return SPECIALTY_PROGRAMS[id];
}

export function getSpecialtyProgramBySlug(slug: string): SpecialtyProgramConfig | null {
  const id = programIdFromSpecialtySlug(slug);
  return id ? SPECIALTY_PROGRAMS[id] : null;
}

export function specialtyCurriculum(id: SpecialtyProgramId) {
  const program = SPECIALTY_PROGRAMS[id];
  return getCoursePageContent(program.slug).curriculum;
}

export function specialtyOutcomes(id: SpecialtyProgramId) {
  const program = SPECIALTY_PROGRAMS[id];
  return getCoursePageContent(program.slug).outcomes;
}

export function todayMissionForProgram(id: SpecialtyProgramId) {
  const program = SPECIALTY_PROGRAMS[id];
  const curriculum = specialtyCurriculum(id);
  const weekItem = curriculum[Math.min(program.currentWeek - 1, curriculum.length - 1)];

  const tasksByProgram: Record<SpecialtyProgramId, Array<{ title: string; minutes: number }>> = {
    business_english: [
      { title: "Meeting language: opening & closing", minutes: 15 },
      { title: "Email tone & structure drill", minutes: 20 },
      { title: "Presentation opener practice", minutes: 15 },
    ],
    legal_english: [
      { title: "Contract clause vocabulary set", minutes: 20 },
      { title: "Case summary writing task", minutes: 25 },
      { title: "Client consultation role-play", minutes: 15 },
    ],
    kids_english: [
      { title: "Phonics: letter sounds A–E", minutes: 10 },
      { title: "Story time: picture book", minutes: 15 },
      { title: "Speak & play: animal names", minutes: 10 },
    ],
  };

  return {
    weekLabel: weekItem?.week ?? `Week ${program.currentWeek}`,
    focusTitle: weekItem?.title ?? program.name,
    focusDetail: weekItem?.detail ?? program.tagline,
    tasks: tasksByProgram[id],
  };
}
