"use client";

import { useState } from "react";
import Link from "next/link";

type ClassRow = {
  id: string;
  name: string;
  level: string;
  schedule: string;
};

export default function AdminClassroomClassesPage() {
  const [rows, setRows] = useState<ClassRow[]>([
    {
      id: "demo-b1-1-morning",
      name: "B1.1 Morning · Riyadh",
      level: "B1.1",
      schedule: "Sun–Thu 09:00",
    },
  ]);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("B1.1");
  const [schedule, setSchedule] = useState("");

  function addClass() {
    if (!name.trim()) return;
    setRows((prev) => [
      {
        id: `class-${Date.now()}`,
        name: name.trim(),
        level,
        schedule,
      },
      ...prev,
    ]);
    setName("");
    setSchedule("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
        <p className="mt-1 text-slate-600">
          Create class groups teachers open in{" "}
          <Link href="/classroom-teacher" className="underline">
            /classroom-teacher
          </Link>
          .
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">New class</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Class name"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Level code"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="Schedule"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={addClass}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Add (local)
        </button>
      </div>

      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="font-semibold">{row.name}</p>
              <p className="text-sm text-slate-500">
                {row.level} · {row.schedule || "no schedule"}
              </p>
            </div>
            <Link
              href={`/classroom-teacher/${encodeURIComponent(row.id)}`}
              className="text-sm font-medium text-slate-700 underline"
            >
              Open teacher view
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
