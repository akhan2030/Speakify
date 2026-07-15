import { B1_1_UNIT_1, type ClassroomUnitContent } from "./b1-1-unit1";
import {
  B1_1_UNIT_THEMES,
  getClassroomLevel,
  type ClassroomLevelCode,
} from "./levels";
import { isQuizAnswerCorrect } from "./quiz";

export type ClassroomUnitSummary = {
  levelCode: ClassroomLevelCode;
  unitNumber: number;
  theme: string;
  grammarFocus: string;
  status: "published" | "draft" | "placeholder";
  hasFullContent: boolean;
};

const CONTENT_REGISTRY: Record<string, ClassroomUnitContent> = {
  "B1.1:1": B1_1_UNIT_1,
};

export function unitContentKey(levelCode: string, unitNumber: number): string {
  return `${levelCode}:${unitNumber}`;
}

export function getUnitContent(
  levelCode: string,
  unitNumber: number
): ClassroomUnitContent | null {
  return CONTENT_REGISTRY[unitContentKey(levelCode, unitNumber)] ?? null;
}

export function listUnitsForLevel(
  levelCode: ClassroomLevelCode
): ClassroomUnitSummary[] {
  if (levelCode === "B1.1") {
    return B1_1_UNIT_THEMES.map((u) => {
      const full = getUnitContent("B1.1", u.unitNumber);
      return {
        levelCode: "B1.1" as const,
        unitNumber: u.unitNumber,
        theme: u.theme,
        grammarFocus: u.grammarFocus,
        status: full ? full.status : "placeholder",
        hasFullContent: Boolean(full),
      };
    });
  }

  return Array.from({ length: 8 }, (_, i) => ({
    levelCode,
    unitNumber: i + 1,
    theme: `Unit ${i + 1} (coming soon)`,
    grammarFocus: "",
    status: "placeholder" as const,
    hasFullContent: false,
  }));
}

export function scoreClassroomQuiz(
  levelCode: string,
  unitNumber: number,
  answers: Record<string, string>
): { score: number; maxScore: number; results: Record<string, boolean> } {
  const unit = getUnitContent(levelCode, unitNumber);
  if (!unit) {
    return { score: 0, maxScore: 0, results: {} };
  }

  const results: Record<string, boolean> = {};
  let score = 0;
  const maxScore = unit.quiz.questions.length;

  for (const q of unit.quiz.questions) {
    const key = String(q.id);
    const ok = isQuizAnswerCorrect(q, answers[key]);
    results[key] = ok;
    if (ok) score += 1;
  }

  return { score, maxScore, results };
}

export function assertLevelExists(code: string) {
  const level = getClassroomLevel(code);
  if (!level) throw new Error(`Unknown classroom level: ${code}`);
  return level;
}
