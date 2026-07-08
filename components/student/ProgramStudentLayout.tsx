"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageSpinner } from "@/components/StudentSidebar";
import { studentDashboardPath, canAccessStudentDashboard, resolveStudentProgramType, type ProgramType } from "@/lib/programType";
import { normalizeRole } from "@/lib/roles";

export default function ProgramStudentLayout({
  children,
  expectedProgram,
}: {
  children: React.ReactNode;
  expectedProgram: ProgramType;
}) {
  const router = useRouter();
  const { status, data: session } = useSession();
  const role = normalizeRole((session?.user as { role?: string })?.role);
  const programType = resolveStudentProgramType({
    programType: (session?.user as { programType?: string })?.programType,
    enrolledPrograms: (session?.user as { enrolledPrograms?: unknown })?.enrolledPrograms,
    programSelected: (session?.user as { programSelected?: string })?.programSelected,
  });
  const enrolledPrograms = (session?.user as { enrolledPrograms?: unknown })?.enrolledPrograms;
  const rawProgramType = (session?.user as { programType?: string })?.programType;
  const programSelected = (session?.user as { programSelected?: string })?.programSelected;
  const [teacherStudentAccess, setTeacherStudentAccess] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (role !== "teacher") {
      setTeacherStudentAccess(null);
      return;
    }

    fetch("/api/teacher/me")
      .then((res) => (res.ok ? res.json() : { studentAccess: false }))
      .then((data) => setTeacherStudentAccess(Boolean(data.studentAccess)))
      .catch(() => setTeacherStudentAccess(false));
  }, [status, role, router]);

  useEffect(() => {
    if (status !== "authenticated" || role !== "teacher") return;
    if (teacherStudentAccess === null) return;
    if (!teacherStudentAccess) {
      router.replace("/dashboard/teacher");
    }
  }, [status, role, teacherStudentAccess, router]);

  useEffect(() => {
    if (status !== "authenticated" || role !== "student") return;
    const allowed = canAccessStudentDashboard(expectedProgram, {
      programType: rawProgramType,
      enrolledPrograms,
      programSelected,
    });
    if (!allowed) {
      router.replace(studentDashboardPath(programType));
    }
  }, [status, role, programType, expectedProgram, rawProgramType, enrolledPrograms, programSelected, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  if (role === "teacher") {
    if (teacherStudentAccess === null || !teacherStudentAccess) {
      return <PageSpinner />;
    }
  } else if (role !== "student") {
    return <PageSpinner />;
  }

  return <>{children}</>;
}
