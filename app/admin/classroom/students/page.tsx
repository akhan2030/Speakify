"use client";

import { useMemo, useState } from "react";

const DEMO = [
  { id: "1", name: "Sara Al-Harbi", level: "B1.1", className: "Morning" },
  { id: "2", name: "Omar Khan", level: "B1.1", className: "Morning" },
  { id: "3", name: "Layla Mansour", level: "B1.1", className: "Evening" },
  { id: "4", name: "Fahad Nasser", level: "A2.2", className: "—" },
];

export default function AdminClassroomStudentsPage() {
  const [q, setQ] = useState("");
  const rows = useMemo(
    () =>
      DEMO.filter(
        (s) =>
          s.name.toLowerCase().includes(q.toLowerCase()) ||
          s.level.toLowerCase().includes(q.toLowerCase())
      ),
    [q]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
      <p className="text-slate-600">
        In-person students (placeholder list). Filter by name or level.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search…"
        className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">Class</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.level}</td>
                <td className="px-4 py-3 text-slate-500">{s.className}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
