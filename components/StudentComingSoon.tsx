"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner, type ActivePage } from "./StudentSidebar";

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}

export default function StudentComingSoon({
  activePage,
  skillName,
}: {
  activePage: ActivePage;
  skillName: string;
}) {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage={activePage} />
      <main className="ml-[200px] flex flex-1 items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md text-center">
          <SparkleIcon className="mx-auto h-16 w-16 text-[#c9972c]" />
          <h1 className="mt-6 text-[28px] font-bold text-[#0d1b35]">
            {skillName}
          </h1>
          <p className="mt-3 text-lg text-slate-500">Coming Soon</p>
          <p className="mt-2 text-sm text-slate-500">
            We are building this module for you.
          </p>
          <Link
            href="/dashboard/student/writing"
            className="mt-8 inline-flex rounded-xl bg-[#c9972c] px-8 py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
          >
            Practice Writing Now
          </Link>
          <p className="mt-4 text-xs text-slate-400">
            Writing evaluation is available now
          </p>
        </div>
      </main>
    </div>
  );
}
