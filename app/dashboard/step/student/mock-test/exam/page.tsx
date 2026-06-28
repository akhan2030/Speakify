"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import MockExamRunner from "@/components/step/mock-test/MockExamRunner";
import type { MockExamPayload } from "@/lib/step/mockExam/types";

type StoredSession = {
  attemptId: string;
  mockNumber: number;
  questions: MockExamPayload;
};

export default function StepMockExamPage() {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);

  useEffect(() => {
    const keys = Object.keys(sessionStorage).filter((k) => k.startsWith("step-mock-"));
    if (keys.length === 0) {
      router.replace("/dashboard/step/student/mock-test");
      return;
    }
    const raw = sessionStorage.getItem(keys[keys.length - 1]);
    if (!raw) {
      router.replace("/dashboard/step/student/mock-test");
      return;
    }
    try {
      setSession(JSON.parse(raw) as StoredSession);
    } catch {
      router.replace("/dashboard/step/student/mock-test");
    }
  }, [router]);

  if (!session) return <PageSpinner />;

  return (
    <MockExamRunner
      attemptId={session.attemptId}
      mockNumber={session.mockNumber}
      questions={session.questions}
      onSubmitted={(attemptId) => {
        sessionStorage.removeItem(`step-mock-${attemptId}`);
        router.push(`/dashboard/step/student/mock-test/results?attemptId=${attemptId}`);
      }}
    />
  );
}
