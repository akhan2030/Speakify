"use client";

import Link from "next/link";

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

export default function TeacherComingSoon({
  title,
  description = "We are building this module for your teaching workflow.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <SparkleIcon className="mx-auto h-16 w-16 text-[#c9972c]" />
        <h1 className="mt-6 text-[28px] font-bold text-[#0d1b35]">{title}</h1>
        <p className="mt-3 text-lg text-[#c9972c]">Coming soon</p>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        <Link
          href="/dashboard/teacher"
          className="mt-8 inline-block rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-bold text-white hover:bg-[#152a4d]"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
