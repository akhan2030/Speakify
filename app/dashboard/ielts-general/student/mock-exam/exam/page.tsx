"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useEffect } from "react";
import MockExamEngine from "@/components/mock-test/MockExamEngine";
import { GENERAL_EXAM_CONTENT } from "@/lib/ielts-general/mockExamContent";

function GtMockExamSessionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const mockNumber = searchParams.get("mock");
  const attemptId = searchParams.get("attemptId");

  useEffect(() => {
    if (status !== "unauthenticated") return;
    const callback = `/dashboard/ielts-general/student/mock-exam/exam?${searchParams.toString()}`;
    router.replace(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }, [status, router, searchParams]);

  useEffect(() => {
    if (attemptId) sessionStorage.setItem("mock_test_attempt_id", attemptId);
    if (mockNumber) sessionStorage.setItem("mock_test_number", mockNumber);
    sessionStorage.setItem("speakify_programme", "ielts_general");
  }, [attemptId, mockNumber]);

  useEffect(() => {
    const block = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", block);
    return () => window.removeEventListener("beforeunload", block);
  }, []);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
      </div>
    );
  }

  return <MockExamEngine variant="general" sectionReady={GENERAL_EXAM_CONTENT} />;
}

export default function GtMockExamSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
        </div>
      }
    >
      <GtMockExamSessionInner />
    </Suspense>
  );
}
