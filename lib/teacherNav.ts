import type { TeacherActivePage } from "@/components/TeacherSidebar";

export type { TeacherActivePage };

export function getTeacherActivePage(pathname: string): TeacherActivePage {
  if (pathname.startsWith("/dashboard/teacher/students")) return "students";
  if (pathname.startsWith("/dashboard/teacher/student/")) return "students";
  if (pathname.startsWith("/dashboard/teacher/homework")) return "homework";
  if (pathname.startsWith("/dashboard/teacher/ai-practice")) return "ai-practice";
  if (pathname.startsWith("/dashboard/teacher/qa")) return "qa";
  if (pathname.startsWith("/dashboard/teacher/reports")) return "reports";
  if (pathname.startsWith("/dashboard/teacher/settings")) return "settings";
  return "dashboard";
}
