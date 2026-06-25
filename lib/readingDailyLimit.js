export const MAX_DAILY_MOCK_TESTS = 10;
export const MAX_DAILY_PASSAGE_TESTS = 15;
export const MAX_DAILY_PRACTICE_TESTS = 15;

export const TEST_COUNTED_STORAGE_KEYS = {
  mock: "reading_mock_test_counted",
  passage: "reading_passage_test_counted",
  practice: "reading_practice_test_counted",
};

/** @deprecated use TEST_COUNTED_STORAGE_KEYS.mock */
export const TEST_COUNTED_STORAGE_KEY = TEST_COUNTED_STORAGE_KEYS.mock;

/**
 * @returns {string} YYYY-MM-DD in local timezone
 */
export function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * @returns {number}
 */
export function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

/**
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatMidnightCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * @param {string} studentId
 * @param {"mock"|"passage"|"practice"} testType
 */
export function hasTestBeenCountedToday(studentId, testType = "mock") {
  if (typeof window === "undefined" || !studentId) return false;
  const key = TEST_COUNTED_STORAGE_KEYS[testType] ?? TEST_COUNTED_STORAGE_KEYS.mock;
  try {
    const raw = sessionStorage.getItem(key);
    return raw === `${studentId}:${getTodayDateKey()}`;
  } catch {
    return false;
  }
}

/**
 * @param {string} studentId
 * @param {"mock"|"passage"|"practice"} testType
 */
export function markTestCountedToday(studentId, testType = "mock") {
  if (typeof window === "undefined" || !studentId) return;
  const key = TEST_COUNTED_STORAGE_KEYS[testType] ?? TEST_COUNTED_STORAGE_KEYS.mock;
  try {
    sessionStorage.setItem(key, `${studentId}:${getTodayDateKey()}`);
  } catch {
    // ignore
  }
}

/**
 * @param {object} [record]
 */
export function buildSeparateDailyLimitResponse(record = {}) {
  const mockUsed = Number(
    record.mock_tests_taken ?? record.tests_taken ?? 0
  );
  const passageUsed = Number(record.passage_tests_taken ?? 0);
  const practiceUsed = Number(record.practice_tests_taken ?? 0);

  const mockRemaining = Math.max(0, MAX_DAILY_MOCK_TESTS - mockUsed);
  const passageRemaining = Math.max(0, MAX_DAILY_PASSAGE_TESTS - passageUsed);
  const practiceRemaining = Math.max(0, MAX_DAILY_PRACTICE_TESTS - practiceUsed);

  return {
    mockTestsUsed: mockUsed,
    mockTestsRemaining: mockRemaining,
    mockTestsMax: MAX_DAILY_MOCK_TESTS,
    canTakeMockTest: mockUsed < MAX_DAILY_MOCK_TESTS,

    passageTestsUsed: passageUsed,
    passageTestsRemaining: passageRemaining,
    passageTestsMax: MAX_DAILY_PASSAGE_TESTS,
    canTakePassageTest: passageUsed < MAX_DAILY_PASSAGE_TESTS,

    practiceTestsUsed: practiceUsed,
    practiceTestsRemaining: practiceRemaining,
    practiceTestsMax: MAX_DAILY_PRACTICE_TESTS,
    canTakePracticeTest: practiceUsed < MAX_DAILY_PRACTICE_TESTS,

    resetTime: "midnight tonight",
    secondsUntilReset: getSecondsUntilMidnight(),

    testsUsed: mockUsed,
    testsRemaining: mockRemaining,
    maxTests: MAX_DAILY_MOCK_TESTS,
    canTakeTest: mockUsed < MAX_DAILY_MOCK_TESTS,
  };
}

export function buildUnlimitedDailyLimitResponse() {
  return {
    ...buildSeparateDailyLimitResponse({
      mock_tests_taken: 0,
      passage_tests_taken: 0,
      practice_tests_taken: 0,
    }),
    unlimited: true,
    canTakeMockTest: true,
    canTakePassageTest: true,
    canTakePracticeTest: true,
    canTakeTest: true,
  };
}

/** @deprecated */
export function buildDailyLimitResponse(testsUsed) {
  return buildSeparateDailyLimitResponse({
    mock_tests_taken: testsUsed,
    tests_taken: testsUsed,
  });
}
