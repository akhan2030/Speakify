"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import { parseRawEnrolledPrograms } from "@/lib/studentLoginRedirect";

/** GT grammar when on GT routes, enrolled as GT-only, or GT session marker. */
export function useGrammarProgramme(): "academic" | "general" {
  const pathname = usePathname();
  const { isIeltsGeneralProgram } = usePathwayStudentContext();
  const { data: session } = useSession();
  const [storageGeneral, setStorageGeneral] = useState(false);

  useEffect(() => {
    setStorageGeneral(
      sessionStorage.getItem("speakify_programme") === "ielts_general"
    );
  }, [pathname]);

  if (isIeltsGeneralProgram) return "general";

  const enrolled = parseRawEnrolledPrograms(
    (session?.user as { enrolledPrograms?: unknown } | undefined)?.enrolledPrograms
  );
  const generalOnly =
    enrolled.includes("ielts_general") && !enrolled.includes("ielts");

  if (generalOnly || storageGeneral) return "general";

  return "academic";
}
