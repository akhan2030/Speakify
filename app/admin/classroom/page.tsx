import Link from "next/link";
import { CLASSROOM_LEVELS } from "@/lib/classroom/levels";

export default function AdminClassroomDashboardPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">
          Classroom admin
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Manage textbook levels, units, media, class groups, and print exports
          for in-person Speakify classes.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            href: "/admin/classroom/levels",
            title: "Levels",
            body: `${CLASSROOM_LEVELS.length} micro-CEFR levels`,
          },
          {
            href: `/admin/classroom/levels/${encodeURIComponent("b1-1")}/units`,
            title: "B1.1 units",
            body: "Pilot content workflow",
          },
          {
            href: "/admin/classroom/classes",
            title: "Classes",
            body: "Create groups for teachers",
          },
          {
            href: "/admin/classroom/students",
            title: "Students",
            body: "In-person roster",
          },
          {
            href: "/admin/classroom/media",
            title: "Media",
            body: "Audio & images",
          },
          {
            href: "/admin/classroom/pdf-export",
            title: "PDF export",
            body: "Student & teacher print",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
          >
            <p className="font-semibold text-slate-900">{card.title}</p>
            <p className="mt-1 text-sm text-slate-500">{card.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
