"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { dashboardPathForSessionUser } from "@/lib/auth";
import { normalizeProgramType, studentDashboardPath } from "@/lib/programType";
import { normalizeRole } from "@/lib/roles";
import SpeakifyWay from "@/components/SpeakifyWay";

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0d1b35]/40 border-t-[#0d1b35]" />
  );
}

async function waitForServerSession() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch("/api/auth/session", { cache: "no-store", credentials: "include" });
    const session = await res.json().catch(() => null);
    const role = normalizeRole(session?.user?.role);
    if (session?.user && role) return session;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

function readCredentialsFromForm(
  form: HTMLFormElement | null,
  fallbackEmail: string,
  fallbackPassword: string,
  demoEmail?: string,
  demoPassword?: string
) {
  if (demoEmail && demoPassword) {
    return { email: demoEmail, password: demoPassword };
  }
  if (form) {
    const data = new FormData(form);
    const emailInput = form.elements.namedItem("email") as HTMLInputElement | null;
    const passwordInput = form.elements.namedItem("password") as HTMLInputElement | null;
    return {
      email: String(data.get("email") ?? emailInput?.value ?? fallbackEmail).trim(),
      password: String(data.get("password") ?? passwordInput?.value ?? fallbackPassword),
    };
  }
  return { email: fallbackEmail.trim(), password: fallbackPassword };
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function safeCallbackPath(callbackUrl: string | null): string | null {
  if (!callbackUrl) return null;
  const decoded = decodeURIComponent(callbackUrl);
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  return null;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0d1b35] text-white">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    e?: React.FormEvent<HTMLFormElement>,
    demoEmail?: string,
    demoPassword?: string
  ) => {
    e?.preventDefault();
    setLoading(true);
    setError("");

    const form = e?.currentTarget ?? document.getElementById("login-form");
    const { email: loginEmail, password: loginPassword } = readCredentialsFromForm(
      form instanceof HTMLFormElement ? form : null,
      email,
      password,
      demoEmail,
      demoPassword
    );

    if (!loginEmail || !loginPassword) {
      setError("Enter your email and password.");
      setLoading(false);
      return;
    }

    let redirecting = false;

    try {
      const result = await withTimeout(
        signIn("credentials", {
          email: loginEmail,
          password: loginPassword,
          redirect: false,
        }),
        30000,
        "Sign-in timed out. Check your connection and try again."
      );

      if (result?.error || !result?.ok) {
        setError(
          result?.error === "CredentialsSignin"
            ? "Invalid email or password."
            : "Sign in failed. Please try again."
        );
        return;
      }

      const session = await waitForServerSession();
      if (!session?.user) {
        setError(
          "Signed in but session did not start. If you use a shared link (not localhost), run npm run share and try again."
        );
        return;
      }

      const mustChangePassword =
        (session.user as { mustChangePassword?: boolean }).mustChangePassword ===
        true;

      redirecting = true;

      if (mustChangePassword) {
        window.location.href = "/change-password";
        return;
      }

      const redirectPath =
        safeCallbackPath(callbackUrl) ??
        dashboardPathForSessionUser(
          session.user as { role?: string; programType?: string }
        );

      window.location.href =
        redirectPath && redirectPath !== "/login"
          ? redirectPath
          : studentDashboardPath(
              normalizeProgramType(
                (session.user as { programType?: string }).programType
              )
            );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      if (!redirecting) setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0d1b35]">
      <div className="hidden w-1/2 flex-col justify-center px-12 py-16 lg:flex xl:px-20">
        <SpeakifyWay variant="hero" />
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-10 lg:w-1/2">
      <div className="w-full max-w-md rounded-2xl bg-white px-6 py-8 shadow-xl sm:px-10">
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-full bg-[#c9972c]" />
          <div className="mt-4 text-2xl font-extrabold text-[#0d1b35]">Speakify</div>
          <div className="mt-1 text-sm text-slate-500">Global Language Center</div>
          <div className="mt-6 text-xl font-bold text-slate-900">Welcome back</div>
          <div className="mt-1 text-sm text-slate-500">Sign in to your account</div>
        </div>

        <form id="login-form" onSubmit={handleLogin} className="mt-8 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]"
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9972c] py-3 font-semibold text-[#0d1b35] shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-[#0d9488] hover:underline">
              Register free →
            </Link>
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Quick demo sign-in
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleLogin(undefined, "admin@speakify.com", "Speakify2026!")
                }
                className="rounded-lg border border-[#c9972c]/50 bg-white px-3 py-2.5 text-left text-xs font-semibold text-[#0d1b35] hover:bg-[#c9972c]/10 disabled:opacity-50"
              >
                Sign in as Admin (teacher dashboard) →
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleLogin(undefined, "ahmed@test.com", "Speakify2026!")
                }
                className="rounded-lg border border-[#0d9488]/50 bg-white px-3 py-2.5 text-left text-xs font-semibold text-[#0d1b35] hover:bg-[#0d9488]/10 disabled:opacity-50"
              >
                Sign in as Student →
              </button>
            </div>
            <p className="mt-2 text-[0.65rem] text-slate-400">
              Password: Speakify2026!
            </p>
          </div>
        </form>
      </div>
      <div className="mt-6 w-full max-w-md lg:hidden">
        <SpeakifyWay variant="compact" />
      </div>
      </div>
    </div>
  );
}
