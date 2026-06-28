export const GENERAL_STUDENT_BASE = "/dashboard/ielts-general/student";

export function generalStudentPath(segment = ""): string {
  if (!segment) return GENERAL_STUDENT_BASE;
  return `${GENERAL_STUDENT_BASE}/${segment.replace(/^\//, "")}`;
}
