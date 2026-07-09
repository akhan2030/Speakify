"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OtpInput } from "@/components/auth/PasswordRecoveryUI";

function RegisterVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId")?.trim() ?? "";
  const name = searchParams.get("name")?.trim() || "Student";
  const program = searchParams.get("program")?.trim() || "ielts";
  const emailToken = searchParams.get("token")?.trim() ?? "";

  const [otp, setOtp] = useState("");
  const [emailStatus, setEmailStatus] = useState<"pending" | "verified" | "error">("pending");
  const [phoneStatus, setPhoneStatus] = useState<"pending" | "verified" | "error">("pending");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          return;
        }
        setEmailStatus("error");
      })
      .catch(() => setEmailStatus("error"));
  }, [emailToken]);

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
  }

  const emailDone = emailStatus === "verified";
  const phoneDone = phoneStatus === "verified";

  useEffect(() => {
    if (emailDone && phoneDone) {
      const params = new URLSearchParams({ name, program });
      router.replace(`/register/welcome?${params.toString()}`);
    }
  }, [emailDone, phoneDone, name, program, router]);

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
              {emailToken
                ? emailStatus === "verified"
                  ? "Email verified."
                  : emailStatus === "error"
                    ? "Email link invalid or expired. Check your inbox for a new link."
                    : "Verifying your email link..."
                : "Open the verification link we sent to your email inbox."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-medium text-[#0d1b35]">2. Phone / WhatsApp verification</p>
            <p className="mt-1 text-sm text-slate-600">
              Enter the 6-digit code sent to the phone number you registered.
            </p>
            <div className="mt-3">
              <OtpInput value={otp} onChange={setOtp} />
            </div>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              onClick={verifyPhone}
              disabled={loading || otp.length < 6}
              className="mt-3 w-full rounded-xl bg-[#0d1b35] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify phone code"}
            </button>
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
