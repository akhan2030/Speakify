"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SeverityBadge, StatusBadge } from "@/components/QaBadges";
import {
  formatDate,
  formatIssueType,
  ISSUE_TYPES,
  SEVERITIES,
  STATUSES,
  type QaIssue,
} from "@/lib/qaIssues";

export default function QaIssueDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [issue, setIssue] = useState<QaIssue | null>(null);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [form, setForm] = useState<Partial<QaIssue>>({});

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teacher/qa/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load issue");
      setIssue(data.issue);
      setTeachers(data.teachers ?? []);
      setResolutionNotes(data.issue.resolution_notes ?? "");
      setForm(data.issue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setIssue(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchIssue(updates: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/qa/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setIssue(data.issue);
      setForm(data.issue);
      setResolutionNotes(data.issue.resolution_notes ?? "");
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500">Loading...</div>;
  }

  if (error || !issue) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error ?? "Issue not found"}</p>
        <Link href="/dashboard/teacher/qa/issues" className="mt-4 inline-block text-[#0d9488]">
          ← Back to issues
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/dashboard/teacher/qa/issues"
        className="text-sm font-medium text-[#0d9488] hover:underline"
      >
        ← All Issues
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={issue.severity} />
            <StatusBadge status={issue.status} />
            {issue.quick_fix ? (
              <span className="rounded-full bg-[#c9972c]/15 px-2 py-0.5 text-xs font-semibold text-[#c9972c]">
                Quick Fix
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-[#0d1b35]">{issue.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Created {formatDate(issue.created_at)} · Updated {formatDate(issue.updated_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-lg border border-[#0d1b35] px-4 py-2 text-sm font-semibold text-[#0d1b35]"
        >
          {editing ? "Cancel Edit" : "Edit"}
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {editing ? (
            <div className="space-y-4 rounded-xl border bg-white p-6">
              <label className="block text-sm">
                <span className="font-medium text-[#0d1b35]">Title</span>
                <input
                  value={form.title ?? ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-[#0d1b35]">Description</span>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-[#0d1b35]">Type</span>
                  <select
                    value={form.issue_type ?? "technical_error"}
                    onChange={(e) =>
                      setForm({ ...form, issue_type: e.target.value as QaIssue["issue_type"] })
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2"
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
                    value={form.severity ?? "medium"}
                    onChange={(e) =>
                      setForm({ ...form, severity: e.target.value as QaIssue["severity"] })
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2"
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
                  value={form.affected_area ?? ""}
                  onChange={(e) => setForm({ ...form, affected_area: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-[#0d1b35]">Affected URL</span>
                <input
                  value={form.affected_url ?? ""}
                  onChange={(e) => setForm({ ...form, affected_url: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-[#0d1b35]">Suggested Fix</span>
                <textarea
                  value={form.suggested_fix ?? ""}
                  onChange={(e) => setForm({ ...form, suggested_fix: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() => patchIssue(form)}
                className="rounded-lg bg-[#c9972c] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <>
              <section className="rounded-xl border bg-white p-6">
                <h2 className="mb-2 font-bold text-[#0d1b35]">Description</h2>
                <p className="whitespace-pre-wrap text-slate-700">
                  {issue.description || "No description provided."}
                </p>
              </section>
              <section className="rounded-xl border bg-white p-6">
                <h2 className="mb-3 font-bold text-[#0d1b35]">Details</h2>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Type</dt>
                    <dd className="font-medium">{formatIssueType(issue.issue_type)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Affected Area</dt>
                    <dd className="font-medium">{issue.affected_area ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Affected URL</dt>
                    <dd className="break-all font-medium">
                      {issue.affected_url ? (
                        <a
                          href={issue.affected_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0d9488] hover:underline"
                        >
                          {issue.affected_url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Content ID</dt>
                    <dd className="font-medium">{issue.content_id ?? "—"}</dd>
                  </div>
                </dl>
                {issue.suggested_fix ? (
                  <div className="mt-4">
                    <dt className="text-sm text-slate-500">Suggested Fix</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-slate-700">
                      {issue.suggested_fix}
                    </dd>
                  </div>
                ) : null}
              </section>
            </>
          )}

          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-2 font-bold text-[#0d1b35]">Resolution Notes</h2>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
              placeholder="Document how this issue was resolved..."
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => patchIssue({ resolution_notes: resolutionNotes })}
              className="mt-3 rounded-lg bg-[#0d1b35] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Save Notes
            </button>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 font-bold text-[#0d1b35]">Workflow</h2>
            <label className="mb-4 block text-sm">
              <span className="font-medium text-slate-600">Status</span>
              <select
                value={issue.status}
                disabled={saving}
                onChange={(e) => patchIssue({ status: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mb-4 block text-sm">
              <span className="font-medium text-slate-600">Assigned To</span>
              <select
                value={issue.assigned_to ?? ""}
                disabled={saving}
                onChange={(e) => patchIssue({ assigned_to: e.target.value || null })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                <option value="">Unassigned</option>
                {teachers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => patchIssue({ status: "fixed" })}
                className="rounded-lg bg-green-600 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Mark as Fixed
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => patchIssue({ status: "dismissed" })}
                className="rounded-lg bg-slate-400 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
