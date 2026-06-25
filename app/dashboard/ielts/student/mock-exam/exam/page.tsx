"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useEffect } from "react";
import MockExamEngine from "@/components/mock-test/MockExamEngine";
import { EXAM_CONTENT } from "@/lib/mock-test/staticExamContent";

function MockExamSessionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const testId = searchParams.get("testId");
  const mockNumber = searchParams.get("mock");

  useEffect(() => {
    if (status !== "unauthenticated") return;
    const callback = `/dashboard/ielts/student/mock-exam/exam?${searchParams.toString()}`;
    router.replace(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }, [status, router, searchParams]);

  useEffect(() => {
    if (testId) {
      sessionStorage.setItem("mock_test_generated_id", testId);
      console.log("Mock exam session — testId:", testId);
    }
    if (mockNumber) {
      sessionStorage.setItem("mock_test_number", mockNumber);
    }
    const attemptId = sessionStorage.getItem("mock_test_attempt_id");
    if (!attemptId) {
      console.warn("Mock exam session — no attemptId in sessionStorage");
    }
  }, [testId, mockNumber]);

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

  return <MockExamEngine sectionReady={EXAM_CONTENT} />;
}

export default function IeltsMockExamSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
        </div>
      }
    >
      <MockExamSessionInner />
    </Suspense>
  );
}
