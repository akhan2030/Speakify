"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  studentAccess?: boolean;
};

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c] disabled:bg-slate-50 disabled:text-slate-400";

export default function TeacherSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch("/api/teacher/me");
        const json = await res.json();
        if (res.ok) setProfile(json);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  const displayName =
    profile?.name ?? session?.user?.name ?? "Teacher";
  const displayEmail =
    profile?.email ?? session?.user?.email ?? "—";

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPwError("New password must be different from your current password.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwError(json.error || "Could not update password.");
        setPwLoading(false);
        return;
      }

      setPwSuccess("Password updated. Signing you in again…");
      await signOut({ redirect: false });
      const result = await signIn("credentials", {
        email: displayEmail,
        password: newPassword,
        redirect: false,
      });
      setPwLoading(false);

      if (result?.error) {
        router.replace("/login?passwordChanged=1");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPwLoading(false);
      setPwError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header>
        <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your profile and account security.
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0d1b35]">Profile</h2>
        <p className="mt-1 text-xs text-slate-500">
          Your teacher account details.
        </p>

        {loadingProfile ? (
          <p className="mt-4 text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                type="text"
                value={displayName}
                disabled
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={displayEmail}
                disabled
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Role
              </label>
              <input type="text" value="IELTS Teacher" disabled className={INPUT_CLASS} />
            </div>
          </div>
        )}
        <p className="mt-4 text-xs text-slate-400">
          To change your name or email, contact your Speakify administrator.
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0d1b35]">Change password</h2>
        <p className="mt-1 text-xs text-slate-500">
          Use a strong password of at least 8 characters. You will be signed in
          again after updating.
        </p>

        <form onSubmit={handleChangePassword} className="mt-5 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={INPUT_CLASS}
              autoComplete="current-password"
              required
              disabled={pwLoading}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={INPUT_CLASS}
                autoComplete="new-password"
                required
                disabled={pwLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={INPUT_CLASS}
                autoComplete="new-password"
                required
                disabled={pwLoading}
              />
            </div>
          </div>

          {pwError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {pwError}
            </p>
          ) : null}
          {pwSuccess ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {pwSuccess}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pwLoading}
            className="rounded-xl bg-[#0d1b35] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#152a4d] disabled:opacity-50"
          >
            {pwLoading ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
