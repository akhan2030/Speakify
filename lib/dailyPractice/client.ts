import type { DailyPracticeProgramme } from "@/lib/dailyPractice/programme";

export type DailyPracticeContext = {
  taskId: string;
  title: string;
  programme: DailyPracticeProgramme;
  practiceBase: string;
  estimatedMinutes?: number;
};

const STORAGE_KEY = "speakify_daily_practice_ctx";

export function storeDailyPracticeContext(ctx: DailyPracticeContext) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
}

export function readDailyPracticeContext(): DailyPracticeContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DailyPracticeContext;
  } catch {
    return null;
  }
}

export function clearDailyPracticeContext() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function parseDailyPracticeSearchParams(
  searchParams: URLSearchParams
): DailyPracticeContext | null {
  if (searchParams.get("dp") !== "1") return null;
  const taskId = searchParams.get("dpTask");
  const title = searchParams.get("dpTitle");
  const practiceBase = searchParams.get("dpBase");
  const programme = (searchParams.get("dpProgramme") === "ielts_general"
    ? "ielts_general"
    : "ielts") as DailyPracticeProgramme;

  if (!taskId || !practiceBase) return null;

  return {
    taskId,
    title: title ?? "Daily practice task",
    programme,
    practiceBase,
    estimatedMinutes: Number(searchParams.get("dpMin")) || undefined,
  };
}

export function withDailyPracticeParams(
  href: string,
  ctx: DailyPracticeContext
): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("dp", "1");
  params.set("dpTask", ctx.taskId);
  params.set("dpTitle", ctx.title);
  params.set("dpBase", ctx.practiceBase);
  params.set("dpProgramme", ctx.programme);
  if (ctx.estimatedMinutes) {
    params.set("dpMin", String(ctx.estimatedMinutes));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function postDailyPracticeComplete(input: {
  taskId: string;
  programme: DailyPracticeProgramme;
  timeSpentMinutes?: number;
}) {
  const res = await fetch("/api/student/practice/completion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Could not save practice progress");
  }
  return data;
}
