"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageSpinner } from "@/components/StudentSidebar";
import { normalizeRole } from "@/lib/roles";

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status, data: session } = useSession();
  const role = normalizeRole((session?.user as { role?: string })?.role);
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
    if (status !== "authenticated") return;
    if (role !== "student" && role !== "teacher") {
      router.replace("/login");
    }
  }, [status, role, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  if (role === "teacher") {
    if (teacherStudentAccess === null || !teacherStudentAccess) {
      return <PageSpinner />;
    }
  }

  if (role !== "student" && role !== "teacher") {
    return <PageSpinner />;
  }

  return <>{children}</>;
}
