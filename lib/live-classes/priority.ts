const SKILL_LABELS: Record<string, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

export function skillDashboardUrlForLiveClasses(callbackPath: string): string | null {
  const path = String(callbackPath ?? "").toLowerCase();
  if (path.includes("ielts-general")) return "/api/ielts-general/dashboard";
  if (path.includes("/ielts/") || path.includes("/dashboard/student/live-classes")) {
    return "/api/student/ielts-dashboard";
  }
  return null;
}

export function prioritySkillLabelFromDashboard(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const weakest = (payload as { weakestSkill?: Record<string, unknown> }).weakestSkill;
  if (!weakest || weakest.showAlert !== true) return null;
  if (weakest.band == null || weakest.band === "") return null;
  const band = Number(weakest.band);
  if (!Number.isFinite(band)) return null;
  const key = String(weakest.key ?? "")
    .trim()
    .toLowerCase();
  if (SKILL_LABELS[key]) return SKILL_LABELS[key];
  const raw = String(weakest.label ?? "").trim();
  if (!raw) return null;
  return raw.split(" (")[0];
}
