"use client";

import { useState } from "react";

export default function HomeworkAssigner() {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<
    Array<{ id: string; title: string; due: string; notes: string }>
  >([]);

  function assign() {
    if (!title.trim()) return;
    setItems((prev) => [
      {
        id: `hw-${Date.now()}`,
        title: title.trim(),
        due,
        notes,
      },
      ...prev,
    ]);
    setTitle("");
    setDue("");
    setNotes("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Assign homework</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              placeholder="Write a 120-word personal profile"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Due date</span>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Notes for students</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={assign}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Assign (local preview)
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold">Assigned</h3>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No homework yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm"
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-slate-500">
                  Due: {item.due || "not set"}
                </p>
                {item.notes ? (
                  <p className="mt-1 text-slate-600">{item.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
