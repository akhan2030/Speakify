"use client";

import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";

export default function StepHistoryPage() {
  const [mocks, setMocks] = useState<
    Array<{
      mock_number: number;
      total_score: number;
      completed_at: string;
      mock_type: string;
    }>
  >([]);

  useEffect(() => {
    fetch("/api/step/mock", { method: "POST" })
      .then((r) => r.json())
      .then((json) => setMocks(json.mocks ?? []));
  }, []);

  if (mocks === null) return <PageSpinner />;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-[#0d1b35]">Mock history</h1>
      {mocks.length === 0 ? (
        <p className="text-slate-500">No mocks yet. Take your first practice mock.</p>
      ) : (
        <ul className="space-y-3">
          {mocks.map((m) => (
            <li
              key={m.mock_number}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-semibold text-[#0d1b35]">Mock #{m.mock_number}</p>
                <p className="text-xs text-slate-500">
                  {new Date(m.completed_at).toLocaleDateString()} · {m.mock_type}
                </p>
              </div>
              <p className="text-xl font-bold text-emerald-700">{m.total_score}/100</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
