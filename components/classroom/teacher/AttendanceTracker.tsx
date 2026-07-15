"use client";

import { useState } from "react";

type Student = { id: string; name: string };
type Status = "present" | "absent" | "late";

const DEMO: Student[] = [
  { id: "s1", name: "Sara Al-Harbi" },
  { id: "s2", name: "Omar Khan" },
  { id: "s3", name: "Layla Mansour" },
];

export default function AttendanceTracker({
  students = DEMO,
}: {
  students?: Student[];
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, Status>>(() =>
    Object.fromEntries(students.map((s) => [s.id, "present" as Status]))
  );
  const [saved, setSaved] = useState(false);

  function setStatus(id: string, status: Status) {
    setMarks((prev) => ({ ...prev, [id]: status }));
    setSaved(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Attendance</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSaved(false);
          }}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm"
        />
      </div>
      <ul className="mt-4 space-y-3">
        {students.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3"
          >
            <span className="text-sm font-medium">{s.name}</span>
            <div className="flex gap-1">
              {(["present", "late", "absent"] as Status[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatus(s.id, status)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${
                    marks[s.id] === status
                      ? status === "present"
                        ? "bg-emerald-700 text-white"
                        : status === "late"
                          ? "bg-amber-600 text-white"
                          : "bg-rose-700 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setSaved(true)}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        {saved ? "Saved locally" : "Save attendance"}
      </button>
    </div>
  );
}
