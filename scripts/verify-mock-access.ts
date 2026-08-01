/**
 * Regression checks for mock access entitlements (pack vs Accelerator vs mock_only).
 * Run: npx tsx scripts/verify-mock-access.ts
 */
import assert from "node:assert/strict";
import {
  hasAllAcademicMockAccess,
  hasMockExamStartAccess,
  resolveAccessibleMockNumbers,
  type MockAccessUser,
} from "../lib/mock-test/mockAccess";

function check(label: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${label}`);
  } catch (err) {
    console.error(`✗ ${label}`);
    throw err;
  }
}

const mockOnlyIelts: MockAccessUser = {
  role: "student",
  paymentStatus: "unpaid",
  purchaseIntent: "mock_only",
  enrolledPrograms: ["ielts"],
  programSelected: "ielts",
};

const pack3Owned = [1, 2, 3];
const single2Owned = [2];

check("mock_only + IELTS does NOT get all 5 mocks", () => {
  assert.equal(hasAllAcademicMockAccess(mockOnlyIelts), false);
  assert.deepEqual(resolveAccessibleMockNumbers(mockOnlyIelts, pack3Owned), [1, 2, 3]);
  assert.equal(hasMockExamStartAccess(mockOnlyIelts, 1, pack3Owned), true);
  assert.equal(hasMockExamStartAccess(mockOnlyIelts, 4, pack3Owned), false);
  assert.equal(hasMockExamStartAccess(mockOnlyIelts, 2, single2Owned), true);
  assert.equal(hasMockExamStartAccess(mockOnlyIelts, 1, single2Owned), false);
});

const paidAccelerator: MockAccessUser = {
  role: "student",
  paymentStatus: "paid",
  purchaseIntent: "accelerator",
  enrolledPrograms: ["ielts"],
  programSelected: "ielts",
};

check("paid Accelerator still gets all 5", () => {
  assert.equal(hasAllAcademicMockAccess(paidAccelerator), true);
  assert.deepEqual(resolveAccessibleMockNumbers(paidAccelerator, []), [1, 2, 3, 4, 5]);
  assert.equal(hasMockExamStartAccess(paidAccelerator, 5, []), true);
});

const paidExMockOnly: MockAccessUser = {
  role: "student",
  paymentStatus: "paid",
  purchaseIntent: "mock_only",
  enrolledPrograms: ["ielts"],
  programSelected: "ielts",
};

check("paid status overrides leftover mock_only intent", () => {
  assert.equal(hasAllAcademicMockAccess(paidExMockOnly), true);
});

const compedAccelerator: MockAccessUser = {
  role: "student",
  paymentStatus: "comped",
  paymentCompedUntil: null,
  purchaseIntent: null,
  enrolledPrograms: ["ielts"],
  programSelected: "ielts",
};

check("comped IELTS Accelerator (not mock_only) gets all 5", () => {
  assert.equal(hasAllAcademicMockAccess(compedAccelerator), true);
});

const unpaidIelts: MockAccessUser = {
  role: "student",
  paymentStatus: "unpaid",
  purchaseIntent: null,
  enrolledPrograms: ["ielts"],
  programSelected: "ielts",
};

check("unpaid IELTS without purchases cannot start mocks", () => {
  assert.equal(hasAllAcademicMockAccess(unpaidIelts), false);
  assert.equal(hasMockExamStartAccess(unpaidIelts, 1, []), false);
});

console.log("\nAll mock access checks passed.");
