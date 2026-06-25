"use client";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

type StreakData = {
  current: number;
  longest: number;
  motivation: string;
  calendar: Array<{ label: string; status: string }>;
  totalHours: number;
  tasksDone: number;
  mocksTaken: number;
};

function dayCircleClass(status: string) {
  if (status === "studied" || status === "completed") return "bg-green-500";
  if (status === "today") return "bg-blue-500 ring-2 ring-blue-300";
  if (status === "future" || status === "upcoming") return "bg-slate-200";
  return "bg-slate-300";
}

export default function StreakCard({ streak }: { streak: StreakData }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <p className="text-2xl font-medium text-[#0d1b35]">{streak.current} days</p>
          <p className="text-xs text-slate-500">current streak</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-7 gap-1">
        {streak.calendar.map((day, i) => (
          <div key={`${day.label}-${i}`} className="text-center">
            <p className="mb-1 text-[10px] text-slate-500">
              {DAY_LETTERS[i] ?? day.label.charAt(0)}
            </p>
            <div
              className={`mx-auto h-6 w-6 rounded-full ${dayCircleClass(day.status)}`}
              title={day.status}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-base font-medium text-[#0d1b35]">{streak.totalHours}h</p>
          <p className="text-[11px] text-slate-500">total hours</p>
        </div>
        <div>
          <p className="text-base font-medium text-[#0d1b35]">{streak.tasksDone}</p>
          <p className="text-[11px] text-slate-500">tasks done</p>
        </div>
        <div>
          <p className="text-base font-medium text-[#0d1b35]">{streak.mocksTaken}</p>
          <p className="text-[11px] text-slate-500">mocks taken</p>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-[#0d9488]">{streak.motivation}</p>
      <p className="mt-1 text-center text-[10px] text-slate-400">
        Best streak: {streak.longest} days
      </p>
    </div>
  );
}
