"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ISSUE_TYPES, SEVERITIES, STATUSES } from "@/lib/qaIssues";

const emptyForm = {
  title: "",
  description: "",
  issue_type: "technical_error",
  severity: "medium",
  affected_area: "",
  affected_url: "",
  content_id: "",
  suggested_fix: "",
  assigned_to: "",
  quick_fix: false,
  status: "detected",
};

export default function CreateQaIssuePage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Issue title is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create issue");
      router.push(`/dashboard/teacher/qa/issues/${data.issue.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create issue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <Link
        href="/dashboard/teacher/qa"
        className="text-sm font-medium text-[#0d9488] hover:underline"
      >
        ← Trust & QA Center
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">Create New Issue</h1>
      <p className="mt-1 text-gray-500">Log a new quality or trust issue for review</p>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-5">
        <label className="block text-sm">
          <span className="font-medium text-[#0d1b35]">
            Issue Title <span className="text-red-500">*</span>
          </span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Brief summary of the issue"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#0d1b35]">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="What happened? Who is affected?"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[#0d1b35]">Issue Type</span>
            <select
              value={form.issue_type}
              onChange={(e) => setForm({ ...form, issue_type: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#0d1b35]">Severity</span>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-[#0d1b35]">Affected Area</span>
          <input
            value={form.affected_area}
            onChange={(e) => setForm({ ...form, affected_area: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="e.g. Daily Practice, Listening Module"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#0d1b35]">Affected URL</span>
          <input
            value={form.affected_url}
            onChange={(e) => setForm({ ...form, affected_url: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="https://..."
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#0d1b35]">Content ID</span>
          <span className="ml-1 text-slate-400">(optional)</span>
          <input
            value={form.content_id}
            onChange={(e) => setForm({ ...form, content_id: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#0d1b35]">Suggested Fix</span>
          <textarea
            value={form.suggested_fix}
            onChange={(e) => setForm({ ...form, suggested_fix: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#0d1b35]">Assigned To</span>
          <input
            value={form.assigned_to}
            onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Teacher name"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.quick_fix}
            onChange={(e) => setForm({ ...form, quick_fix: e.target.checked })}
            className="rounded border-slate-300"
          />
          <span className="font-medium text-[#0d1b35]">
            Quick Fix? <span className="font-normal text-slate-500">(under 30 minutes)</span>
          </span>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#0d1b35]">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#c9972c] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit Issue"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/teacher/qa")}
            className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
