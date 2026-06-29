"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import TeacherSidebar, { PageSpinner } from "@/components/TeacherSidebar";
import { getTeacherActivePage } from "@/lib/teacherNav";
import { normalizeRole } from "@/lib/roles";

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, data: session } = useSession();
  const role = normalizeRole((session?.user as { role?: string })?.role);
  const activePage = getTeacherActivePage(pathname ?? "");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (role && role !== "teacher") {
      router.replace(role === "admin" ? "/dashboard/admin" : "/dashboard/student");
    }
  }, [status, role, router]);

  if (status === "loading" || status === "unauthenticated" || role !== "teacher") {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <TeacherSidebar activePage={activePage} />
      <div className="ml-[200px] min-h-screen flex-1 bg-slate-50">{children}</div>
    </div>
  );
}
