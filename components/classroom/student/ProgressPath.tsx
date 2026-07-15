"use client";

export type ProgressPathProps = {
  currentLesson: number;
  completedLessons?: number[];
  total?: number;
};

export default function ProgressPath({
  currentLesson,
  completedLessons = [],
  total = 5,
}: ProgressPathProps) {
  const lessons = Array.from({ length: total }, (_, i) => i + 1);
  const completed = new Set(completedLessons);

  return (
    <nav
      aria-label="Lesson progress"
      className="rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-6"
    >
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
        Lesson path
      </p>
      <ol className="flex w-full items-start">
        {lessons.map((n, index) => {
          const isDone = completed.has(n);
          const isCurrent = n === currentLesson;
          const isPast = n < currentLesson || isDone;
          const connectorFilled =
            n < currentLesson || (isDone && n < total);

          return (
            <li
              key={n}
              className="relative flex flex-1 flex-col items-center"
            >
              {index < lessons.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`absolute left-[50%] top-5 h-0.5 w-full sm:top-[1.375rem] ${
                    connectorFilled ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              ) : null}
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold sm:h-11 sm:w-11 ${
                  isCurrent
                    ? "border-[#8a6a1f] bg-[#8a6a1f] text-white shadow-sm"
                    : isPast
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-[#f7f4ef] text-slate-400"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone && !isCurrent ? (
                  <span aria-hidden="true">✓</span>
                ) : (
                  n
                )}
              </div>
              <span
                className={`mt-1.5 text-[10px] font-medium uppercase tracking-wide sm:text-xs ${
                  isCurrent ? "text-[#8a6a1f]" : "text-slate-500"
                }`}
              >
                L{n}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
