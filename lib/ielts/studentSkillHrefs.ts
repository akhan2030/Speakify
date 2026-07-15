import type { IeltsProgramVariant } from "@/lib/programs/ieltsProgramIdentity";

const ACADEMIC_BASE = "/dashboard/ielts/student";
const GT_BASE = "/dashboard/ielts-general/student";

export function getIeltsStudentBase(variant: IeltsProgramVariant): string {
  return variant === "ielts_general" ? GT_BASE : ACADEMIC_BASE;
}

/** Programme-correct Writing hub — GT Task 1 is always a letter, never a chart. */
export function getIeltsWritingHref(variant: IeltsProgramVariant): string {
  return `${getIeltsStudentBase(variant)}/writing`;
}

export function getIeltsSkillHref(
  variant: IeltsProgramVariant,
  skill: "writing" | "speaking" | "reading" | "listening" | "vocabulary" | "grammar"
): string {
  return `${getIeltsStudentBase(variant)}/${skill}`;
}
