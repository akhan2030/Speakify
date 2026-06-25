export function normalizeRole(role: unknown): string | null {
  if (role == null) return null;
  const value = String(role).trim().toLowerCase();
  if (value === "teacher" || value === "student") return value;
  return null;
}

export function dashboardPathForRole(role: unknown): string | null {
  const normalized = normalizeRole(role);
  if (normalized === "teacher") return "/dashboard/teacher";
  if (normalized === "student") return "/dashboard/student";
  return null;
}
