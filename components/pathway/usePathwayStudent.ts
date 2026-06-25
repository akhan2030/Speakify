"use client";

import { useEffect, useState } from "react";
import { getContentEngine } from "@/lib/programs";
import type { SkillUnit } from "@/lib/programs/types";
import {
  levelCodeFromId,
  normalizePathwayLevelId,
  PATHWAY_LEVEL_NAMES,
  type PathwayLevelId,
  type PathwaySkill,
} from "@/lib/programs/terminology";

const pathwayEngine = getContentEngine("english_pathway");

export type PathwayStudentContext = {
  loading: boolean;
  programType: "english_pathway";
  levelId: PathwayLevelId;
  levelCode: string;
  levelName: string;
  week: number;
  weekCount: number;
  skillProgress: Record<PathwaySkill, number>;
  graduationReadiness: number;
  recommendedFocus: ReturnType<typeof pathwayEngine.getRecommendedFocus>;
  missionCompleted: number;
  missionTotal: number;
  streak: number;
};

export function usePathwayStudent(): PathwayStudentContext {
  const [state, setState] = useState<PathwayStudentContext>({
    loading: true,
    programType: "english_pathway",
    levelId: "b1_1",
    levelCode: "B1.1",
    levelName: PATHWAY_LEVEL_NAMES.b1_1,
    week: 3,
    weekCount: 5,
    skillProgress: pathwayEngine.getDefaultSkillProgress("b1_1"),
    graduationReadiness: 74,
    recommendedFocus: pathwayEngine.getRecommendedFocus(
      "b1_1",
      3,
      pathwayEngine.getDefaultSkillProgress("b1_1")
    ),
    missionCompleted: 3,
    missionTotal: 5,
    streak: 0,
  });

  useEffect(() => {
    fetch("/api/pathway/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.programType && json.programType !== "english_pathway") {
          console.warn("[pathway] Unexpected programType:", json.programType);
        }

        const levelId = normalizePathwayLevelId(json.levelId ?? json.currentLevel?.level_id);
        const week = json.week ?? json.currentLevel?.week_current ?? 1;
        const weekCount = json.weekCount ?? 5;
        const skillProgress =
          json.skillProgress ?? pathwayEngine.getDefaultSkillProgress(levelId);

        setState({
          loading: false,
          programType: "english_pathway",
          levelId,
          levelCode: levelCodeFromId(levelId),
          levelName: PATHWAY_LEVEL_NAMES[levelId],
          week,
          weekCount,
          skillProgress,
          graduationReadiness:
            json.graduationReadiness ??
            pathwayEngine.getGraduationReadiness(skillProgress),
          recommendedFocus:
            json.recommendedFocus ??
            pathwayEngine.getRecommendedFocus(levelId, week, skillProgress),
          missionCompleted: json.missionCompleted ?? 0,
          missionTotal: json.missionTotal ?? 5,
          streak: json.streak?.current_streak ?? json.streak ?? 0,
        });
      })
      .catch(() => setState((s) => ({ ...s, loading: false })));
  }, []);

  return state;
}

export function getStoredTaskProgress(taskId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(`pathway-task-${taskId}`);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function setStoredTaskProgress(taskId: string, percent: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`pathway-task-${taskId}`, String(percent));
}

export type TaskWithProgress = SkillUnit & {
  progressPercent: number;
  completed: boolean;
};

export function attachTaskProgress(units: SkillUnit[]): TaskWithProgress[] {
  return units.map((u) => {
    const progressPercent = getStoredTaskProgress(u.id);
    return {
      ...u,
      progressPercent,
      completed: progressPercent >= 100,
    };
  });
}
