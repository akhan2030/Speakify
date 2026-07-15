import Link from "next/link";
import ClassRoster from "@/components/classroom/teacher/ClassRoster";
import QuizResultsGrid from "@/components/classroom/teacher/QuizResultsGrid";

export default async function TeacherClassPage({
  params,
}: {
  params: { classId: string };
}) {
  const { classId } = params;
  const base = `/classroom-teacher/${encodeURIComponent(classId)}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/classroom-teacher" className="text-sm text-slate-500 hover:text-slate-800">
          ← All classes
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Class {classId}
        </h1>
        <p className="mt-1 text-slate-600">
          Roster and progress overview (placeholder data until DB is wired).
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        {[
          ["Attendance", `${base}/attendance`],
          ["Gradebook", `${base}/gradebook`],
          ["Homework", `${base}/homework`],
          [
            "Answer keys · unit 1",
            `${base}/answer-keys/${encodeURIComponent("unit-1")}`,
          ],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 hover:border-slate-400"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-2">
        <ClassRoster />
        <QuizResultsGrid unitLabel="B1.1 Unit 1 quiz" />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-lg font-semibold">Progress grid</h2>
          <p className="text-sm text-slate-500">
            Lessons completed per student (placeholder)
          </p>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2">Student</th>
                {["L1", "L2", "L3", "L4", "L5", "Quiz"].map((h) => (
                  <th key={h} className="px-2 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Sara", true, true, true, false, false, true],
                ["Omar", true, true, false, false, false, false],
                ["Layla", true, true, true, true, true, true],
              ].map((row) => (
                <tr key={String(row[0])} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-medium">{row[0]}</td>
                  {row.slice(1).map((done, i) => (
                    <td key={i} className="px-2 py-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          done ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
