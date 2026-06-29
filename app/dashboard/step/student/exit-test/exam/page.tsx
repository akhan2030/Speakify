"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ExitTestRunner from "@/components/step/exit-test/ExitTestRunner";
import { PageSpinner } from "@/components/StudentSidebar";
import type { MockExamPayload } from "@/lib/step/mockExam/types";

export default function ExitTestExamPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<{
    attemptId: string;
    phase: number;
    questions: MockExamPayload;
  } | null>(null);

  useEffect(() => {
    const keys = Object.keys(sessionStorage).filter((k) => k.startsWith("step-exit-"));
    const key = keys[keys.length - 1];
    if (!key) {
      router.replace("/dashboard/step/student/exit-test");
      return;
    }
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) throw new Error("missing");
      setPayload(JSON.parse(raw));
    } catch {
      router.replace("/dashboard/step/student/exit-test");
    }
  }, [router]);

  if (!payload) return <PageSpinner />;

  return (
    <ExitTestRunner
      attemptId={payload.attemptId}
      phase={payload.phase}
      questions={payload.questions}
      onSubmitted={(id) => {
        router.push(`/dashboard/step/student/exit-test/results?attemptId=${id}`);
      }}
    />
  );
}
