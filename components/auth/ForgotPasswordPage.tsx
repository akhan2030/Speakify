"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AuthBackButton,
  AuthCardShell,
  AuthPrimaryButton,
  AuthSignInLink,
  OtpInput,
  SetNewPasswordForm,
} from "@/components/auth/PasswordRecoveryUI";

type Method =
  | "select"
  | "whatsapp"
  | "sms"
  | "email"
  | "otp"
  | "email_sent"
  | "new_password"
  | "success";

type OtpChannel = "whatsapp" | "sms";

export default function ForgotPasswordPage() {
  const [method, setMethod] = useState<Method>("select");
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("whatsapp");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [otpDelivery, setOtpDelivery] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [otpMaskedEmail, setOtpMaskedEmail] = useState("");

  const phoneE164 = phone.length === 9 ? `+966${phone}` : "";

  async function sendOtp(channel: OtpChannel) {
    if (phone.length < 9) {
      setError("Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/auth/forgot-password/${channel}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneE164 }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (data.error) {
      setError(data.error);
      return;
    }
    setOtpChannel(channel);
    setOtpDelivery(data.delivery === "email" ? "email" : channel);
    setOtpMaskedEmail(typeof data.maskedEmail === "string" ? data.maskedEmail : "");
    setOtp("");
    setMethod("otp");
  }

  async function verifyOtp() {
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneE164, otp }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (data.error || !data.resetToken) {
      setError("Incorrect or expired code. Please try again.");
      return;
    }
    setResetToken(data.resetToken);
    setMethod("new_password");
  }

  async function resetPassword() {
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
      body: JSON.stringify({ resetToken, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (data.error) {
      setError(data.error);
      return;
    }
    setMethod("success");
  }

  if (method === "select") {
    return (
      <AuthCardShell
        title="Reset your password"
        subtitle="Choose how you would like to receive your reset code"
      >
        <button
          type="button"
          onClick={() => {
            setError("");
            setMethod("whatsapp");
          }}
          className="mb-3 flex w-full items-center gap-3 rounded-xl border-2 border-[#25D366] bg-green-50 p-4 text-left hover:bg-green-100/80"
        >
          <span className="text-2xl">💬</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#0d1b35]">Send code via WhatsApp</p>
            <p className="text-xs text-slate-600">Fastest for Saudi students — 6-digit code</p>
          </div>
          <span className="shrink-0 rounded bg-[#25D366] px-2 py-0.5 text-[10px] font-bold text-white">
            RECOMMENDED
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setError("");
            setMethod("sms");
          }}
          className="mb-3 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
        >
          <span className="text-2xl">📱</span>
          <div>
            <p className="font-semibold text-[#0d1b35]">Send code via SMS</p>
            <p className="text-xs text-slate-600">Backup option — text message to your phone</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setError("");
            setMethod("email");
          }}
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
        >
          <span className="text-2xl">📧</span>
          <div>
            <p className="font-semibold text-[#0d1b35]">Send reset link via email</p>
            <p className="text-xs text-slate-600">Check inbox and spam folder</p>
          </div>
        </button>

        <AuthSignInLink />
      </AuthCardShell>
    );
  }

  if (method === "whatsapp" || method === "sms") {
    const channel = method;
    return (
      <AuthCardShell
        title={channel === "whatsapp" ? "WhatsApp reset code" : "SMS reset code"}
        subtitle={
          channel === "whatsapp"
            ? "Enter the phone number you registered with. We will send a 6-digit code to your WhatsApp."
            : "Enter the phone number you registered with. We will text you a 6-digit code."
        }
      >
        <AuthBackButton onClick={() => setMethod("select")} />

        <label className="block text-sm font-medium text-slate-700">Mobile number</label>
        <div className="mt-1 flex gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-[#0d1b35]">
            🇸🇦 +966
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
            placeholder="5X XXX XXXX"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]"
          />
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4">
          <AuthPrimaryButton
            loading={loading}
            onClick={() => sendOtp(channel)}
            className={
              channel === "whatsapp" ? "bg-[#25D366] text-white" : "bg-[#0d1b35] text-white"
            }
          >
            {channel === "whatsapp" ? "Send WhatsApp code →" : "Send SMS code →"}
          </AuthPrimaryButton>
        </div>
      </AuthCardShell>
    );
  }

  if (method === "email") {
    return (
      <AuthCardShell
        title="Email reset link"
        subtitle="Enter your registered email address. We will send you a link to reset your password."
      >
        <AuthBackButton onClick={() => setMethod("select")} />

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
          <AuthPrimaryButton
            loading={loading}
            onClick={async () => {
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
              if (data.error) {
                setError(data.error);
                return;
              }
              setMethod("email_sent");
            }}
          >
            Send reset link →
          </AuthPrimaryButton>
        </div>
      </AuthCardShell>
    );
  }

  if (method === "email_sent") {
    return (
      <AuthCardShell title="Check your email">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            📧
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            If an account exists for <strong>{email}</strong>, we sent a password reset link.
            The link expires in 1 hour.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Did not receive it? Check spam, or try WhatsApp reset instead.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setMethod("whatsapp")}
              className="rounded-xl border border-[#25D366] bg-green-50 px-4 py-3 text-sm font-semibold text-[#0d1b35]"
            >
              Try WhatsApp instead
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

  if (method === "otp") {
    const otpSubtitle =
      otpDelivery === "email"
        ? `We sent a 6-digit code to ${otpMaskedEmail || "your registered email"}. WhatsApp was unavailable, so check your inbox and spam folder. The code expires in 10 minutes.`
        : `We sent a 6-digit code to ${otpChannel === "whatsapp" ? "WhatsApp" : "SMS"} number +966${phone}. It expires in 10 minutes.`;

    return (
      <AuthCardShell
        title="Enter your code"
        subtitle={otpSubtitle}
      >
        <div className="mb-6">
          <OtpInput value={otp} onChange={setOtp} />
        </div>

        {error ? <p className="mb-3 text-center text-sm text-red-600">{error}</p> : null}

        <AuthPrimaryButton
          disabled={otp.length < 6}
          loading={loading}
          onClick={verifyOtp}
        >
          Verify code →
        </AuthPrimaryButton>

        <p className="mt-4 text-center text-sm text-slate-500">
          Did not receive the code?{" "}
          <button
            type="button"
            onClick={() => sendOtp(otpChannel)}
            className="font-semibold text-[#0d9488] hover:underline"
          >
            Resend code
          </button>
        </p>
      </AuthCardShell>
    );
  }

  if (method === "new_password") {
    return (
      <AuthCardShell
        title="Set new password"
        subtitle="Choose a strong password you will remember."
      >
        <SetNewPasswordForm
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          error={error}
          loading={loading}
          onSubmit={resetPassword}
        />
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell title="Password updated">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
          ✅
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          Your password has been changed successfully. You can now sign in with your new password.
        </p>
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
