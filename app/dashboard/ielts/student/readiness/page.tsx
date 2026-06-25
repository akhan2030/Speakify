"use client";

import IeltsReadinessMeter from "@/components/student/IeltsReadinessMeter";

export default function IeltsReadinessPage() {
  return (
    <main className="min-h-screen flex-1 bg-white p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#0d1b35]">My IELTS Progress</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your exam progress based on practice across all four skills
        </p>
      </header>
      <IeltsReadinessMeter />
    </main>
  );
}
