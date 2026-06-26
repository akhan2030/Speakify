import { ACCELERATOR_TRACKS, type AcceleratorTrackId } from "@/lib/accelerator/tracks";
import { COURSE_CATALOG, type CourseCatalogItem } from "./catalog";

export type CurriculumWeek = {
  week: string;
  title: string;
  detail: string;
};

export type CoursePageContent = {
  idealFor: string[];
  outcomes: string[];
  skills: string[];
  curriculum: CurriculumWeek[];
  targetLabel?: string;
  entryLevel?: string;
  price?: string;
};

const IELTS_TRACK_BY_SLUG: Record<string, AcceleratorTrackId> = {
  "ielts-foundation": "foundation",
  "ielts-plus": "plus",
  "ielts-elite": "elite",
};

function ieltsContent(slug: string): CoursePageContent {
  const trackId = IELTS_TRACK_BY_SLUG[slug];
  const track = trackId ? ACCELERATOR_TRACKS[trackId] : null;
  if (!track) {
    return { idealFor: [], outcomes: [], skills: [], curriculum: [] };
  }

  return {
    targetLabel: track.target,
    entryLevel: track.entry,
    price: track.price,
    idealFor: [
      `Learners currently around ${track.entry} English level`,
      `Students targeting IELTS ${track.target}`,
      "Test takers who want structured weekly study with AI feedback",
    ],
    outcomes: [
      "Confident performance across all four IELTS skills",
      "Clear understanding of band descriptors and exam timing",
      "Personalised weak-area practice inside the Speakify LMS",
      "Mock tests with actionable feedback before exam day",
    ],
    skills: ["Reading", "Listening", "Writing", "Speaking", "Grammar", "Vocabulary"],
    curriculum: track.weekTitles.map((title, index) => ({
      week: `Week ${index + 1}`,
      title,
      detail: track.bullets[index] ?? "Integrated IELTS skills practice",
    })),
  };
}

const PAGE_CONTENT: Record<string, CoursePageContent> = {
  "ielts-foundation": ieltsContent("ielts-foundation"),
  "ielts-plus": ieltsContent("ielts-plus"),
  "ielts-elite": ieltsContent("ielts-elite"),
  "toefl-accelerator": {
    targetLabel: "TOEFL iBT 80+",
    entryLevel: "B1+",
    idealFor: [
      "University applicants needing TOEFL iBT scores",
      "Students comfortable with academic English at intermediate level",
      "Learners who want timed, section-based practice",
    ],
    outcomes: [
      "Familiarity with TOEFL iBT format and timing",
      "Stronger integrated skills for campus-style tasks",
      "Score tracking toward your target TOEFL result",
    ],
    skills: ["Reading", "Listening", "Speaking", "Writing"],
    curriculum: [
      { week: "Weeks 1–2", title: "Format & Foundations", detail: "TOEFL structure, note-taking, and academic vocabulary" },
      { week: "Weeks 3–4", title: "Receptive Skills", detail: "Reading and listening drills with timed sections" },
      { week: "Weeks 5–6", title: "Productive Skills", detail: "Speaking and writing templates with feedback" },
      { week: "Weeks 7–8", title: "Full Practice Tests", detail: "Timed mocks and exam-day strategy" },
    ],
  },
  "step-preparation": {
    targetLabel: "STEP 90+",
    entryLevel: "B2+",
    idealFor: [
      "Saudi students applying to local universities",
      "Learners preparing for STEP reading and grammar sections",
      "Students who need structured academic English revision",
    ],
    outcomes: [
      "Faster comprehension of academic reading passages",
      "Stronger grammar accuracy under time pressure",
      "Higher confidence before university admissions tests",
    ],
    skills: ["Reading", "Grammar", "Vocabulary", "Timed practice"],
    curriculum: [
      { week: "Week 1", title: "STEP Format Overview", detail: "Question types, timing, and scoring logic" },
      { week: "Week 2", title: "Reading Mastery", detail: "Passage strategies and inference practice" },
      { week: "Week 3", title: "Grammar Focus", detail: "High-frequency structures tested in STEP" },
      { week: "Week 4", title: "Vocabulary Builder", detail: "Academic word families and collocations" },
      { week: "Weeks 5–6", title: "Mock Sections", detail: "Timed drills and score review" },
    ],
  },
  "english-pathway": {
    targetLabel: "A1 – C1 CEFR",
    entryLevel: "Any level",
    idealFor: [
      "Learners building general English step by step",
      "Students who prefer CEFR levels over exam bands",
      "Anyone wanting certificates and level assessments",
    ],
    outcomes: [
      "Clear progression across CEFR levels",
      "Balanced practice in all four skills",
      "Level readiness checks before advancing",
      "Graduation certificates on completion",
    ],
    skills: ["Grammar", "Vocabulary", "Speaking", "Reading", "Listening", "Writing"],
    curriculum: [
      { week: "Level block", title: "Input Days", detail: "New language, guided examples, and controlled practice" },
      { week: "Level block", title: "Practice Days", detail: "Skill tasks with feedback across the week" },
      { week: "Level block", title: "Progress Check", detail: "Readiness review before the next CEFR level" },
      { week: "Level block", title: "Graduation", detail: "Level assessment and certificate award" },
    ],
  },
  "business-english": {
    targetLabel: "Professional fluency",
    entryLevel: "B1+",
    idealFor: [
      "Professionals in international teams",
      "Managers presenting to global stakeholders",
      "Graduates entering corporate roles in English",
    ],
    outcomes: [
      "Clearer meetings and presentation language",
      "Professional email and report writing",
      "Confidence in negotiations and networking",
    ],
    skills: ["Meetings", "Presentations", "Email", "Negotiation", "Networking"],
    curriculum: [
      { week: "Week 1", title: "Workplace Communication", detail: "Meetings, agendas, and professional tone" },
      { week: "Week 2", title: "Presentations", detail: "Structuring ideas and handling Q&A" },
      { week: "Week 3", title: "Business Writing", detail: "Emails, reports, and summaries" },
      { week: "Week 4", title: "Negotiation Language", detail: "Persuasion, diplomacy, and clarity" },
      { week: "Weeks 5–8", title: "Industry Scenarios", detail: "Role-plays and real workplace tasks" },
    ],
  },
  "legal-english": {
    targetLabel: "Legal professional English",
    entryLevel: "B2+",
    idealFor: [
      "Lawyers and legal advisors working internationally",
      "Compliance and contract specialists",
      "Law students moving into English-medium practice",
    ],
    outcomes: [
      "Precise contract and clause language",
      "Stronger legal writing and summarisation",
      "Confident client-facing communication",
    ],
    skills: ["Contracts", "Legal writing", "Client meetings", "Case analysis"],
    curriculum: [
      { week: "Weeks 1–2", title: "Legal Terminology", detail: "Core vocabulary for contracts and disputes" },
      { week: "Weeks 3–4", title: "Document Analysis", detail: "Summaries, clauses, and drafting practice" },
      { week: "Weeks 5–7", title: "Client Communication", detail: "Consultations and professional correspondence" },
      { week: "Weeks 8–10", title: "Applied Practice", detail: "Scenario-based legal English tasks" },
    ],
  },
  "kids-english": {
    targetLabel: "Ages 6–12",
    entryLevel: "Beginner",
    idealFor: [
      "Young learners starting English for the first time",
      "Children who learn best through stories and games",
      "Parents wanting visible progress reports",
    ],
    outcomes: [
      "Strong phonics and pronunciation foundations",
      "Age-appropriate vocabulary and speaking confidence",
      "Enjoyable routines that build daily English habits",
    ],
    skills: ["Phonics", "Stories", "Games", "Speaking", "Listening"],
    curriculum: [
      { week: "Unit 1", title: "Sounds & Letters", detail: "Phonics, pronunciation, and first words" },
      { week: "Unit 2", title: "Story Time", detail: "Picture stories and guided repetition" },
      { week: "Unit 3", title: "Speak & Play", detail: "Games, songs, and simple conversations" },
      { week: "Unit 4", title: "Show What You Know", detail: "Fun checks and parent progress summary" },
    ],
  },
};

export function getCoursePageContent(slug: string): CoursePageContent {
  return (
    PAGE_CONTENT[slug] ?? {
      idealFor: [],
      outcomes: [],
      skills: [],
      curriculum: [],
    }
  );
}

export function isIeltsCourse(slug: string): boolean {
  return slug in IELTS_TRACK_BY_SLUG;
}

export function getRelatedIeltsCourses(currentSlug: string): CourseCatalogItem[] {
  return COURSE_CATALOG.filter(
    (c) => isIeltsCourse(c.slug) && c.slug !== currentSlug
  );
}
