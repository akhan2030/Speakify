import type { StepSectionId } from "./examModel";
import { STEP_SECTIONS } from "./examModel";
import { getPhaseDefinition } from "./phases";
import { STEP_ROUTES } from "./paths";

export type StepMissionTask = {
  id: string;
  title: string;
  minutes: number;
  href: string;
  section?: StepSectionId;
  taskType: "practice" | "mock" | "diagnostic" | "phase_exit" | "review";
};

export function todayMissionTasks(input: {
  currentPhase: number;
  currentWeek: number;
  diagnosticDone: boolean;
  phaseExitDue: boolean;
  weakestSection: StepSectionId | null;
}): StepMissionTask[] {
  const tasks: StepMissionTask[] = [];

  if (!input.diagnosticDone) {
    tasks.push({
      id: "diagnostic",
      title: "Complete STEP diagnostic (20 questions)",
      minutes: 25,
      href: STEP_ROUTES.diagnostic,
      taskType: "diagnostic",
    });
    return tasks;
  }

  if (input.phaseExitDue) {
    tasks.push({
      id: "phase-exit",
      title: `Phase ${input.currentPhase} exit check`,
      minutes: 30,
      href: `${STEP_ROUTES.phaseExit}?phase=${input.currentPhase}`,
      taskType: "phase_exit",
    });
  }

  const phase = getPhaseDefinition(input.currentPhase);
  const focus = phase?.focusSections ?? ["reading", "structure"];

  focus.forEach((section, i) => {
    const spec = STEP_SECTIONS[section];
    tasks.push({
      id: `practice-${section}`,
      title: `${spec.label} drill`,
      minutes: section === "reading" ? 20 : 15,
      href: `${STEP_ROUTES.practice(section)}`,
      section,
      taskType: "practice",
    });
    if (i === 0 && tasks.length < 3) return;
  });

  if (input.weakestSection && !focus.includes(input.weakestSection)) {
    tasks.push({
      id: `weak-${input.weakestSection}`,
      title: `Weak-area: ${STEP_SECTIONS[input.weakestSection].label}`,
      minutes: 15,
      href: `${STEP_ROUTES.practice(input.weakestSection)}`,
      section: input.weakestSection,
      taskType: "review",
    });
  }

  if (input.currentPhase >= 3) {
    tasks.push({
      id: "mock",
      title: "Timed STEP mock section",
      minutes: 45,
      href: STEP_ROUTES.mockExam,
      taskType: "mock",
    });
  }

  return tasks.slice(0, 4);
}
