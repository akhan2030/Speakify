import { isValidQuestionType } from "@/lib/readingPassageTypes";
import type { PracticeSkill } from "@/lib/dailyPractice/ensureSkillCoverage";
import type { DailyPracticeProgramme } from "@/lib/dailyPractice/programme";
import { isGeneralTrainingProgramme } from "@/lib/dailyPractice/programme";

export type SkillFocusHints = {
  reading?: {
    questionType?: string | null;
    readingSection?: string | null;
  } | null;
  listening?: { questionTypeId?: string | null } | null;
  grammar?: { category?: string | null } | null;
  speaking?: { criterion?: string | null } | null;
  writing?: {
    taskType?: string | null;
    letterType?: string | null;
  } | null;
  vocabulary?: { topic?: string | null } | null;
};

export function buildPracticeHref(
  skill: PracticeSkill,
  focus?: SkillFocusHints[keyof SkillFocusHints] | null,
  programme: DailyPracticeProgramme = "ielts"
): string {
  const isGt = isGeneralTrainingProgramme(programme);

  switch (skill) {
    case "reading": {
      if (isGt) {
        const section =
          focus && "readingSection" in focus && focus.readingSection
            ? String(focus.readingSection).replace(/^section-?/i, "section-").toLowerCase()
            : null;
        if (section === "section-a" || section === "section-b" || section === "section-c") {
          return `/reading/practice/${section}`;
        }
        return "/reading/practice";
      }

      const slug = focus && "questionType" in focus ? focus.questionType : null;
      if (slug && isValidQuestionType(slug)) {
        return `/reading/practice/${slug}`;
      }
      return "/reading";
    }
    case "listening": {
      const typeId =
        focus && "questionTypeId" in focus ? focus.questionTypeId : null;
      if (typeId) {
        return `/listening?focus=${encodeURIComponent(typeId)}`;
      }
      return "/listening";
    }
    case "grammar": {
      const category = focus && "category" in focus ? focus.category : null;
      const params = new URLSearchParams();
      if (isGt) params.set("programme", "general");
      if (category) params.set("focus", category);
      const query = params.toString();
      return query ? `/grammar/practice?${query}` : "/grammar/practice";
    }
    case "speaking":
      return "/speaking";
    case "writing": {
      if (isGt) {
        const letterType =
          focus && "letterType" in focus ? focus.letterType : null;
        if (letterType === "formal" || letterType === "semiFormal" || letterType === "informal") {
          return "/letter-practice";
        }
        const taskType =
          focus && "taskType" in focus && focus.taskType === "task2" ? "task2" : "task1";
        return `/writing?tab=${taskType}`;
      }

      const taskType =
        focus && "taskType" in focus && focus.taskType === "task1"
          ? "task1"
          : "task2";
      return `/writing?task=${taskType}`;
    }
    case "vocabulary": {
      const topic = focus && "topic" in focus ? focus.topic : null;
      if (topic) {
        return `/vocabulary/study?topic=${encodeURIComponent(topic)}`;
      }
      return isGt ? "/vocabulary/study?track=ielts_general" : "/vocabulary/study";
    }
    default:
      return "/practice";
  }
}
