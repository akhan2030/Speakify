"use client";

import { useState } from "react";

type InviteSuccess = {
  email: string;
  registerUrl: string;
  mailtoUrl?: string;
  emailed: boolean;
  mode?: string;
};

type CreateSuccess = {
  email: string;
  password: string;
  name: string;
};

export default function TeacherAccessPanel() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<InviteSuccess | null>(null);

  const [fullName, setFullName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<CreateSuccess | null>(null);

  async function onSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setInviteLoading(true);

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        setInviteError(json.error ?? "Could not send invite.");
        return;
      }

      setInviteSuccess({
        email: json.email,
        registerUrl: json.registerUrl ?? "",
        mailtoUrl: json.mailtoUrl,
        emailed: json.emailed === true,
        mode: json.mode,
      });
      setInviteEmail("");

      if (json.mode === "mailto" && json.mailtoUrl) {
        window.location.href = json.mailtoUrl;
      }
    } catch {
      setInviteError("Something went wrong. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function onCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setCreateLoading(true);

    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: createEmail.trim().toLowerCase(),
          password,
        }),
      });

      let json: { error?: string; email?: string; password?: string; name?: string } = {};
      try {
        json = await res.json();
      } catch {
        setCreateError(`Server error (${res.status}). Try signing out and back in as admin.`);
        return;
      }

      if (!res.ok) {
        if (res.status === 401) {
          setCreateError("You are not signed in. Please log in as admin and try again.");
          return;
        }
        if (res.status === 403) {
          setCreateError(
            "Admin access required. Sign in as admin@speakify.com, or sign out and sign in again if your role was recently changed."
          );
          return;
        }
        setCreateError(json.error ?? "Could not create teacher.");
        return;
      }

      setCreateSuccess({
        email: json.email ?? createEmail.trim().toLowerCase(),
        password: json.password ?? password,
        name: json.name ?? fullName.trim(),
      });
      setFullName("");
      setCreateEmail("");
      setPassword("");
    } catch {
      setCreateError("Something went wrong. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[#0d1b35]">Teacher access</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Invite teachers by email or create an account directly. New teachers sign in at{" "}
          <span className="font-medium text-[#0d1b35]">/login</span> and land on the teacher
          dashboard.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c9972c]">Option A</p>
          <h2 className="mt-1 text-lg font-bold text-[#0d1b35]">Send invite link</h2>
          <p className="mt-2 text-sm text-slate-500">
            Email a one-time registration link. The teacher sets their password and is signed in
            automatically.
          </p>

          <form onSubmit={onSendInvite} className="mt-6 space-y-4">
            <div>
              <label htmlFor="invite-email" className="text-sm font-semibold text-slate-700">
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teacher@example.com"
                required
                className={inputClass}
              />
            </div>

            {inviteError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{inviteError}</p>
            ) : null}

            {inviteSuccess ? (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <p className="font-semibold">
                  {inviteSuccess.emailed ? "Invite sent" : "Invite created"}
                </p>
                {inviteSuccess.emailed ? (
                  <p className="mt-1">
                    A registration link was emailed to{" "}
                    <span className="font-medium">{inviteSuccess.email}</span>. The link expires in
                    7 days.
                  </p>
                ) : (
                  <>
                    <p className="mt-1">
                      Your email app should open with a pre-filled message to{" "}
                      <span className="font-medium">{inviteSuccess.email}</span>. Click send in
                      Gmail, Outlook, or your default mail app (link expires in 7 days).
                    </p>
                    {inviteSuccess.mailtoUrl ? (
                      <a
                        href={inviteSuccess.mailtoUrl}
                        className="mt-3 inline-flex rounded-lg bg-[#0d1b35] px-4 py-2 text-xs font-bold text-white hover:opacity-95"
                      >
                        Open email app again
                      </a>
                    ) : null}
                    {inviteSuccess.registerUrl ? (
                      <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Registration link
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-[#0d1b35]">
                          {inviteSuccess.registerUrl}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(inviteSuccess.registerUrl);
                          }}
                          className="mt-2 text-xs font-semibold text-[#c9972c] hover:underline"
                        >
                          Copy link
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={inviteLoading}
              className="rounded-xl bg-[#0d1b35] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {inviteLoading ? "Sending…" : "Send invite"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c9972c]">Option B</p>
          <h2 className="mt-1 text-lg font-bold text-[#0d1b35]">Create teacher account directly</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create the account immediately. Share the credentials with the teacher so they can sign
            in.
          </p>

          <form onSubmit={onCreateTeacher} className="mt-6 space-y-4">
            <div>
              <label htmlFor="teacher-name" className="text-sm font-semibold text-slate-700">
                Full name
              </label>
              <input
                id="teacher-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="teacher-email" className="text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                id="teacher-email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="teacher-password" className="text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                id="teacher-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className={inputClass}
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-slate-500">Minimum 6 characters</p>
            </div>

            {createError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{createError}</p>
            ) : null}

            {createSuccess ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="font-semibold">Teacher account created</p>
                <p className="mt-2">
                  <span className="text-emerald-700">Name:</span>{" "}
                  <span className="font-medium">{createSuccess.name}</span>
                </p>
                <p className="mt-1">
                  <span className="text-emerald-700">Email:</span>{" "}
                  <span className="font-mono font-medium">{createSuccess.email}</span>
                </p>
                <p className="mt-1">
                  <span className="text-emerald-700">Password:</span>{" "}
                  <span className="font-mono font-medium">{createSuccess.password}</span>
                </p>
                <p className="mt-3 text-emerald-800">
                  Share these credentials with the teacher. They sign in at{" "}
                  <a href="/login" className="font-semibold underline">
                    /login
                  </a>{" "}
                  and will land on the teacher dashboard.
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={createLoading}
              className="rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35] transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {createLoading ? "Creating…" : "Create teacher"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
