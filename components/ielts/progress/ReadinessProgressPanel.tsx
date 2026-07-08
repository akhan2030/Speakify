"use client";

import IeltsReadinessMeter from "@/components/student/IeltsReadinessMeter";

export default function ReadinessProgressPanel() {
  return (
    <div>
      <p className="text-sm text-slate-600">
        Your exam progress based on practice across all four skills.
      </p>
      <div className="mt-6">
        <IeltsReadinessMeter />
      </div>
    </div>
  );
}
