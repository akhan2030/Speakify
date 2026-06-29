"use client";

import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import StepProgressFull from "@/components/step/progress/StepProgressFull";

export default function ProgressPageView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/step/progress/data")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Failed to load");
        setData(json);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!data) return <PageSpinner />;
  return <StepProgressFull data={data} />;
}
