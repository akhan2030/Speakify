"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner, getRoleLabel } from "@/components/StudentSidebar";
import AccountSettings from "@/components/settings/AccountSettings";
import { isProgramStudentPath } from "@/lib/programType";

export default function StudentSettingsPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { status, data: session } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  const roleLabel = getRoleLabel((session?.user as { role?: string })?.role);
  const onProgramPath = isProgramStudentPath(pathname);

  const content = (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header>
        <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your profile and account security.
        </p>
      </header>
      <div className="mt-8">
        <AccountSettings roleLabel={roleLabel} />
      </div>
    </div>
  );

  if (onProgramPath) {
    return <div className="min-h-screen bg-slate-50">{content}</div>;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="settings" />
      <main className="ml-[200px] flex-1 bg-slate-50">{content}</main>
    </div>
  );
}
