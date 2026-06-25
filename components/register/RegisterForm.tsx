"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  getRegistrationProgram,
  type RegistrationSlug,
} from "@/lib/registration";

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0d1b35]/40 border-t-[#0d1b35]" />
  );
}

export default function RegisterForm({ slug }: { slug: RegistrationSlug }) {
  const router = useRouter();
  const program = getRegistrationProgram(slug);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      email.trim().length > 0 &&
      phone.trim().length > 0 &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      termsAccepted &&
      !loading
    );
  }, [fullName, email, phone, password, confirmPassword, termsAccepted, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programType: program.programType,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          confirmPassword,
          termsAccepted,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Registration failed. Please try again.");
        return;
      }

      const params = new URLSearchParams({
        name: fullName.trim(),
        program: slug,
      });
      router.push(`/register/welcome?${params.toString()}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]";

  const buttonClass =
    slug === "pathway"
      ? "bg-[#0d9488] text-white hover:opacity-95"
      : "bg-[#c9972c] text-[#0d1b35] hover:opacity-95";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="flex flex-col justify-center bg-[#0d1b35] px-8 py-12 text-white lg:px-14">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 rounded-full bg-[#c9972c]" />
            <div>
              <p className="text-2xl font-extrabold">Speakify</p>
              <p className="text-sm text-[#c9972c]">Global Language Center</p>
            </div>
          </div>
          <p className="mt-8 text-xl font-semibold text-white/95">
            Join {program.label}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {program.description}
          </p>
          <ul className="mt-8 space-y-4">
            {program.bullets.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: program.accent }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-slate-50 px-4 py-10 lg:bg-white">
        <div className="w-full max-w-lg rounded-2xl bg-white px-6 py-8 shadow-xl sm:px-10 lg:shadow-none">
          <p
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: program.accent }}
          >
            {program.tagline}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#0d1b35]">
            Register for {program.label}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create your account to start learning
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Your full name"
                autoComplete="name"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="+966 5XX XXX XXXX"
                autoComplete="tel"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} mt-0 pr-12`}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-[#0d1b35]"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} mt-0 pr-12`}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-[#0d1b35]"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#c9972c] focus:ring-[#c9972c]"
                disabled={loading}
              />
              <span className="text-sm text-slate-600">
                I agree to the{" "}
                <span className="font-medium text-[#0d1b35]">Terms</span> and{" "}
                <span className="font-medium text-[#0d1b35]">Privacy Policy</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
            >
              {loading ? (
                <>
                  <Spinner />
                  Creating account…
                </>
              ) : (
                `Create ${program.label} Account`
              )}
            </button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#0d9488] hover:underline"
              >
                Sign in →
              </Link>
            </p>

            {error ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        </div>
      </main>
    </div>
  );
}
