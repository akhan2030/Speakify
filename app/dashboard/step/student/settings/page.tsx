"use client";

import { useEffect, useState } from "react";

export default function StepSettingsPage() {
  const [target, setTarget] = useState(80);

  useEffect(() => {
    fetch("/api/step/dashboard")
      .then((r) => r.json())
      .then((json) => setTarget(json.enrollment?.target_score ?? 80));
  }, []);

  return (
    <div className="max-w-lg space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-[#0d1b35]">Settings</h1>
      <p className="text-sm text-slate-600">
        Your STEP Accelerator target score. Most Saudi universities require 65–75;
        competitive programmes often ask for 80+.
      </p>
      <label className="block">
        <span className="text-sm font-semibold text-[#0d1b35]">Target score</span>
        <input
          type="number"
          min={50}
          max={100}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2"
        />
      </label>
      <p className="text-xs text-slate-400">
        Target score persistence via API can be added in a follow-up. Default: 80.
      </p>
    </div>
  );
}
