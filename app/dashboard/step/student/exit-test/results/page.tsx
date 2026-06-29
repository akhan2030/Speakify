"use client";

import { Suspense } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import ExitTestResultsContent from "./ExitTestResultsContent";

export default function ExitTestResultsPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ExitTestResultsContent />
    </Suspense>
  );
}
