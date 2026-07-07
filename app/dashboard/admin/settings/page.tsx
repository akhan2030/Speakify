"use client";

import AccountSettings from "@/components/settings/AccountSettings";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl">
      <header>
        <h1 className="text-2xl font-bold text-[#0d1b35]">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your administrator profile and account security.
        </p>
      </header>
      <div className="mt-8">
        <AccountSettings roleLabel="Administrator" />
      </div>
    </div>
  );
}
