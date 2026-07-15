/**
 * Post-login routing for in-person classroom students.
 * Does NOT redirect LMS teachers/admins away from /dashboard — those stay as-is.
 */

import type { StudentType } from "./types";

export type { StudentType } from "./types";

export type RoleLike = string | null | undefined;

export type PostLoginUserInput = {
  role?: RoleLike;
  studentType?: unknown;
  programType?: unknown;
  classroomStudent?: unknown;
};

function normalizeRole(role: RoleLike): string {
  return String(role ?? "student")
    .trim()
    .toLowerCase();
}

export function normalizeStudentType(value: unknown): StudentType {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  if (
    raw === "in_person" ||
    raw === "inperson" ||
    raw === "classroom" ||
    raw === "in_class"
  ) {
    return "in_person";
  }

  return "self_study";
}

export function isInPersonStudent(
  studentType: unknown,
  extras?: { classroomStudent?: unknown; programType?: unknown }
): boolean {
  if (normalizeStudentType(studentType) === "in_person") return true;
  if (extras?.classroomStudent === true || extras?.classroomStudent === "true") {
    return true;
  }
  const program = String(extras?.programType ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  return program === "classroom";
}

/** Returns `/classroom` only for in-person students; otherwise null. */
export function classroomLoginOverride(
  user: PostLoginUserInput
): string | null {
  const role = normalizeRole(user.role);
  if (role !== "student") return null;

  if (
    isInPersonStudent(user.studentType, {
      classroomStudent: user.classroomStudent,
      programType: user.programType,
    })
  ) {
    return "/classroom";
  }

  return null;
}

/** Alias for callers that want a named post-login helper. */
export function postLoginPathForUser(
  user: PostLoginUserInput
): string | null {
  return classroomLoginOverride(user);
}
