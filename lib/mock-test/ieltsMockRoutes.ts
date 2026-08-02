/** Canonical IELTS Academic full-mock routes — do not reuse STEP or legacy /mock-test paths. */

export const IELTS_MOCK_LOBBY_PATH = "/dashboard/ielts/student/mock-exam";
export const IELTS_MOCK_EXAM_PATH = `${IELTS_MOCK_LOBBY_PATH}/exam`;

/** Canonical IELTS General Training full-mock routes. */
export const GT_MOCK_LOBBY_PATH = "/dashboard/ielts-general/student/mock-exam";
export const GT_MOCK_EXAM_PATH = `${GT_MOCK_LOBBY_PATH}/exam`;

export function ieltsMockLobbyHref(mockNumber?: number): string {
  if (mockNumber == null || !Number.isFinite(mockNumber)) {
    return IELTS_MOCK_LOBBY_PATH;
  }
  return `${IELTS_MOCK_LOBBY_PATH}?mock=${mockNumber}`;
}

export function gtMockLobbyHref(mockNumber?: number): string {
  if (mockNumber == null || !Number.isFinite(mockNumber)) {
    return GT_MOCK_LOBBY_PATH;
  }
  return `${GT_MOCK_LOBBY_PATH}?mock=${mockNumber}`;
}

export function ieltsMockExamHref(input: {
  mockNumber: number;
  testId?: string | number | null;
}): string {
  const params = new URLSearchParams({ mock: String(input.mockNumber) });
  if (input.testId != null && String(input.testId).trim()) {
    params.set("testId", String(input.testId));
  }
  return `${IELTS_MOCK_EXAM_PATH}?${params.toString()}`;
}

export function gtMockExamHref(input: {
  mockNumber: number;
  attemptId?: string | number | null;
}): string {
  const params = new URLSearchParams({ mock: String(input.mockNumber) });
  if (input.attemptId != null && String(input.attemptId).trim()) {
    params.set("attemptId", String(input.attemptId));
  }
  return `${GT_MOCK_EXAM_PATH}?${params.toString()}`;
}

export function isIeltsAcademicMockPath(pathname: string): boolean {
  return (
    pathname === IELTS_MOCK_LOBBY_PATH ||
    pathname.startsWith(`${IELTS_MOCK_LOBBY_PATH}/`)
  );
}

export function isIeltsGeneralMockPath(pathname: string): boolean {
  return (
    pathname === GT_MOCK_LOBBY_PATH ||
    pathname.startsWith(`${GT_MOCK_LOBBY_PATH}/`)
  );
}
