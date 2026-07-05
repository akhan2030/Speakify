import {
  hasTestBeenCountedToday,
  markTestCountedToday,
} from "./readingDailyLimit";

export type DailyLimitState = {
  unlimited?: boolean;
  mockTestsUsed: number;
  mockTestsRemaining: number;
  mockTestsMax: number;
  canTakeMockTest: boolean;
  passageTestsUsed: number;
  passageTestsRemaining: number;
  passageTestsMax: number;
  canTakePassageTest: boolean;
  practiceTestsUsed: number;
  practiceTestsRemaining: number;
  practiceTestsMax: number;
  canTakePracticeTest: boolean;
};

export type TestTypeKey = "mock" | "passage" | "practice";

/**
 * Fetch daily limits and optionally increment once per session.
 */
export async function initDailyLimit(
  studentId: string,
  testType: TestTypeKey
): Promise<{ limits: DailyLimitState; allowed: boolean }> {
  const getRes = await fetch(
    `/api/reading/daily-limit?studentId=${encodeURIComponent(studentId)}`
  );
  const limits = (await getRes.json().catch(() => null)) as DailyLimitState | null;

  if (!limits) {
    return {
      limits: {
        mockTestsUsed: 0,
        mockTestsRemaining: 10,
        mockTestsMax: 10,
        canTakeMockTest: true,
        passageTestsUsed: 0,
        passageTestsRemaining: 15,
        passageTestsMax: 15,
        canTakePassageTest: true,
        practiceTestsUsed: 0,
        practiceTestsRemaining: 15,
        practiceTestsMax: 15,
        canTakePracticeTest: true,
      },
      allowed: true,
    };
  }

  if (limits.unlimited) {
    return { limits, allowed: true };
  }

  const canTake =
    testType === "mock"
      ? limits.canTakeMockTest
      : testType === "passage"
        ? limits.canTakePassageTest
        : limits.canTakePracticeTest;

  if (!canTake) {
    return { limits, allowed: false };
  }

  if (hasTestBeenCountedToday(studentId, testType)) {
    return { limits, allowed: true };
  }

  const postRes = await fetch("/api/reading/daily-limit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, testType }),
  });
  const postData = (await postRes.json().catch(() => null)) as
    | (DailyLimitState & { success?: boolean })
    | null;

  if (postData && postRes.ok && postData.success !== false) {
    markTestCountedToday(studentId, testType);
    const stillAllowed =
      testType === "mock"
        ? postData.canTakeMockTest
        : testType === "passage"
          ? postData.canTakePassageTest
          : postData.canTakePracticeTest;
    return { limits: postData, allowed: stillAllowed };
  }

  return { limits, allowed: canTake };
}

export type PracticePassage = {
  passageId: string;
  slug: string;
  name: string;
  title: string;
  difficulty?: string;
  instructions?: string;
  paragraphs: { id: string; label: string; text: string }[];
  questions: Array<{
    id: string;
    kind: string;
    text: string;
    options?: { key: string; label: string }[];
    headings?: { key: string; label: string }[];
    paragraphId?: string;
    correct?: string;
  }>;
  headings?: { key: string; label: string }[];
};

export async function fetchPassage(
  studentId: string,
  questionType: string,
  testType: string
) {
  const res = await fetch(
    `/api/reading/get-passage?questionType=${encodeURIComponent(questionType)}&studentId=${encodeURIComponent(studentId)}&testType=${encodeURIComponent(testType)}`
  );
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.passage) {
    throw new Error(data?.error ?? "Failed to load passage");
  }
  return data as {
    passage: PracticePassage;
    correctAnswers: Record<string, string>;
  };
}
