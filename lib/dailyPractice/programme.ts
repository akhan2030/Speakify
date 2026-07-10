export type DailyPracticeProgramme = "ielts" | "ielts_general";

export function parseDailyPracticeProgramme(
  value: string | null | undefined
): DailyPracticeProgramme {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "ielts_general" || raw === "general" || raw === "gt") {
    return "ielts_general";
  }
  return "ielts";
}

export function isGeneralTrainingProgramme(
  programme: DailyPracticeProgramme
): boolean {
  return programme === "ielts_general";
}
