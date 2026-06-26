"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminSidebar, { PageSpinner } from "@/components/admin/AdminSidebar";
import { getAdminActivePage } from "@/lib/adminNav";
import { dashboardPathForRole, normalizeRole } from "@/lib/roles";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, data: session } = useSession();
  const role = normalizeRole((session?.user as { role?: string })?.role);
  const activePage = getAdminActivePage(pathname ?? "");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (role && role !== "admin") {
      router.replace(dashboardPathForRole(role) ?? "/login");
    }
  }, [status, role, router]);

  if (status === "loading" || status === "unauthenticated" || role !== "admin") {
    return <PageSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar activePage={activePage} />
      <div className="ml-[240px] min-h-screen">
        <div className="border-b border-slate-200 bg-white px-6 py-4 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c9972c]">
            Speakify LMS
          </p>
          <p className="text-sm text-slate-500">Platform administration</p>
        </div>
        <main className="px-6 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
