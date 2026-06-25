"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b35] text-white">
        Loading…
      </div>
    );
  }

  if (!session?.user) {
    router.replace("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Could not update password.");
        setLoading(false);
        return;
      }

      await signOut({ redirect: false });
      const email = session.user.email ?? "";
      const signInResult = await signIn("credentials", {
        email,
        password: newPassword,
        redirect: false,
      });
      setLoading(false);

      if (signInResult?.error) {
        router.replace("/login?passwordChanged=1");
        return;
      }

      const role = (session.user as { role?: string }).role;
      router.replace(
        role === "teacher" ? "/dashboard/teacher" : "/dashboard/student"
      );
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1b35] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white px-6 py-8 shadow-xl sm:px-10">
        <div className="text-center">
          <div className="text-2xl font-extrabold text-[#0d1b35]">Speakify</div>
          <h1 className="mt-6 text-xl font-bold text-slate-900">
            Set your new password
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            For security, please choose a new password before continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Current (temporary) password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]"
              autoComplete="new-password"
              required
              disabled={loading}
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]"
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#c9972c] py-3 font-semibold text-[#0d1b35] disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
