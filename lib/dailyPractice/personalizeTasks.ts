import type { StudentProfile } from "@/lib/course/studentProfile";
import { getSkillLabel } from "@/lib/course/studentProfile";
import {
  PRACTICE_SKILLS,
  type PracticeSkill,
  type PracticeTaskLike,
  getTodayDateKey,
} from "@/lib/dailyPractice/ensureSkillCoverage";
import { buildPracticeHref } from "@/lib/dailyPractice/buildPracticeHref";
import type { DailyPracticeProgramme } from "@/lib/dailyPractice/programme";
import { isGeneralTrainingProgramme } from "@/lib/dailyPractice/programme";

export type WeaknessSignals = {
  programme?: DailyPracticeProgramme;
  focusSkills: string[];
  weakSkills: string[];
  placementWeak: string[];
  bySkill: Record<
    PracticeSkill,
    | {
        reason?: string;
        questionType?: string | null;
        questionTypeId?: string | null;
        readingSection?: string | null;
        category?: string | null;
        topic?: string | null;
        taskType?: string | null;
        letterType?: string | null;
        label?: string;
      }
    | null
    | undefined
  >;
};

function skillKey(task: PracticeTaskLike): PracticeSkill | "" {
  return String(task.skill ?? "").toLowerCase() as PracticeSkill | "";
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function scoreTaskForSkill(
  task: PracticeTaskLike,
  skill: PracticeSkill,
  signals: WeaknessSignals,
  profile: StudentProfile
): number {
  let score = 0;
  const focus = signals.bySkill[skill];
  const title = normalizeToken(String(task.title ?? ""));
  const topic = normalizeToken(String(task.topic ?? ""));
  const taskType = normalizeToken(String(task.task_type ?? task.taskType ?? ""));

  if (task.source === "published") score += 8;
  else if (task.source === "draft") score += 6;
  else score += 2;

  if (signals.focusSkills.includes(skill)) score += 18;
  if (signals.weakSkills.includes(skill)) score += 14;
  if (signals.placementWeak.includes(skill)) score += 10;

  const band = profile.skillBands[skill as keyof StudentProfile["skillBands"]];
  if (band != null && band < profile.targetBand - 0.5) {
    score += 12;
  }

  if (!focus) return score;

  if (skill === "reading" && focus) {
    if ("readingSection" in focus && focus.readingSection) {
      const section = normalizeToken(String(focus.readingSection).replace(/-/g, " "));
      if (title.includes(section) || topic.includes(section)) score += 35;
    }
    if (focus.questionType) {
      const slug = normalizeToken(String(focus.questionType).replace(/-/g, " "));
      if (title.includes(slug) || taskType.includes(slug)) score += 35;
    }
    if (focus.label && title.includes(normalizeToken(focus.label))) score += 20;
  }

  if (skill === "listening" && focus.questionTypeId) {
    const slug = normalizeToken(String(focus.questionTypeId).replace(/-/g, " "));
    if (title.includes(slug) || taskType.includes(slug)) score += 35;
    if (focus.label && title.includes(normalizeToken(focus.label))) score += 20;
  }

  if (skill === "grammar" && focus.category) {
    const category = normalizeToken(String(focus.category).replace(/-/g, " "));
    if (topic.includes(category) || title.includes(category)) score += 35;
    if (focus.label && title.includes(normalizeToken(focus.label))) score += 20;
  }

  if (skill === "vocabulary" && focus.topic) {
    const vocabTopic = normalizeToken(String(focus.topic).replace(/_/g, " "));
    if (topic.includes(vocabTopic) || title.includes(vocabTopic)) score += 40;
  }

  if (skill === "writing" && focus.taskType) {
    if (title.includes(normalizeToken(String(focus.taskType)))) score += 30;
    if (focus.taskType === "task1" && title.includes("task 1")) score += 25;
    if (focus.taskType === "task2" && title.includes("task 2")) score += 25;
  }

  if (skill === "speaking" && focus.reason) {
    const reason = normalizeToken(focus.reason);
    if (title.includes("part 2") && reason.includes("fluency")) score += 10;
    if (title.includes("part 3") && reason.includes("lexical")) score += 10;
    if (title.includes("daily") || title.includes("sarah")) score += 8;
  }

  return score;
}

function buildPersonalizedTitle(
  skill: PracticeSkill,
  task: PracticeTaskLike,
  focus: WeaknessSignals["bySkill"][PracticeSkill],
  programme: DailyPracticeProgramme = "ielts"
): string {
  if (!focus?.reason) return String(task.title ?? getSkillLabel(skill));

  const base = String(task.title ?? `${getSkillLabel(skill)} practice`);
  if (base.toLowerCase().includes("your focus") || base.toLowerCase().includes("weak area")) {
    return base;
  }

  const gt = isGeneralTrainingProgramme(programme);

  if (skill === "reading" && focus.label) {
    return gt
      ? `GT ${focus.label} — your weak area`
      : `Reading: ${focus.label} — your weak area`;
  }
  if (skill === "listening" && focus.label) {
    return gt
      ? `GT Listening: ${focus.label} — your weak area`
      : `Listening: ${focus.label} — your weak area`;
  }
  if (skill === "grammar" && focus.label) {
    return gt
      ? `GT Grammar: ${focus.label} — targeted drill`
      : `Grammar: ${focus.label} — targeted drill`;
  }
  if (skill === "vocabulary" && focus.topic) {
    return `Vocabulary: ${String(focus.topic).replace(/_/g, " ")} — review weak words`;
  }
  if (skill === "writing") {
    if (gt && "letterType" in focus && focus.letterType) {
      return `GT Task 1 letter — ${String(focus.letterType).replace(/([A-Z])/g, " $1").trim()} focus`;
    }
    if (focus.taskType === "task1") {
      return gt
        ? "GT Task 1 letter — strengthen your weakest area"
        : "Writing Task 1 — strengthen your weakest criterion";
    }
    return gt
      ? "GT Task 2 essay — strengthen your weakest area"
      : "Writing Task 2 — strengthen your weakest criterion";
  }
  if (skill === "speaking") {
    return gt
      ? "GT Speaking with Sarah — focused on your last feedback"
      : "Speaking with Sarah — focused on your last feedback";
  }

  return base;
}

function pickTaskForSkill(
  candidates: PracticeTaskLike[],
  skill: PracticeSkill,
  signals: WeaknessSignals,
  profile: StudentProfile
): PracticeTaskLike {
  if (!candidates.length) {
    return {
      id: `personalized-${skill}-${getTodayDateKey()}`,
      skill,
      title: `${getSkillLabel(skill)} practice`,
      source: "rotation",
    };
  }

  const ranked = [...candidates].sort(
    (a, b) =>
      scoreTaskForSkill(b, skill, signals, profile) -
      scoreTaskForSkill(a, skill, signals, profile)
  );

  return ranked[0];
}

export function personalizeDailyPracticeTasks(
  tasks: PracticeTaskLike[],
  options: {
    profile: StudentProfile;
    signals: WeaknessSignals;
    cefrLevel: string;
  }
): {
  tasks: PracticeTaskLike[];
  topFocus: string | null;
  personalizedCount: number;
} {
  const { profile, signals, cefrLevel } = options;
  const programme = signals.programme ?? "ielts";
  const grouped = new Map<PracticeSkill, PracticeTaskLike[]>();

  for (const task of tasks) {
    const skill = skillKey(task);
    if (!skill || !PRACTICE_SKILLS.includes(skill)) continue;
    const list = grouped.get(skill) ?? [];
    list.push(task);
    grouped.set(skill, list);
  }

  const personalized: PracticeTaskLike[] = [];
  let personalizedCount = 0;

  for (const skill of PRACTICE_SKILLS) {
    const candidates = grouped.get(skill) ?? [];
    const picked = pickTaskForSkill(candidates, skill, signals, profile);
    const focus = signals.bySkill[skill];
    const practiceHref = buildPracticeHref(skill, focus ?? null, programme);
    const focusReason =
      focus?.reason ??
      (signals.weakSkills.includes(skill)
        ? `${getSkillLabel(skill)} is below your target band — extra practice today`
        : signals.focusSkills.includes(skill)
          ? `Priority skill for your study plan`
          : null);

    const isPersonalized = Boolean(
      focusReason &&
        (focus ||
          signals.weakSkills.includes(skill) ||
          signals.focusSkills.includes(skill))
    );

    if (isPersonalized) personalizedCount += 1;

    personalized.push({
      ...picked,
      skill,
      title: buildPersonalizedTitle(skill, picked, focus, programme),
      topic:
        skill === "vocabulary" && focus?.topic
          ? String(focus.topic)
          : skill === "reading" &&
              focus &&
              "readingSection" in focus &&
              focus.readingSection
            ? String(focus.readingSection)
            : picked.topic,
      cefr_level: picked.cefr_level ?? cefrLevel,
      cefrLevel: picked.cefrLevel ?? picked.cefr_level ?? cefrLevel,
      practiceHref,
      focusReason,
      isPersonalized,
      priority: signals.focusSkills.indexOf(skill),
    });
  }

  const topFocus =
    signals.focusSkills[0] && signals.bySkill[signals.focusSkills[0] as PracticeSkill]
      ? signals.bySkill[signals.focusSkills[0] as PracticeSkill]?.reason ??
        `${getSkillLabel(signals.focusSkills[0])} needs the most work`
      : signals.weakSkills[0]
        ? `${getSkillLabel(signals.weakSkills[0])} is your weakest skill`
        : null;

  return {
    tasks: personalized,
    topFocus,
    personalizedCount,
  };
}
