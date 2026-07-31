/** Canonical IELTS Academic full-mock routes — do not reuse STEP or legacy /mock-test paths. */

export const IELTS_MOCK_LOBBY_PATH = "/dashboard/ielts/student/mock-exam";
export const IELTS_MOCK_EXAM_PATH = `${IELTS_MOCK_LOBBY_PATH}/exam`;

export function ieltsMockLobbyHref(mockNumber?: number): string {
  if (mockNumber == null || !Number.isFinite(mockNumber)) {
    return IELTS_MOCK_LOBBY_PATH;
  }
  return `${IELTS_MOCK_LOBBY_PATH}?mock=${mockNumber}`;
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

export function isIeltsAcademicMockPath(pathname: string): boolean {
  return (
    pathname === IELTS_MOCK_LOBBY_PATH ||
    pathname.startsWith(`${IELTS_MOCK_LOBBY_PATH}/`)
  );
}
