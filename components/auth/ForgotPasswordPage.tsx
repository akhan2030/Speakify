"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthBackButton,
  AuthCardShell,
  AuthPrimaryButton,
  AuthSignInLink,
  SetNewPasswordForm,
} from "@/components/auth/PasswordRecoveryUI";

type Method = "email" | "email_sent";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const genericResetMessage =
    "If an account exists with a verified email on file, we have sent reset instructions.";

  async function sendResetEmail() {
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok && res.status === 400) {
      setError(data.error ?? "Please enter a valid email address.");
      return;
    }
    setError("");
    setMethod("email_sent");
  }

  if (method === "email_sent") {
    return (
      <AuthCardShell title="Check your email">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            📧
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            {genericResetMessage} Check your verified email inbox. Reset links expire in 15
            minutes.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Did not receive it? Check your spam or junk folder.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={sendResetEmail}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0d1b35] hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Resend email"}
            </button>
            <Link
              href="/login"
              className="rounded-xl bg-[#c9972c] px-4 py-3 text-sm font-semibold text-[#0d1b35]"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell
      title="Reset your password"
      subtitle="Enter your registered email address. We will send you a link to reset your password."
    >
      <AuthBackButton onClick={() => router.push("/login")} />

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        💡 <strong>Check your spam folder</strong> if you do not see the email within 2 minutes.
      </div>

      <label className="block text-sm font-medium text-slate-700">Email address</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]"
      />

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4">
        <AuthPrimaryButton loading={loading} onClick={sendResetEmail}>
          Send reset link →
        </AuthPrimaryButton>
      </div>

      <AuthSignInLink />
    </AuthCardShell>
  );
}

/** Allow reset-password page to jump straight to new password when token is in URL. */
export function ResetPasswordWithToken({ initialToken }: { initialToken: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <AuthCardShell title="Password updated">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
            ✅
          </div>
          <p className="text-sm text-slate-600">Your password has been updated.</p>
          <Link
            href="/login"
            className="mt-6 inline-block w-full rounded-xl bg-[#c9972c] px-4 py-3 text-sm font-semibold text-[#0d1b35]"
          >
            Sign in now →
          </Link>
        </div>
      </AuthCardShell>
    );
  }

  if (!initialToken) {
    return (
      <AuthCardShell title="Invalid reset link">
        <p className="text-center text-sm text-slate-600">
          This password reset link is missing or invalid.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block w-full rounded-xl bg-[#0d1b35] px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Request a new reset →
        </Link>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell title="Set new password" subtitle="Choose a new password for your account.">
      <SetNewPasswordForm
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        error={error}
        loading={loading}
        onSubmit={async () => {
          if (newPassword.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
          }
          if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
          }
          setLoading(true);
          setError("");
          const res = await fetch("/api/auth/forgot-password/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resetToken: initialToken, newPassword }),
          });
          const data = await res.json().catch(() => ({}));
          setLoading(false);
          if (data.error) {
            setError(data.error);
            return;
          }
          setDone(true);
        }}
      />
    </AuthCardShell>
  );
}
