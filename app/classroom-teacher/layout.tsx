"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ClassroomShell from "@/components/classroom/ClassroomShell";
import { normalizeRole } from "@/lib/roles";

export default function ClassroomTeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const role = normalizeRole((session?.user as { role?: string })?.role);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && role !== "teacher" && role !== "admin") {
      router.replace("/classroom");
    }
  }, [status, role, router]);

  if (status === "loading" || (role !== "teacher" && role !== "admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ef] text-slate-500">
        Loading teacher classroom…
      </div>
    );
  }

  return <ClassroomShell mode="teacher">{children}</ClassroomShell>;
}
