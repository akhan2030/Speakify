"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import MockExamEngine from "@/components/mock-test/MockExamEngine";
import { EXAM_CONTENT } from "@/lib/mock-test/staticExamContent";

export default function MockTestExamPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    router.replace(
      `/login?callbackUrl=${encodeURIComponent("/mock-test/exam")}`
    );
  }, [status, router]);

  useEffect(() => {
    const block = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", block);
    return () => window.removeEventListener("beforeunload", block);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
      </div>
    );
  }

  return <MockExamEngine sectionReady={EXAM_CONTENT} />;
}
