"use client";

import { usePathname } from "next/navigation";
import { isPathwayStudentPath } from "@/lib/programType";

export function usePathwayStudentContext() {
  const pathname = usePathname();
  const isPathway = isPathwayStudentPath(pathname);
  const isIeltsProgram = pathname.startsWith("/dashboard/ielts/student");
  const base = isPathway
    ? "/dashboard/pathway/student"
    : isIeltsProgram
      ? "/dashboard/ielts/student"
      : "/dashboard/student";
  return {
    isPathway,
    isIeltsProgram,
    /** Parent layout already provides IELTS/Pathway sidebar — hide StudentSidebar */
    usesProgramShell: isPathway || isIeltsProgram,
    base,
    dashboardHref: base,
  };
}
