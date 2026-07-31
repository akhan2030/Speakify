"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OtpInput } from "@/components/auth/PasswordRecoveryUI";

const RESEND_COOLDOWN_MS = 60 * 1000;

type DeliveryHint = {
  ok?: boolean;
  delivery?: string;
  maskedDestination?: string;
  error?: string;
};

function deliveryMessage(hint: DeliveryHint | null, channel: "email" | "phone") {
  if (!hint) {
    return channel === "email"
      ? "Open the verification link we sent to your email inbox."
      : "Enter the 6-digit code sent to your registered phone.";
  }
  if (hint.ok === false && hint.error) return hint.error;
  if (hint.delivery === "email" && hint.maskedDestination) {
    return channel === "phone"
      ? `We sent your 6-digit code to ${hint.maskedDestination} (WhatsApp/SMS is not configured yet).`
      : `Verification link sent to ${hint.maskedDestination}.`;
  }
  if (hint.delivery === "whatsapp") {
    return "Enter the 6-digit code sent to your WhatsApp.";
  }
  if (hint.delivery === "sms") {
    return "Enter the 6-digit code sent by SMS.";
  }
  if (hint.maskedDestination) {
    return channel === "email"
      ? `Verification link sent to ${hint.maskedDestination}.`
      : `Enter the 6-digit code sent to ${hint.maskedDestination}.`;
  }
  return channel === "email"
    ? "Open the verification link we sent to your email inbox."
    : "Enter the 6-digit code sent to your registered phone.";
}

function ResendButton({
  label,
  cooldownKey,
  onResend,
}: {
  label: string;
  cooldownKey: string;
  onResend: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(cooldownKey);
    if (!raw) return;
    const remaining = Math.ceil((Number(raw) - Date.now()) / 1000);
    if (remaining > 0) setSecondsLeft(remaining);
  }, [cooldownKey]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  async function handleClick() {
    setLoading(true);
    setMessage("");
    const result = await onResend();
    setLoading(false);
    if (result.ok) {
      const until = Date.now() + RESEND_COOLDOWN_MS;
      sessionStorage.setItem(cooldownKey, String(until));
      setSecondsLeft(Math.ceil(RESEND_COOLDOWN_MS / 1000));
      setMessage("Sent. Check your inbox or messages.");
      return;
    }
    setMessage(result.error ?? "Could not resend. Try again shortly.");
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || secondsLeft > 0}
        className="text-sm font-semibold text-[#0d9488] hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
      >
        {loading
          ? "Sending..."
          : secondsLeft > 0
            ? `Resend in ${secondsLeft}s`
            : label}
      </button>
      {message ? <p className="mt-1 text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}

function RegisterVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId")?.trim() ?? "";
  const name = searchParams.get("name")?.trim() || "Student";
  const program = searchParams.get("program")?.trim() || "ielts";
  const track = searchParams.get("track")?.trim().toLowerCase() ?? "";
  const emailToken = searchParams.get("token")?.trim() ?? "";

  const [otp, setOtp] = useState("");
  const [emailStatus, setEmailStatus] = useState<"pending" | "verified" | "error">("pending");
  const [phoneStatus, setPhoneStatus] = useState<"pending" | "verified" | "error">("pending");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailHint, setEmailHint] = useState<DeliveryHint | null>(null);
  const [phoneHint, setPhoneHint] = useState<DeliveryHint | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(`/api/auth/verify-registration/status?userId=${encodeURIComponent(userId)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    if (data.emailVerified) setEmailStatus("verified");
    if (data.phoneVerified) setPhoneStatus("verified");
    if (data.maskedEmail) setMaskedEmail(data.maskedEmail);
    if (data.maskedPhone) setMaskedPhone(data.maskedPhone);
  }, [userId]);

  useEffect(() => {
    const raw = sessionStorage.getItem(`speakify:register-delivery:${userId}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        email?: DeliveryHint;
        phone?: DeliveryHint;
      };
      setEmailHint(parsed.email ?? null);
      setPhoneHint(parsed.phone ?? null);
    } catch {
      // ignore malformed cache
    }
  }, [userId]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!emailToken) return;
    fetch("/api/auth/verify-registration/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: emailToken }),
    })
      .then(async (res) => {
        if (res.ok) {
          setEmailStatus("verified");
          await refreshStatus();
          return;
        }
        setEmailStatus("error");
      })
      .catch(() => setEmailStatus("error"));
  }, [emailToken, refreshStatus]);

  async function verifyPhone() {
    if (!userId) {
      setError("Missing account reference. Please register again.");
      return;
    }
    if (otp.length < 6) {
      setError("Enter the 6-digit code sent to your registered phone.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/verify-registration/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, otp }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setPhoneStatus("error");
      setError(data.error ?? "Invalid or expired code.");
      return;
    }
    setPhoneStatus("verified");
    await refreshStatus();
  }

  const resendPayload = useMemo(
    () => ({ userId, program, track: track || undefined }),
    [userId, program, track]
  );

  async function resendEmail() {
    const res = await fetch("/api/auth/verify-registration/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...resendPayload, channel: "email" }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.delivery) setEmailHint(data.delivery);
    return { ok: res.ok, error: data.error };
  }

  async function resendPhone() {
    const res = await fetch("/api/auth/verify-registration/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...resendPayload, channel: "phone" }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.delivery) setPhoneHint(data.delivery);
    return { ok: res.ok, error: data.error };
  }

  const emailDone = emailStatus === "verified";
  const phoneDone = phoneStatus === "verified";

  useEffect(() => {
    if (emailDone && phoneDone) {
      const params = new URLSearchParams({ name, program });
      if (track) params.set("track", track);
      const product = searchParams.get("product");
      const mock = searchParams.get("mock");
      if (product) params.set("product", product);
      if (mock) params.set("mock", mock);
      router.replace(`/register/welcome?${params.toString()}`);
    }
  }, [emailDone, phoneDone, name, program, track, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1b35] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-[#0d1b35]">Verify your account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Hi {name}, confirm your email and phone before signing in.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-medium text-[#0d1b35]">1. Email verification</p>
            <p className="mt-1 text-sm text-slate-600">
              {emailDone
                ? "Email verified."
                : emailToken && emailStatus === "pending"
                  ? "Verifying your email link..."
                  : emailStatus === "error"
                    ? "Email link invalid or expired."
                    : deliveryMessage(
                        emailHint ??
                          (maskedEmail ? { maskedDestination: maskedEmail, ok: true } : null),
                        "email"
                      )}
            </p>
            {!emailDone ? (
              <ResendButton
                label="Resend verification email"
                cooldownKey={`reg-resend-email:${userId}`}
                onResend={resendEmail}
              />
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-medium text-[#0d1b35]">2. Phone verification</p>
            <p className="mt-1 text-sm text-slate-600">
              {phoneDone
                ? "Phone verified."
                : deliveryMessage(
                    phoneHint ??
                      (maskedPhone ? { maskedDestination: maskedPhone, ok: true } : null),
                    "phone"
                  )}
            </p>
            <div className="mt-3">
              <OtpInput value={otp} onChange={setOtp} />
            </div>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              onClick={verifyPhone}
              disabled={loading || otp.length < 6 || phoneDone}
              className="mt-3 w-full rounded-xl bg-[#0d1b35] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify phone code"}
            </button>
            {!phoneDone ? (
              <ResendButton
                label="Resend verification code"
                cooldownKey={`reg-resend-phone:${userId}`}
                onResend={resendPhone}
              />
            ) : null}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already verified?{" "}
          <Link href="/login" className="font-semibold text-[#0d9488] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0d1b35] text-white">
          Loading…
        </div>
      }
    >
      <RegisterVerifyContent />
    </Suspense>
  );
}
