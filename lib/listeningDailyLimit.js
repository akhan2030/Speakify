/** Set LISTENING_ENFORCE_DAILY_LIMITS=true to cap student attempts. */
export function isListeningUnlimitedEnabled() {
  return process.env.LISTENING_ENFORCE_DAILY_LIMITS !== "true";
}

export const MAX_DAILY_SECTION_TESTS = 10;
export const MAX_DAILY_MOCK_TESTS = 10;
export const MAX_DAILY_PRACTICE_TESTS = 15;

/**
 * @param {object} [record]
 */
export function buildListeningDailyLimitResponse(record = {}) {
  const sectionUsed = Number(record.section_tests_taken ?? 0);
  const mockUsed = Number(record.mock_tests_taken ?? record.tests_taken ?? 0);
  const practiceUsed = Number(record.practice_tests_taken ?? 0);

  const sectionRemaining = Math.max(0, MAX_DAILY_SECTION_TESTS - sectionUsed);
  const mockRemaining = Math.max(0, MAX_DAILY_MOCK_TESTS - mockUsed);
  const practiceRemaining = Math.max(0, MAX_DAILY_PRACTICE_TESTS - practiceUsed);

  return {
    sectionTestsUsed: sectionUsed,
    sectionTestsRemaining: sectionRemaining,
    sectionTestsMax: MAX_DAILY_SECTION_TESTS,
    mockTestsUsed: mockUsed,
    mockTestsRemaining: mockRemaining,
    mockTestsMax: MAX_DAILY_MOCK_TESTS,
    practiceTestsUsed: practiceUsed,
    practiceTestsRemaining: practiceRemaining,
    practiceTestsMax: MAX_DAILY_PRACTICE_TESTS,
    canTakeSection: sectionUsed < MAX_DAILY_SECTION_TESTS,
    canTakeMock: mockUsed < MAX_DAILY_MOCK_TESTS,
    canTakePractice: practiceUsed < MAX_DAILY_PRACTICE_TESTS,
  };
}

export function buildUnlimitedListeningDailyLimitResponse() {
  return {
    unlimited: true,
    sectionTestsUsed: 0,
    sectionTestsRemaining: MAX_DAILY_SECTION_TESTS,
    sectionTestsMax: MAX_DAILY_SECTION_TESTS,
    mockTestsUsed: 0,
    mockTestsRemaining: MAX_DAILY_MOCK_TESTS,
    mockTestsMax: MAX_DAILY_MOCK_TESTS,
    practiceTestsUsed: 0,
    practiceTestsRemaining: MAX_DAILY_PRACTICE_TESTS,
    practiceTestsMax: MAX_DAILY_PRACTICE_TESTS,
    canTakeSection: true,
    canTakeMock: true,
    canTakePractice: true,
  };
}
