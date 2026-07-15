"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ClassroomShell from "@/components/classroom/ClassroomShell";
import { normalizeRole } from "@/lib/roles";

const NAV = [
  { href: "/admin/classroom", label: "Overview", exact: true },
  { href: "/admin/classroom/levels", label: "Levels" },
  { href: "/admin/classroom/media", label: "Media" },
  { href: "/admin/classroom/classes", label: "Classes" },
  { href: "/admin/classroom/students", label: "Students" },
  { href: "/admin/classroom/pdf-export", label: "PDF Export" },
];

export default function AdminClassroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const role = normalizeRole((session?.user as { role?: string })?.role);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && role !== "admin") {
      router.replace(role === "teacher" ? "/classroom-teacher" : "/classroom");
    }
  }, [status, role, router]);

  if (status === "loading" || role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ef] text-slate-500">
        Loading classroom admin…
      </div>
    );
  }

  return (
    <ClassroomShell mode="admin">
      <nav className="mb-8 flex flex-wrap gap-1 border-b border-slate-200 pb-3">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </ClassroomShell>
  );
}
