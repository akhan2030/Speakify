import type { IeltsProgramVariant } from "@/lib/programs/ieltsProgramIdentity";
import { getIeltsSkillHref, getIeltsWritingHref } from "@/lib/ielts/studentSkillHrefs";

export type AcceleratorTrackId = "foundation" | "plus" | "elite";

export type AcceleratorDay = {
  key: "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
  dayName: string;
  label: string;
  theme: string;
  href: string;
  estimatedMinutes: number;
};

export type AcceleratorTrack = {
  id: AcceleratorTrackId;
  name: string;
  target: string;
  entry: string;
  duration: string;
  price: string;
  /** Moyasar amount in halalas (1 SAR = 100 halalas) */
  priceHalalas: number;
  weekCount: number;
  badge?: string;
  bullets: string[];
  weekTitles: string[];
};

export const ACCELERATOR_CYCLE = [
  { day: "Monday", focus: "IELTS strategy + skill input" },
  { day: "Tuesday", focus: "IELTS practice tasks" },
  { day: "Wednesday", focus: "Full IELTS task (writing/speaking)" },
  { day: "Thursday", focus: "Weak area review + vocabulary" },
  { day: "Friday", focus: "Mini IELTS mock (1 section)" },
] as const;

export const ACCELERATOR_TRACKS: Record<AcceleratorTrackId, AcceleratorTrack> = {
  foundation: {
    id: "foundation",
    name: "Foundation",
    target: "Band 5.0–5.5",
    entry: "A2.2–B1.1",
    duration: "6 weeks",
    price: "1,200 SAR",
    priceHalalas: 120_000,
    weekCount: 6,
    bullets: [
      "Core IELTS format overview & band descriptors",
      "Essential academic vocabulary (500 words)",
      "Present/past tenses in IELTS context",
      "Listening for gist & key details",
      "Writing Task 1 basics (charts & graphs)",
      "Speaking Part 1 confidence building",
    ],
    weekTitles: [
      "IELTS Foundations & Format",
      "Core Grammar for IELTS",
      "Listening & Reading Basics",
      "Writing Task 1 Introduction",
      "Speaking Part 1 & 2 Basics",
      "Full Skills Integration",
    ],
  },
  plus: {
    id: "plus",
    name: "Plus",
    target: "Band 6.0–6.5",
    entry: "B1.2–B2.1",
    duration: "6 weeks",
    price: "1,800 SAR",
    priceHalalas: 180_000,
    badge: "Most Popular — 50% of Saudi students",
    weekCount: 6,
    bullets: [
      "Academic vocabulary expansion (800+ words)",
      "Reading strategies: T/F/NG & matching headings",
      "Listening note-taking & prediction skills",
      "Writing Task 1 & 2 structure & cohesion",
      "Speaking fluency drills & Part 3 discussion",
      "Two full mock tests with AI feedback",
    ],
    weekTitles: [
      "Academic Language Foundation",
      "Reading Mastery",
      "Listening Mastery",
      "Writing Task 1 & 2",
      "Speaking Fluency Push",
      "Full Mock × 2 + Final Push",
    ],
  },
  elite: {
    id: "elite",
    name: "Elite",
    target: "Band 7.0+",
    entry: "B2.2–C1",
    duration: "4 weeks intensive",
    price: "2,400 SAR",
    priceHalalas: 240_000,
    weekCount: 4,
    bullets: [
      "Advanced lexical resource & collocation",
      "Complex reading: inference & author attitude",
      "Listening for attitude & implied meaning",
      "Band 7+ writing: nuance & argumentation",
      "Speaking: natural discourse & pronunciation",
      "Exam-day strategy & timed full mocks",
    ],
    weekTitles: [
      "Band 7+ Language Precision",
      "Advanced Reading & Listening",
      "High-Band Writing Mastery",
      "Intensive Mock Exams & Polish",
    ],
  },
};

const LEGACY_MODULE_LINKS = {
  readingStrategies: "/dashboard/student/reading/strategies",
  readingPractice: "/dashboard/student/reading/practice",
  readingTest: "/dashboard/student/reading/test",
  listeningPractice: "/dashboard/student/listening",
  listeningTest: "/dashboard/student/listening/test",
  writing: "/dashboard/student/writing",
  speaking: "/dashboard/student/speaking",
  speakingPart1: "/dashboard/student/speaking/part1",
  speakingPart2: "/dashboard/student/speaking/part2",
  speakingMock: "/dashboard/student/speaking/mock",
  vocabulary: "/dashboard/student/vocabulary",
  grammar: "/dashboard/student/grammar",
  grammarPractice: "/dashboard/student/grammar/practice",
};

function getModuleLinks(variant: IeltsProgramVariant = "ielts") {
  if (variant === "ielts") {
    return LEGACY_MODULE_LINKS;
  }

  return {
    readingStrategies: getIeltsSkillHref(variant, "reading"),
    readingPractice: getIeltsSkillHref(variant, "reading"),
    readingTest: getIeltsSkillHref(variant, "reading"),
    listeningPractice: getIeltsSkillHref(variant, "listening"),
    listeningTest: `${getIeltsSkillHref(variant, "listening")}/test`,
    writing: getIeltsWritingHref(variant),
    speaking: getIeltsSkillHref(variant, "speaking"),
    speakingPart1: `${getIeltsSkillHref(variant, "speaking")}/part1`,
    speakingPart2: `${getIeltsSkillHref(variant, "speaking")}/part2`,
    speakingMock: `${getIeltsSkillHref(variant, "speaking")}/mock`,
    vocabulary: getIeltsSkillHref(variant, "vocabulary"),
    grammar: getIeltsSkillHref(variant, "grammar"),
    grammarPractice: `${getIeltsSkillHref(variant, "grammar")}/practice`,
  };
}

/** IELTS-specific daily tasks with links to existing modules */
export function getWeekDays(
  trackId: AcceleratorTrackId,
  weekNum: number,
  variant: IeltsProgramVariant = "ielts"
): AcceleratorDay[] {
  const MODULE_LINKS = getModuleLinks(variant);
  const w = Math.min(Math.max(weekNum, 1), 6);

  const weekFocus: Record<AcceleratorTrackId, string[]> = {
    foundation: ["format", "grammar", "listening", "writing", "speaking", "integration"],
    plus: ["vocabulary", "reading", "listening", "writing", "speaking", "mock"],
    elite: ["precision", "reception", "writing", "mock"],
  };

  const focus = weekFocus[trackId][w - 1] ?? "skills";

  const dayConfigs: Record<string, AcceleratorDay[]> = {
    vocabulary: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "Academic word lists & IELTS vocabulary strategy",
        href: MODULE_LINKS.vocabulary,
        estimatedMinutes: 45,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Collocation drills & sentence completion",
        href: "/dashboard/student/vocabulary/quiz",
        estimatedMinutes: 40,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Writing Task 2 — opinion essay submission",
        href: MODULE_LINKS.writing,
        estimatedMinutes: 60,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Spaced repetition & phrase bank review",
        href: "/dashboard/student/vocabulary/review",
        estimatedMinutes: 35,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "Reading section mini-mock (20 min)",
        href: MODULE_LINKS.readingTest,
        estimatedMinutes: 30,
      },
    ],
    reading: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "T/F/NG, matching headings & skimming strategy",
        href: MODULE_LINKS.readingStrategies,
        estimatedMinutes: 45,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Timed passage practice by question type",
        href: MODULE_LINKS.readingPractice,
        estimatedMinutes: 50,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Full reading passage under exam conditions",
        href: MODULE_LINKS.readingTest,
        estimatedMinutes: 60,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Error log review & academic word focus",
        href: "/dashboard/student/reading/tracker",
        estimatedMinutes: 40,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "Reading section only — 3 passages",
        href: MODULE_LINKS.readingTest,
        estimatedMinutes: 30,
      },
    ],
    listening: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "Prediction, note-taking & accent awareness",
        href: MODULE_LINKS.listeningPractice,
        estimatedMinutes: 45,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Section-by-section listening drills",
        href: "/dashboard/student/listening/practice/form-completion",
        estimatedMinutes: 45,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Full listening test simulation",
        href: MODULE_LINKS.listeningTest,
        estimatedMinutes: 40,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Missed answers review & spelling check",
        href: "/dashboard/student/listening/tracker",
        estimatedMinutes: 35,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "Listening sections 1–2 mini-mock",
        href: MODULE_LINKS.listeningTest,
        estimatedMinutes: 25,
      },
    ],
    writing: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "Task 1 & 2 structure, cohesion & band criteria",
        href: MODULE_LINKS.writing,
        estimatedMinutes: 45,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Paragraph planning & linking word drills",
        href: MODULE_LINKS.writing,
        estimatedMinutes: 50,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Task 1 + Task 2 timed submission for AI scoring",
        href: MODULE_LINKS.writing,
        estimatedMinutes: 75,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Feedback review & lexical upgrade exercises",
        href: MODULE_LINKS.vocabulary,
        estimatedMinutes: 40,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "Writing Task 2 only — 40 minutes",
        href: MODULE_LINKS.writing,
        estimatedMinutes: 45,
      },
    ],
    speaking: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "Fluency, coherence & pronunciation strategy",
        href: MODULE_LINKS.speaking,
        estimatedMinutes: 40,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Part 1 & Part 2 cue card drills",
        href: MODULE_LINKS.speakingPart2,
        estimatedMinutes: 45,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Full speaking mock — Parts 1, 2 & 3 recorded",
        href: MODULE_LINKS.speakingMock,
        estimatedMinutes: 20,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Topic vocabulary & self-correction review",
        href: "/dashboard/student/speaking/improvement-plan",
        estimatedMinutes: 35,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "Speaking Part 3 discussion practice",
        href: "/dashboard/student/speaking/part3",
        estimatedMinutes: 25,
      },
    ],
    mock: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "Exam-day timing & section order strategy",
        href: MODULE_LINKS.readingStrategies,
        estimatedMinutes: 40,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Mixed skills timed drills",
        href: MODULE_LINKS.readingPractice,
        estimatedMinutes: 50,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Full writing + speaking submission",
        href: MODULE_LINKS.writing,
        estimatedMinutes: 90,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Targeted weak-skill revision",
        href: MODULE_LINKS.grammarPractice,
        estimatedMinutes: 45,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "Full mock test — all four sections",
        href: MODULE_LINKS.speakingMock,
        estimatedMinutes: 60,
      },
    ],
    grammar: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "Essential tenses & sentence structures for IELTS",
        href: MODULE_LINKS.grammar,
        estimatedMinutes: 45,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Error correction & sentence transformation",
        href: MODULE_LINKS.grammarPractice,
        estimatedMinutes: 40,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Writing Task 2 with grammar focus",
        href: MODULE_LINKS.writing,
        estimatedMinutes: 60,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Grammar error log & vocabulary upgrade",
        href: MODULE_LINKS.vocabulary,
        estimatedMinutes: 35,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "Listening section mini-mock",
        href: MODULE_LINKS.listeningTest,
        estimatedMinutes: 30,
      },
    ],
    format: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "IELTS format, timing & band score system",
        href: MODULE_LINKS.readingStrategies,
        estimatedMinutes: 40,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Sample questions across all four skills",
        href: MODULE_LINKS.readingPractice,
        estimatedMinutes: 45,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Introductory writing task submission",
        href: MODULE_LINKS.writing,
        estimatedMinutes: 50,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Core vocabulary list review",
        href: MODULE_LINKS.vocabulary,
        estimatedMinutes: 35,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "Reading section introduction mock",
        href: MODULE_LINKS.readingTest,
        estimatedMinutes: 25,
      },
    ],
    integration: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "Integrated skills strategy review",
        href: MODULE_LINKS.readingStrategies,
        estimatedMinutes: 40,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Mixed skill practice rotation",
        href: MODULE_LINKS.listeningPractice,
        estimatedMinutes: 50,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Speaking + writing combined session",
        href: MODULE_LINKS.speakingMock,
        estimatedMinutes: 60,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Personal weak areas & vocabulary gaps",
        href: "/dashboard/student/vocabulary/review",
        estimatedMinutes: 40,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "Foundation-level full skills check",
        href: MODULE_LINKS.readingTest,
        estimatedMinutes: 45,
      },
    ],
    precision: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "Band 7+ lexical resource & precision",
        href: MODULE_LINKS.vocabulary,
        estimatedMinutes: 45,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Advanced collocation & paraphrasing",
        href: "/dashboard/student/vocabulary/phrases",
        estimatedMinutes: 45,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Band 7+ writing task submission",
        href: MODULE_LINKS.writing,
        estimatedMinutes: 75,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Nuanced vocabulary & grammar polish",
        href: MODULE_LINKS.grammar,
        estimatedMinutes: 40,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "Reading advanced inference mock",
        href: MODULE_LINKS.readingTest,
        estimatedMinutes: 35,
      },
    ],
    reception: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "Advanced reading & listening strategies",
        href: MODULE_LINKS.readingStrategies,
        estimatedMinutes: 45,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Inference & attitude questions drill",
        href: MODULE_LINKS.readingPractice,
        estimatedMinutes: 50,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Full listening test under exam conditions",
        href: MODULE_LINKS.listeningTest,
        estimatedMinutes: 40,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Tracker review & gap analysis",
        href: "/dashboard/student/reading/tracker",
        estimatedMinutes: 40,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "Listening sections 3–4 mini-mock",
        href: MODULE_LINKS.listeningTest,
        estimatedMinutes: 30,
      },
    ],
    skills: [
      {
        key: "monday",
        dayName: "Monday",
        label: "IELTS strategy + skill input",
        theme: "Weekly IELTS strategy focus",
        href: MODULE_LINKS.readingStrategies,
        estimatedMinutes: 45,
      },
      {
        key: "tuesday",
        dayName: "Tuesday",
        label: "IELTS practice tasks",
        theme: "Targeted skill practice",
        href: MODULE_LINKS.readingPractice,
        estimatedMinutes: 45,
      },
      {
        key: "wednesday",
        dayName: "Wednesday",
        label: "Full IELTS task",
        theme: "Writing or speaking full task",
        href: MODULE_LINKS.writing,
        estimatedMinutes: 60,
      },
      {
        key: "thursday",
        dayName: "Thursday",
        label: "Weak area review + vocabulary",
        theme: "Review & vocabulary building",
        href: MODULE_LINKS.vocabulary,
        estimatedMinutes: 40,
      },
      {
        key: "friday",
        dayName: "Friday",
        label: "Mini IELTS mock",
        theme: "One-section mini mock",
        href: MODULE_LINKS.readingTest,
        estimatedMinutes: 30,
      },
    ],
  };

  return dayConfigs[focus] ?? dayConfigs.skills;
}

export function recommendTrack(placementBand: number | null): AcceleratorTrackId {
  if (placementBand == null || !Number.isFinite(placementBand)) return "plus";
  if (placementBand < 5.0) return "foundation";
  if (placementBand < 6.5) return "plus";
  return "elite";
}

const PURCHASE_SLUG_TO_TRACK: Record<string, AcceleratorTrackId> = {
  "ielts-foundation": "foundation",
  "ielts-plus": "plus",
  "ielts-elite": "elite",
  foundation: "foundation",
  plus: "plus",
  elite: "elite",
};

/** Map course slug or level slug from enrollment to an accelerator track id. */
export function trackFromEnrollmentSlug(
  slug: string | null | undefined
): AcceleratorTrackId | null {
  if (!slug) return null;
  const key = slug.trim().toLowerCase();
  if (isValidTrack(key)) return key;
  return PURCHASE_SLUG_TO_TRACK[key] ?? null;
}

/**
 * Resolve the student's accelerator track.
 * Purchased/enrolled tier wins over placement-band recommendation.
 */
export function resolveAcceleratorTrack(options: {
  acceleratorTrack?: string | null;
  checkoutTrack?: string | null;
  enrolledLevelSlug?: string | null;
  placementBand?: number | null;
}): AcceleratorTrackId {
  const fromUser = trackFromEnrollmentSlug(options.acceleratorTrack);
  if (fromUser) return fromUser;
  const fromCheckout = trackFromEnrollmentSlug(options.checkoutTrack);
  if (fromCheckout) return fromCheckout;
  const fromEnrollment = trackFromEnrollmentSlug(options.enrolledLevelSlug);
  if (fromEnrollment) return fromEnrollment;
  return recommendTrack(options.placementBand ?? null);
}

export function isValidTrack(track: string): track is AcceleratorTrackId {
  return track === "foundation" || track === "plus" || track === "elite";
}

/** Numeric target for gap math and projections (Elite = 7.0 floor). */
export function targetBandNumericFromTrack(trackId: AcceleratorTrackId): number {
  if (trackId === "elite") return 7.0;
  if (trackId === "plus") return 6.5;
  return 5.5;
}

/** Display label for North Star / onboarding (from tier metadata). */
export function targetBandDisplayFromTrack(trackId: AcceleratorTrackId): string {
  const raw = ACCELERATOR_TRACKS[trackId].target;
  const stripped = raw.replace(/^Band\s*/i, "").trim();
  if (trackId === "elite") return stripped.includes("+") ? "7.0+" : stripped;
  if (trackId === "plus") return "6.5";
  if (trackId === "foundation") return "5.5";
  return stripped;
}

/** Purchased or enrolled tier wins; otherwise infer from placement. */
export function resolveTargetBandForStudent(options: {
  acceleratorTrack?: string | null;
  checkoutTrack?: string | null;
  enrolledTrackSlug?: string | null;
  placementBand?: number | null;
  storedTargetBand?: number | null;
}): { trackId: AcceleratorTrackId; targetBand: number; targetLabel: string } {
  const trackId = resolveAcceleratorTrack({
    acceleratorTrack: options.acceleratorTrack,
    checkoutTrack: options.checkoutTrack,
    enrolledLevelSlug: options.enrolledTrackSlug,
    placementBand: options.placementBand,
  });
  const fromTier = targetBandNumericFromTrack(trackId);
  const hasPurchasedTier = Boolean(
    trackFromEnrollmentSlug(options.acceleratorTrack) ||
      trackFromEnrollmentSlug(options.checkoutTrack) ||
      trackFromEnrollmentSlug(options.enrolledTrackSlug)
  );
  return {
    trackId,
    targetBand: hasPurchasedTier ? fromTier : (options.storedTargetBand ?? fromTier),
    targetLabel: targetBandDisplayFromTrack(trackId),
  };
}

export const PROGRESS_STORAGE_KEY = "speakify_accelerator_progress";

export type AcceleratorProgress = {
  track: AcceleratorTrackId;
  currentWeek: number;
  completedDays: Record<string, boolean>;
};

export function dayProgressKey(weekNum: number, dayKey: string) {
  return `${weekNum}-${dayKey}`;
}

export function loadProgress(track: AcceleratorTrackId): AcceleratorProgress {
  if (typeof window === "undefined") {
    return { track, currentWeek: 1, completedDays: {} };
  }
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, AcceleratorProgress>) : {};
    return all[track] ?? { track, currentWeek: 1, completedDays: {} };
  } catch {
    return { track, currentWeek: 1, completedDays: {} };
  }
}

export function saveProgress(progress: AcceleratorProgress) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, AcceleratorProgress>) : {};
    all[progress.track] = progress;
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function weekComplete(
  track: AcceleratorTrackId,
  weekNum: number,
  completedDays: Record<string, boolean>
) {
  const days = getWeekDays(track, weekNum);
  return days.every((d) => completedDays[dayProgressKey(weekNum, d.key)]);
}

export function computeTrackProgress(
  track: AcceleratorTrackId,
  completedDays: Record<string, boolean>
) {
  const meta = ACCELERATOR_TRACKS[track];
  let currentWeek = 1;
  for (let w = 1; w <= meta.weekCount; w += 1) {
    if (weekComplete(track, w, completedDays)) {
      currentWeek = Math.min(w + 1, meta.weekCount);
    } else {
      currentWeek = w;
      break;
    }
  }
  const totalDays = meta.weekCount * 5;
  const done = Object.values(completedDays).filter(Boolean).length;
  const progressPercent = Math.round((done / totalDays) * 100);
  return { currentWeek, progressPercent, weeksComplete: currentWeek - 1 };
}
