"use client";

import Link from "next/link";

export default function PathwaySettingsPage() {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-6">
      <Link
        href="/dashboard/pathway/student"
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">Settings</h1>
      <p className="mt-2 text-sm text-slate-600">
        Manage your English Pathway account preferences
      </p>

      <div className="mt-8 max-w-lg space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#0d1b35]">Account</h2>
          <p className="mt-2 text-sm text-slate-500">
            Profile and notification settings are coming soon.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#0d1b35]">Your program</h2>
          <p className="mt-2 text-sm text-slate-500">
            English Pathway — CEFR general English course
          </p>
        </div>
      </div>
    </main>
  );
}
