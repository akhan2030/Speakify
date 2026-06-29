"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

type Props = {
  token: string;
};

export default function TeacherInviteRegisterForm({ token }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function validate() {
      try {
        const res = await fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok || !json.valid) {
          setTokenError(json.error ?? "This invite link is invalid.");
          return;
        }

        setEmail(json.email ?? "");
      } catch {
        if (!cancelled) setTokenError("Could not validate invite. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    validate();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/invites/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName: fullName.trim(),
          password,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Registration failed.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: json.email,
        password,
        redirect: false,
      });

      if (signInResult?.error || !signInResult?.ok) {
        router.push(`/login?callbackUrl=${encodeURIComponent("/dashboard/teacher")}`);
        return;
      }

      router.push("/dashboard/teacher");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b35]">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b35] px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-xl font-bold text-white">Invalid invite</h1>
          <p className="mt-3 text-sm text-slate-300">{tokenError}</p>
          <Link
            href="/login"
            className="mt-6 inline-block font-semibold text-[#c9972c] hover:underline"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b35] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#c9972c]" />
          <div>
            <p className="text-lg font-extrabold text-[#0d1b35]">Speakify</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
              Teacher registration
            </p>
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-[#0d1b35]">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">
          You were invited to join Speakify as a teacher. Set your name and password to finish.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className={`${inputClass} bg-slate-50 text-slate-600`}
            />
          </div>

          <div>
            <label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              className={inputClass}
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#c9972c] px-4 py-3 text-base font-bold text-[#0d1b35] transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create teacher account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#c9972c] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
