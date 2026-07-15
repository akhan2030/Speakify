import Link from "next/link";
import { CLASSROOM_LEVELS } from "@/lib/classroom/levels";

export default function AdminClassroomLevelsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Levels</h1>
      <p className="text-slate-600">
        All 13 Speakify classroom micro-CEFR levels.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CLASSROOM_LEVELS.map((level) => (
          <li key={level.code}>
            <Link
              href={`/admin/classroom/levels/${encodeURIComponent(level.slug)}/units`}
              className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6a1f]">
                {level.code}
              </p>
              <p className="mt-1 font-semibold">{level.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {level.targetWeeks} weeks · order {level.orderIndex}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
