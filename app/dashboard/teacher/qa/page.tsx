"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SeverityBadge, StatusBadge } from "@/components/QaBadges";
import {
  formatDate,
  formatIssueType,
  type QaIssue,
  type QaStats,
} from "@/lib/qaIssues";

const SUMMARY_CARDS = [
  {
    key: "critical",
    label: "Critical Issues",
    href: "/dashboard/teacher/qa/issues?card=critical",
    className: "bg-[#dc2626] text-white",
    statKey: "critical" as keyof QaStats,
  },
  {
    key: "high",
    label: "High Priority",
    href: "/dashboard/teacher/qa/issues?card=high",
    className: "bg-[#ea580c] text-white",
    statKey: "high" as keyof QaStats,
  },
  {
    key: "medium",
    label: "Medium Issues",
    href: "/dashboard/teacher/qa/issues?card=medium",
    className: "bg-yellow-400 text-[#0d1b35]",
    statKey: "medium" as keyof QaStats,
  },
  {
    key: "low",
    label: "Low Issues",
    href: "/dashboard/teacher/qa/issues?card=low",
    className: "bg-slate-400 text-white",
    statKey: "low" as keyof QaStats,
  },
  {
    key: "pending",
    label: "Pending Review",
    href: "/dashboard/teacher/qa/issues?card=pending",
    className: "bg-blue-600 text-white",
    statKey: "pendingReview" as keyof QaStats,
  },
  {
    key: "fixed_week",
    label: "Fixed This Week",
    href: "/dashboard/teacher/qa/issues?card=fixed_week",
    className: "bg-green-600 text-white",
    statKey: "fixedThisWeek" as keyof QaStats,
  },
];

export default function QaDashboardPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<QaIssue[]>([]);
  const [stats, setStats] = useState<QaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/qa", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load QA data");
      setIssues(data.issues ?? []);
      setStats(data.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setIssues([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recent = issues.slice(0, 10);

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b35]">Trust & QA Center</h1>
          <p className="mt-1 text-gray-500">
            Track, review and resolve issues across the Speakify LMS
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/teacher/qa/issues/new")}
          className="rounded-lg bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#b8862a]"
        >
          Create New Issue
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {error.includes("qa_issues") || error.includes("relation") ? (
            <span className="mt-1 block">
              Run <code className="text-xs">supabase/qa_issues_setup.sql</code> in Supabase
              SQL Editor first.
            </span>
          ) : null}
        </p>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {SUMMARY_CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className={`rounded-xl p-4 shadow-sm transition hover:scale-[1.02] hover:shadow-md ${card.className}`}
          >
            <p className="text-3xl font-bold">{loading ? "—" : (stats?.[card.statKey] ?? 0)}</p>
            <p className="mt-1 text-sm font-medium opacity-90">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold text-[#0d1b35]">Recent Issues</h2>
          <Link
            href="/dashboard/teacher/qa/issues"
            className="text-sm font-semibold text-[#0d9488] hover:underline"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-slate-500">Loading...</p>
        ) : recent.length === 0 ? (
          <p className="px-6 py-8 text-slate-400">No issues logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Severity</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recent.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/teacher/qa/issues/${issue.id}`}
                        className="font-medium text-[#0d1b35] hover:text-[#c9972c]"
                      >
                        {issue.title}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {formatIssueType(issue.issue_type)}
                    </td>
                    <td className="px-6 py-3">
                      <SeverityBadge severity={issue.severity} />
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {formatDate(issue.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
