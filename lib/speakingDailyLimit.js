export const MAX_DAILY_PART_SESSIONS = 10;
export const MAX_DAILY_MOCK_TESTS = 5;

/**
 * @param {object} [record]
 */
export function buildSpeakingDailyLimitResponse(record = {}) {
  const part1Used = Number(record.part1_sessions_taken ?? 0);
  const part2Used = Number(record.part2_sessions_taken ?? 0);
  const part3Used = Number(record.part3_sessions_taken ?? 0);
  const mockUsed = Number(record.mock_tests_taken ?? record.tests_taken ?? 0);

  const partLimit = (used) => ({
    used,
    max: MAX_DAILY_PART_SESSIONS,
    remaining: Math.max(0, MAX_DAILY_PART_SESSIONS - used),
    canTake: used < MAX_DAILY_PART_SESSIONS,
  });

  const mockLimit = {
    used: mockUsed,
    max: MAX_DAILY_MOCK_TESTS,
    remaining: Math.max(0, MAX_DAILY_MOCK_TESTS - mockUsed),
    canTake: mockUsed < MAX_DAILY_MOCK_TESTS,
  };

  return {
    part1: partLimit(part1Used),
    part2: partLimit(part2Used),
    part3: partLimit(part3Used),
    mock: mockLimit,
    canTakeTest: mockLimit.canTake,
    testsUsed: mockUsed,
    testsRemaining: mockLimit.remaining,
    maxTests: MAX_DAILY_MOCK_TESTS,
  };
}

export function buildUnlimitedSpeakingDailyLimitResponse() {
  const unlimitedPart = {
    used: 0,
    max: MAX_DAILY_PART_SESSIONS,
    remaining: MAX_DAILY_PART_SESSIONS,
    canTake: true,
  };
  return {
    unlimited: true,
    part1: unlimitedPart,
    part2: unlimitedPart,
    part3: unlimitedPart,
    mock: {
      used: 0,
      max: MAX_DAILY_MOCK_TESTS,
      remaining: MAX_DAILY_MOCK_TESTS,
      canTake: true,
    },
    canTakeTest: true,
    testsUsed: 0,
    testsRemaining: MAX_DAILY_MOCK_TESTS,
    maxTests: MAX_DAILY_MOCK_TESTS,
  };
}
