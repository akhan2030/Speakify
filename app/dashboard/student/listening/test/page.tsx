"use client";

import { Suspense } from "react";
import ListeningMockExam from "@/components/listening/ListeningMockExam";
import { PageSpinner } from "@/components/StudentSidebar";

export default function ListeningTestPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ListeningMockExam />
    </Suspense>
  );
}
