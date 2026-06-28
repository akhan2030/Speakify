"use client";

import { Suspense } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import StepPhaseExitContent from "./StepPhaseExitContent";

export default function StepPhaseExitPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <StepPhaseExitContent />
    </Suspense>
  );
}
