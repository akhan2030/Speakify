export type UserRole = "admin" | "teacher" | "student";

export function normalizeRole(role: unknown): UserRole | null {
  if (role == null) return null;
  const value = String(role).trim().toLowerCase();
  if (value === "admin" || value === "teacher" || value === "student") {
    return value;
  }
  return null;
}

export function dashboardPathForRole(role: unknown): string | null {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "/dashboard/admin";
  if (normalized === "teacher") return "/dashboard/teacher";
  if (normalized === "student") return "/dashboard/student";
  return null;
}
