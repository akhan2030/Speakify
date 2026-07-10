import { studentDashboardPath } from "@/lib/programType";

const ACADEMIC_PREFIX = "/dashboard/ielts/student";
const GT_PREFIX = "/dashboard/ielts-general/student";

/** Routes that exist on both Academic and GT dashboards with the same suffix. */
const SHARED_SUFFIXES = new Set([
  "",
  "/practice",
  "/practice/complete",
  "/writing",
  "/speaking",
  "/reading",
  "/listening",
  "/grammar",
  "/grammar/practice",
  "/vocabulary",
  "/vocabulary/study",
  "/mock-exam",
  "/mock-exam/exam",
  "/mock-exam/results",
  "/progress",
  "/settings",
  "/readiness",
  "/speaking/history",
  "/speaking/part1",
  "/speaking/part2",
  "/speaking/part3",
  "/listening/test",
  "/listening/test/results",
  "/listening/tracker",
  "/reading/test",
]);

const ACADEMIC_TO_GT: Array<{ match: (suffix: string) => boolean; target: string }> = [
  { match: (s) => s === "/today" || s.startsWith("/today/"), target: "" },
  { match: (s) => s.startsWith("/weekly-plan"), target: "/progress" },
  { match: (s) => s.startsWith("/accelerator"), target: "/progress" },
  { match: (s) => s.startsWith("/homework"), target: "" },
  { match: (s) => s === "/history" || s.startsWith("/history/"), target: "/progress" },
  { match: (s) => s.startsWith("/achievements"), target: "/progress" },
  { match: (s) => s.startsWith("/reading/practice/"), target: "/reading/practice" },
  { match: (s) => s.startsWith("/reading/strategies"), target: "/reading" },
  { match: (s) => s.startsWith("/reading/tracker"), target: "/reading" },
  { match: (s) => s.startsWith("/reading/results"), target: "/reading" },
  { match: (s) => s.startsWith("/listening/practice/"), target: "/listening" },
  { match: (s) => s.startsWith("/listening/section/"), target: "/listening/section/1" },
  { match: (s) => s.startsWith("/listening/results"), target: "/listening" },
  { match: (s) => s.startsWith("/speaking/mock"), target: "/speaking" },
  { match: (s) => s.startsWith("/speaking/tracker"), target: "/speaking" },
  { match: (s) => s.startsWith("/speaking/improvement-plan"), target: "/speaking" },
  { match: (s) => s.startsWith("/speaking/results"), target: "/speaking" },
  { match: (s) => s.startsWith("/vocabulary/quiz"), target: "/vocabulary" },
  { match: (s) => s.startsWith("/vocabulary/review"), target: "/vocabulary" },
  { match: (s) => s.startsWith("/vocabulary/phrases"), target: "/vocabulary" },
  { match: (s) => s.startsWith("/writing/lessons"), target: "/writing" },
  { match: (s) => s.startsWith("/grammar/lessons"), target: "/grammar" },
];

const GT_TO_ACADEMIC: Array<{ match: (suffix: string) => boolean; target: string }> = [
  { match: (s) => s.startsWith("/letter-practice"), target: "/writing" },
  {
    match: (s) =>
      s.startsWith("/reading/practice/section-") || s === "/reading/practice",
    target: "/reading",
  },
];

function skillRootFallback(suffix: string, toPrefix: string): string | null {
  const root = suffix.split("/").filter(Boolean)[0];
  const skillRoots = [
    "writing",
    "speaking",
    "reading",
    "listening",
    "grammar",
    "vocabulary",
    "practice",
    "mock-exam",
    "progress",
  ];
  if (root && skillRoots.includes(root)) {
    return `${toPrefix}/${root}`;
  }
  return null;
}

export function mirrorIeltsStudentDashboardPath(
  pathname: string,
  targetProgram: "ielts" | "ielts_general"
): string {
  const fromPrefix =
    targetProgram === "ielts_general" ? ACADEMIC_PREFIX : GT_PREFIX;
  const toPrefix = targetProgram === "ielts_general" ? GT_PREFIX : ACADEMIC_PREFIX;

  // Already on the correct programme — do not redirect sub-pages to dashboard home.
  if (pathname.startsWith(toPrefix)) {
    return pathname;
  }

  if (!pathname.startsWith(fromPrefix)) {
    return studentDashboardPath(targetProgram);
  }

  const suffix = pathname.slice(fromPrefix.length) || "";

  if (SHARED_SUFFIXES.has(suffix)) {
    return `${toPrefix}${suffix}`;
  }

  const rules = targetProgram === "ielts_general" ? ACADEMIC_TO_GT : GT_TO_ACADEMIC;
  for (const rule of rules) {
    if (rule.match(suffix)) {
      return `${toPrefix}${rule.target}`;
    }
  }

  const skillFallback = skillRootFallback(suffix, toPrefix);
  if (skillFallback) return skillFallback;

  return toPrefix;
}
