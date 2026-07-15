"use client";

type ResultRow = {
  studentId: string;
  name: string;
  score: number;
  maxScore: number;
  submittedAt?: string;
};

const DEMO: ResultRow[] = [
  { studentId: "s1", name: "Sara Al-Harbi", score: 12, maxScore: 15, submittedAt: "2026-07-10" },
  { studentId: "s2", name: "Omar Khan", score: 9, maxScore: 15, submittedAt: "2026-07-11" },
  { studentId: "s3", name: "Layla Mansour", score: 14, maxScore: 15, submittedAt: "2026-07-12" },
];

export default function QuizResultsGrid({
  unitLabel = "Unit quiz",
  rows = DEMO,
}: {
  unitLabel?: string;
  rows?: ResultRow[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-lg font-semibold">Quiz results</h2>
        <p className="text-sm text-slate-500">{unitLabel}</p>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-2 font-semibold">Student</th>
            <th className="px-5 py-2 font-semibold">Score</th>
            <th className="px-5 py-2 font-semibold">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pct = row.maxScore
              ? Math.round((row.score / row.maxScore) * 100)
              : 0;
            return (
              <tr key={row.studentId} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium">{row.name}</td>
                <td className="px-5 py-3">
                  {row.score}/{row.maxScore}{" "}
                  <span className="text-slate-500">({pct}%)</span>
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {row.submittedAt ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
