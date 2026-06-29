"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MiniMockRunner from "@/components/step/mini-mock/MiniMockRunner";
import { PageSpinner } from "@/components/StudentSidebar";
import type { MockExamPayload } from "@/lib/step/mockExam/types";

export default function MiniMockExamPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<{
    attemptId: string;
    questions: MockExamPayload;
  } | null>(null);

  useEffect(() => {
    const keys = Object.keys(sessionStorage).filter((k) => k.startsWith("step-mini-"));
    const key = keys.find((k) => !k.includes("result")) ?? keys[keys.length - 1];
    if (!key) {
      router.replace("/dashboard/step/student/mini-mock");
      return;
    }
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) throw new Error("missing");
      setPayload(JSON.parse(raw));
    } catch {
      router.replace("/dashboard/step/student/mini-mock");
    }
  }, [router]);

  if (!payload) return <PageSpinner />;

  return (
    <MiniMockRunner
      attemptId={payload.attemptId}
      questions={payload.questions}
      onSubmitted={(id) => {
        router.push(`/dashboard/step/student/mini-mock/results?attemptId=${id}`);
      }}
    />
  );
}
