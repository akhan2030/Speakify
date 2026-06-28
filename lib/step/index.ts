/** Re-export STEP exam model for convenient imports */
export {
  STEP_EXAM_ID,
  STEP_EXAM_MODEL,
  STEP_SECTIONS,
  getStepSectionQuestionCounts,
  getStepSectionTimeBudgets,
  stepScoreBand,
} from "./examModel";

export {
  STEP_ACCELERATOR_NAME,
  STEP_PHASES,
  STEP_TOTAL_WEEKS,
  diagnosticStartingPhase,
  getPhaseDefinition,
} from "./phases";

export { STEP_STUDENT_BASE, STEP_ROUTES } from "./paths";

export type { StepExamModel, StepSection, StepSectionId } from "./examModel";
export type {
  StepMcqQuestion,
  StepMockExam,
  StepPracticeSet,
  StepReadingPassage,
  StepListeningRecording,
} from "./types";
