"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageSpinner } from "@/components/StudentSidebar";
import { resolveLegacyStudentRedirect } from "@/lib/legacyStudentRoutes";
import { resolveStudentProgramType } from "@/lib/programType";
import { normalizeRole } from "@/lib/roles";

export default function LegacyStudentPracticeRedirectPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const role = normalizeRole((session?.user as { role?: string })?.role);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    if (role === "student") {
      const programType = resolveStudentProgramType({
        programType: (session?.user as { programType?: string })?.programType,
        enrolledPrograms: (session?.user as { enrolledPrograms?: unknown })?.enrolledPrograms,
        programSelected: (session?.user as { programSelected?: string })?.programSelected,
      });
      const target =
        resolveLegacyStudentRedirect("/dashboard/student/practice", programType) ??
        "/dashboard/ielts/student/practice";
      router.replace(target);
    }
  }, [status, role, session, router]);

  return <PageSpinner />;
}
