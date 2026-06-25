"use client";

type DayCell = {
  date: string;
  label: string;
  studied: boolean;
  tasksCompleted: number;
  summary: string;
};

export default function StudyHistoryCalendar({ days }: { days: DayCell[] }) {
  if (!days.length) {
    return <p className="text-sm text-slate-500">No study history yet.</p>;
  }

  const weeks: DayCell[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1">
          {week.map((day) => (
            <div
              key={day.date}
              title={day.summary || day.label}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-[10px] ${
                day.studied
                  ? day.tasksCompleted >= 3
                    ? "bg-[#C8923E] text-white"
                    : "bg-[#C8923E]/40 text-[#0d1b35]"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <span className="font-bold">{day.date.slice(-2)}</span>
              {day.studied ? (
                <span className="text-[8px] opacity-80">{day.tasksCompleted}✓</span>
              ) : null}
            </div>
          ))}
        </div>
      ))}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-slate-100" /> No study
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-[#C8923E]/40" /> 1–2 tasks
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-[#C8923E]" /> 3+ tasks
        </span>
      </div>
    </div>
  );
}
