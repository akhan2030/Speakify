"use client";

import { Suspense } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import MiniMockResultsContent from "./MiniMockResultsContent";

export default function MiniMockResultsPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <MiniMockResultsContent />
    </Suspense>
  );
}
