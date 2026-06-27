"use client";

import { usePathname } from "next/navigation";
import { isPathwayStudentPath } from "@/lib/programType";

export function usePathwayStudentContext() {
  const pathname = usePathname();
  const isPathway = isPathwayStudentPath(pathname);
  const isIeltsGeneralProgram = pathname.startsWith("/dashboard/ielts-general/student");
  const isIeltsProgram =
    pathname.startsWith("/dashboard/ielts/student") || isIeltsGeneralProgram;
  const base = isPathway
    ? "/dashboard/pathway/student"
    : isIeltsGeneralProgram
      ? "/dashboard/ielts-general/student"
      : isIeltsProgram
        ? "/dashboard/ielts/student"
        : "/dashboard/student";
  return {
    isPathway,
    isIeltsProgram,
    isIeltsGeneralProgram,
    /** Parent layout already provides IELTS/Pathway sidebar — hide StudentSidebar */
    usesProgramShell: isPathway || isIeltsProgram,
    base,
    dashboardHref: base,
  };
}
