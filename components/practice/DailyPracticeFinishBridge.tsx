"use client";

import DailyPracticeContinuePanel from "@/components/practice/DailyPracticeContinuePanel";
import { useDailyPracticeSession } from "@/components/practice/useDailyPracticeSession";
import { Suspense } from "react";

function DailyPracticeContinuePanelInner(props: {
  timeSpentMinutes?: number;
  className?: string;
}) {
  const ctx = useDailyPracticeSession();
  if (!ctx) return null;
  return <DailyPracticeContinuePanel {...props} />;
}

export default function DailyPracticeFinishBridge(props: {
  timeSpentMinutes?: number;
  className?: string;
}) {
  return (
    <Suspense fallback={null}>
      <DailyPracticeContinuePanelInner {...props} />
    </Suspense>
  );
}
