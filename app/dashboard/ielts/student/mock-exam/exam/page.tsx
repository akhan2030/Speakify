"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import MockExamEngine from "@/components/mock-test/MockExamEngine";
import { EXAM_CONTENT } from "@/lib/mock-test/staticExamContent";
import { ieltsMockLobbyHref } from "@/lib/mock-test/ieltsMockRoutes";

function MockExamSessionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const testId = searchParams.get("testId");
  const mockNumber = searchParams.get("mock");
  const [accessState, setAccessState] = useState<"checking" | "allowed" | "denied">(
    "checking"
  );

  useEffect(() => {
    if (status !== "unauthenticated") return;
    const callback = `/dashboard/ielts/student/mock-exam/exam?${searchParams.toString()}`;
    router.replace(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }, [status, router, searchParams]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const n = Number(mockNumber);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      setAccessState("denied");
      return;
    }

    let cancelled = false;
    fetch(`/api/mock-test/access?mock=${n}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          setAccessState("allowed");
          return;
        }
        setAccessState("denied");
      })
      .catch(() => {
        if (!cancelled) setAccessState("denied");
      });

    return () => {
      cancelled = true;
    };
  }, [status, mockNumber]);

  useEffect(() => {
    if (testId) {
      sessionStorage.setItem("mock_test_generated_id", testId);
    }
    if (mockNumber) {
      sessionStorage.setItem("mock_test_number", mockNumber);
    }
  }, [testId, mockNumber]);

  useEffect(() => {
    if (accessState !== "allowed") return;
    const block = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", block);
    return () => window.removeEventListener("beforeunload", block);
  }, [accessState]);

  if (status === "loading" || status === "unauthenticated" || accessState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
      </div>
    );
  }

  if (accessState === "denied") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8f9fa] px-4 text-center">
        <h1 className="text-xl font-bold text-[#0d1b35]">This mock is locked</h1>
        <p className="max-w-md text-sm text-slate-600">
          Your account does not include Mock #{String(mockNumber).padStart(2, "0")}. Purchase it
          or upgrade your pack to unlock.
        </p>
        <Link
          href={ieltsMockLobbyHref()}
          className="rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white"
        >
          Back to mock lobby
        </Link>
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
