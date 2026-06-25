"use client";

import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import OnboardingFlow from "@/components/ielts/OnboardingFlow";

type OnboardingPayload = {
  name: string;
  placementBand: number | null;
  targetBand: number;
  recommendedTrackName: string;
  trackTarget: string;
  examDate: string | null;
  studyDaysPerWeek: number;
  preferredStudyTime: string;
};

export default function IeltsOnboardingPage() {
  const [data, setData] = useState<OnboardingPayload | null>(null);

  useEffect(() => {
    fetch("/api/student/ielts-onboarding")
      .then((r) => r.json())
      .then((json) => {
        if (!json.error) setData(json);
      });
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex-1 bg-slate-50">
      <OnboardingFlow initial={data} />
    </main>
  );
}
