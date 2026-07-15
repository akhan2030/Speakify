import Link from "next/link";

const PLACEHOLDER_CLASSES = [
  { id: "demo-b1-1-morning", name: "B1.1 Morning · Riyadh", schedule: "Sun–Thu 09:00" },
  { id: "demo-b1-1-evening", name: "B1.1 Evening · Online", schedule: "Sun–Thu 18:00" },
];

export default function ClassroomTeacherHomePage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">
          Teacher classroom
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Class groups are created in Admin → Classroom. Below are local
          placeholders so you can explore roster, attendance, gradebook, and
          answer keys.
        </p>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Create classes in{" "}
        <Link href="/admin/classroom/classes" className="font-semibold underline">
          Admin → Classroom → Classes
        </Link>
        .
      </section>

      <ul className="grid gap-3 sm:grid-cols-2">
        {PLACEHOLDER_CLASSES.map((c) => (
          <li key={c.id}>
            <Link
              href={`/classroom-teacher/${encodeURIComponent(c.id)}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
            >
              <p className="font-semibold text-slate-900">{c.name}</p>
              <p className="mt-1 text-sm text-slate-500">{c.schedule}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
