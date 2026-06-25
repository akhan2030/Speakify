"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { SeverityBadge, StatusBadge } from "@/components/QaBadges";
import {
  filterIssues,
  formatDate,
  formatIssueType,
  ISSUE_TYPES,
  SEVERITIES,
  STATUSES,
  type QaIssue,
} from "@/lib/qaIssues";

function IssuesListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [issues, setIssues] = useState<QaIssue[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const card = searchParams.get("card");
  const severity = searchParams.get("severity") ?? "all";
  const type = searchParams.get("type") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const assigned = searchParams.get("assigned") ?? "all";
  const search = searchParams.get("q") ?? "";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/qa", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load issues");
      setIssues(data.issues ?? []);
      setTeachers(data.teachers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      filterIssues(issues, { card, severity, type, status, assigned, search }),
    [issues, card, severity, type, status, assigned, search]
  );

  const assignees = useMemo(() => {
    const names = new Set(teachers);
    for (const issue of issues) {
      if (issue.assigned_to) names.add(issue.assigned_to);
    }
    return Array.from(names).sort();
  }, [issues, teachers]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`/dashboard/teacher/qa/issues?${params.toString()}`);
  }

  async function quickUpdateStatus(issueId: string, newStatus: string) {
    setSavingId(issueId);
    try {
      const res = await fetch(`/api/teacher/qa/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, ...data.issue } : i))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/teacher/qa"
            className="text-sm font-medium text-[#0d9488] hover:underline"
          >
            ← Trust & QA Center
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[#0d1b35]">All Issues</h1>
          <p className="text-gray-500">{filtered.length} issue(s) shown</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/teacher/qa/issues/new")}
          className="rounded-lg bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-white"
        >
          Create New Issue
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search issues..."
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setParam("q", (e.target as HTMLInputElement).value);
            }
          }}
          className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={severity}
          onChange={(e) => setParam("severity", e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setParam("type", e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          {ISSUE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={assigned}
          onChange={(e) => setParam("assigned", e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">All assignees</option>
          {assignees.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? (
          <p className="px-6 py-8 text-slate-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-8 text-slate-400">No issues match your filters.</p>
        ) : (
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Affected Area</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50">
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium text-[#0d1b35]">
                    {issue.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatIssueType(issue.issue_type)}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={issue.severity} />
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-3 text-slate-600">
                    {issue.affected_area ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={issue.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {issue.assigned_to ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(issue.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/teacher/qa/issues/${issue.id}`}
                        className="rounded bg-[#0d1b35] px-2.5 py-1 text-xs font-semibold text-white"
                      >
                        View
                      </Link>
                      <select
                        value={issue.status}
                        disabled={savingId === issue.id}
                        onChange={(e) => quickUpdateStatus(issue.id, e.target.value)}
                        className="rounded border border-slate-200 px-2 py-1 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function QaIssuesListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading...</div>}>
      <IssuesListContent />
    </Suspense>
  );
}
