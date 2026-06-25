"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";

type Assignment = {
  id: string;
  module: string;
  taskDescription: string;
  dueDate: string;
  dueDateLabel: string;
  status: string;
  submission: string | null;
  teacherFeedback: string | null;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    submitted: "bg-[#0d9488]/15 text-[#0d9488]",
    graded: "bg-[#c9972c]/20 text-[#c9972c]",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        styles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function HomeworkCard({
  assignment,
  onSubmitted,
}: {
  assignment: Assignment;
  onSubmitted: () => void;
}) {
  const [essay, setEssay] = useState(assignment.submission ?? "");
  const [submitting, setSubmitting] = useState(false);
  const isWriting = assignment.module.toLowerCase() === "writing";
  const canSubmit = assignment.status === "pending";

  const submit = async (payload: { submission?: string }) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/homework/${assignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submit failed");
      onSubmitted();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-[#0d1b35]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0d1b35]">
            {assignment.module}
          </span>
          <p className="mt-3 text-base font-medium text-[#0d1b35]">
            {assignment.taskDescription}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Due {assignment.dueDateLabel}
          </p>
        </div>
        <StatusBadge status={assignment.status} />
      </div>

      {assignment.status === "submitted" || assignment.status === "graded" ? (
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {isWriting && assignment.submission ? (
            <p className="whitespace-pre-wrap">{assignment.submission}</p>
          ) : (
            <p className="text-[#0d9488] font-medium">Submitted ✓</p>
          )}
        </div>
      ) : null}

      {assignment.teacherFeedback ? (
        <div className="mt-4 rounded-lg border border-[#c9972c]/30 bg-[#c9972c]/10 px-4 py-3 text-sm">
          <p className="font-semibold text-[#c9972c]">Teacher feedback</p>
          <p className="mt-1 text-slate-700">{assignment.teacherFeedback}</p>
        </div>
      ) : null}

      {canSubmit ? (
        <div className="mt-6 border-t border-slate-100 pt-6">
          {isWriting ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Your essay
                <textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  rows={10}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-[#0d1b35] focus:border-[#0d9488] focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
                  placeholder="Write your Task 1 or Task 2 response here…"
                />
              </label>
              <button
                type="button"
                onClick={() => submit({ submission: essay })}
                disabled={submitting || !essay.trim()}
                className="mt-4 rounded-xl bg-[#0d9488] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0b7c72] disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit essay"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => submit({})}
              disabled={submitting}
              className="rounded-xl bg-[#0d1b35] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#152a4d] disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Mark as Complete"}
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
}

export default function StudentHomeworkPage() {
  const router = useRouter();
  const { status } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const loadHomework = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/homework");
      const json = await res.json();
      setAssignments(json.assignments ?? []);
      setTableMissing(Boolean(json.tableMissing));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadHomework();
  }, [status, loadHomework]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  const pending = assignments.filter((a) => a.status === "pending");
  const done = assignments.filter((a) => a.status !== "pending");

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="dashboard" />
      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <header>
            <h1 className="text-2xl font-bold text-[#0d1b35] sm:text-3xl">Homework</h1>
            <p className="mt-2 text-sm text-slate-500">
              Tasks assigned by your teacher — complete before the due date
            </p>
          </header>

          {tableMissing ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Homework is not set up yet. Ask your teacher to run the database
              migration.
            </p>
          ) : null}

          {loading ? (
            <p className="mt-10 text-slate-500">Loading homework…</p>
          ) : assignments.length === 0 ? (
            <div className="mt-10 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-[#0d1b35]">No homework yet</p>
              <p className="mt-2 text-sm text-slate-500">
                When your teacher assigns tasks, they will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {pending.length > 0 ? (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    To do ({pending.length})
                  </h2>
                  <div className="mt-4 space-y-4">
                    {pending.map((a) => (
                      <HomeworkCard
                        key={a.id}
                        assignment={a}
                        onSubmitted={loadHomework}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
              {done.length > 0 ? (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Completed ({done.length})
                  </h2>
                  <div className="mt-4 space-y-4">
                    {done.map((a) => (
                      <HomeworkCard
                        key={a.id}
                        assignment={a}
                        onSubmitted={loadHomework}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
