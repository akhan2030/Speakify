export const STEP_STUDENT_BASE = "/dashboard/step/student";

export const STEP_ROUTES = {
  home: STEP_STUDENT_BASE,
  diagnostic: `${STEP_STUDENT_BASE}/diagnostic`,
  myJourney: `${STEP_STUDENT_BASE}/my-journey`,
  accelerator: `${STEP_STUDENT_BASE}/my-journey`,
  weeklyPlan: `${STEP_STUDENT_BASE}/weekly-plan`,
  practice: (section: string) => `${STEP_STUDENT_BASE}/practice/${section}`,
  miniMocks: `${STEP_STUDENT_BASE}/mini-mocks`,
  mockExam: `${STEP_STUDENT_BASE}/mock-exam`,
  progress: `${STEP_STUDENT_BASE}/progress`,
  history: `${STEP_STUDENT_BASE}/history`,
  vocabulary: `${STEP_STUDENT_BASE}/vocabulary`,
  grammarDrills: `${STEP_STUDENT_BASE}/grammar-drills`,
  settings: `${STEP_STUDENT_BASE}/settings`,
  phaseExit: `${STEP_STUDENT_BASE}/phase-exit`,
} as const;
