"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageSpinner } from "@/components/TeacherSidebar";

function BookConsultationContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId") ?? "";
  const bookingUrl =
    process.env.NEXT_PUBLIC_BOOKING_URL || "https://calendly.com";

  return (
    <div className="px-6 py-8">
      <Link
        href={
          studentId
            ? `/dashboard/teacher/student/${studentId}`
            : "/dashboard/teacher"
        }
        className="text-sm font-medium text-[#0d9488] hover:underline"
      >
        ← Back
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-[#0d1b35]">Book consultation</h1>
      <p className="mt-2 max-w-lg text-sm text-slate-600">
        Schedule a one-to-one session with this student. Connect your booking system by
        setting <code className="text-xs">NEXT_PUBLIC_BOOKING_URL</code> in{" "}
        <code className="text-xs">.env.local</code> (e.g. Calendly link).
      </p>
      {studentId ? (
        <p className="mt-4 text-sm text-slate-500">Student ID: {studentId}</p>
      ) : null}
      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
      >
        Open booking calendar
      </a>
    </div>
  );
}

export default function BookConsultationPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <BookConsultationContent />
    </Suspense>
  );
}
