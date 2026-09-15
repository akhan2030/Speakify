"use client";

import LiveClassesStudio from "@/components/live-classes/LiveClassesStudio";

export default function StepLiveClassesPage() {
  return (
    <LiveClassesStudio
      callbackPath="/dashboard/step/student/live-classes"
      oneToOneOnly
    />
  );
}
