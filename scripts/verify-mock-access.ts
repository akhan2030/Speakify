/**
 * Regression checks for Academic + GT mock access entitlements.
 * Run: npx tsx scripts/verify-mock-access.ts
 */
import assert from "node:assert/strict";
import {
  fetchPurchasedMockNumbers,
  hasAllAcademicMockAccess,
  hasAllGeneralMockAccess,
  hasMockExamStartAccess,
  hasMockExamStartAccessForProgramme,
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

check("paid Accelerator still gets all 5 Academic", () => {
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

check("paid status overrides leftover mock_only intent (Academic)", () => {
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

const paidGtAccelerator: MockAccessUser = {
  role: "student",
  paymentStatus: "paid",
  purchaseIntent: "accelerator",
  enrolledPrograms: ["ielts_general"],
  programSelected: "ielts_general",
};

check("paid GT Accelerator gets all 3 GT mocks, not Academic catalogue", () => {
  assert.equal(hasAllGeneralMockAccess(paidGtAccelerator), true);
  assert.equal(hasAllAcademicMockAccess(paidGtAccelerator), false);
  assert.deepEqual(
    resolveAccessibleMockNumbers(paidGtAccelerator, [], "ielts_general"),
    [1, 2, 3]
  );
  assert.equal(
    hasMockExamStartAccessForProgramme(paidGtAccelerator, "ielts_general", 3, []),
    true
  );
  assert.equal(
    hasMockExamStartAccessForProgramme(paidGtAccelerator, "ielts_general", 4, []),
    false
  );
  assert.equal(
    hasMockExamStartAccessForProgramme(paidGtAccelerator, "ielts", 1, []),
    false
  );
});

const mockOnlyGt: MockAccessUser = {
  role: "student",
  paymentStatus: "unpaid",
  purchaseIntent: "mock_only",
  enrolledPrograms: ["ielts_general"],
  programSelected: "ielts_general",
};

check("GT mock_only only unlocks purchased GT numbers", () => {
  assert.equal(hasAllGeneralMockAccess(mockOnlyGt), false);
  assert.deepEqual(
    resolveAccessibleMockNumbers(mockOnlyGt, [1, 2], "ielts_general"),
    [1, 2]
  );
  assert.equal(
    hasMockExamStartAccessForProgramme(mockOnlyGt, "ielts_general", 1, [1, 2]),
    true
  );
  assert.equal(
    hasMockExamStartAccessForProgramme(mockOnlyGt, "ielts_general", 3, [1, 2]),
    false
  );
});

const dualEnrolled: MockAccessUser = {
  role: "student",
  paymentStatus: "paid",
  purchaseIntent: "accelerator",
  enrolledPrograms: ["ielts", "ielts_general"],
  programSelected: "ielts_general",
};

check("dual-enrolled paid Accelerator gets both catalogues independently", () => {
  assert.equal(hasAllAcademicMockAccess(dualEnrolled), true);
  assert.equal(hasAllGeneralMockAccess(dualEnrolled), true);
});

check("Academic purchase list does not imply GT start access", () => {
  assert.equal(
    hasMockExamStartAccessForProgramme(mockOnlyGt, "ielts_general", 1, []),
    false
  );
  // Even if Academic pack3 numbers are passed under the wrong programme filter,
  // GT start still requires programme-scoped purchases / all-access.
  assert.equal(
    hasMockExamStartAccessForProgramme(mockOnlyIelts, "ielts_general", 1, pack3Owned),
    false
  );
});

check("fetchPurchasedMockNumbers signature accepts programme (type-level smoke)", () => {
  assert.equal(typeof fetchPurchasedMockNumbers, "function");
});

console.log("\nAll mock access checks passed (Academic + GT).");
