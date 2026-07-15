"use client";

import { useState } from "react";

type Student = { id: string; name: string; email: string };

const DEMO: Student[] = [
  { id: "s1", name: "Sara Al-Harbi", email: "sara@example.com" },
  { id: "s2", name: "Omar Khan", email: "omar@example.com" },
  { id: "s3", name: "Layla Mansour", email: "layla@example.com" },
];

export default function ClassRoster({
  students = DEMO,
}: {
  students?: Student[];
}) {
  const [query, setQuery] = useState("");
  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Roster</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students…"
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm"
        />
      </div>
      <ul className="mt-4 divide-y divide-slate-100">
        {filtered.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-medium text-slate-900">{s.name}</p>
              <p className="text-slate-500">{s.email}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              Active
            </span>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="py-6 text-center text-slate-500">No students found</li>
        ) : null}
      </ul>
    </div>
  );
}
