import {
  hasAllAcademicMockAccess,
  hasMockExamLobbyAccess,
  hasMockExamResultsAccess,
  hasMockExamStartAccess,
  isStaffMockAccessRole,
} from "../lib/mock-test/mockAccess.ts";

const expiredComp = {
  role: "student",
  enrolledPrograms: ["ielts"],
  paymentStatus: "comped",
  paymentCompedUntil: "2020-01-01",
};

console.log("=== Start access (new attempts) ===");
const startCases = [
  { label: "admin", user: { role: "admin", enrolledPrograms: [] }, purchased: [] },
  { label: "comped expired", user: expiredComp, purchased: [] },
  { label: "mock-only buyer #2", user: { role: "student", enrolledPrograms: ["ielts"], paymentStatus: "unpaid", purchaseIntent: "mock_only" }, purchased: [2] },
];

for (const c of startCases) {
  console.log(
    `${c.label.padEnd(22)} mock2 start: ${hasMockExamStartAccess(c.user, 2, c.purchased)}`
  );
}

console.log("\n=== Results access (includes attempt ownership) ===");
console.log(
  "comped expired + owns attempt:",
  hasMockExamResultsAccess(expiredComp, { mockNumber: 2, ownsAttempt: true })
);
console.log(
  "comped expired + no attempt:",
  hasMockExamResultsAccess(expiredComp, { mockNumber: 2, ownsAttempt: false })
);

console.log("\n=== Lobby access (history survives lapse) ===");
console.log(
  "comped expired + has history:",
  hasMockExamLobbyAccess(expiredComp, { hasAttemptHistory: true })
);
console.log(
  "comped expired + no history:",
  hasMockExamLobbyAccess(expiredComp, { hasAttemptHistory: false })
);

console.log("\nstaff admin:", isStaffMockAccessRole("admin"));
console.log("paid all mocks:", hasAllAcademicMockAccess({ role: "student", enrolledPrograms: ["ielts"], paymentStatus: "paid" }));
