"use client";

import { useSession } from "next-auth/react";

const STAT_CARDS = [
  { label: "Total users", value: "—", hint: "All accounts", tone: "bg-[#0d1b35] text-white" },
  { label: "Active students", value: "—", hint: "Last 30 days", tone: "bg-white border border-slate-200" },
  { label: "Teachers", value: "—", hint: "Staff accounts", tone: "bg-white border border-slate-200" },
  { label: "Programmes", value: "6", hint: "Live on platform", tone: "bg-white border border-slate-200" },
];

const QUICK_ACTIONS = [
  { title: "Manage users", description: "View and edit student accounts", icon: "👥" },
  { title: "Course catalog", description: "IELTS, Pathway, Business, Legal, Kids", icon: "📚" },
  { title: "Teacher access", description: "Assign roles and permissions", icon: "🎓" },
  { title: "Platform reports", description: "Usage, progress, and exports", icon: "📊" },
];

const PROGRAMMES = [
  { name: "IELTS Accelerator", status: "Active", students: "—" },
  { name: "English Pathway", status: "Active", students: "—" },
  { name: "Business English", status: "Active", students: "—" },
  { name: "Legal English", status: "Active", students: "—" },
  { name: "Kids English", status: "Active", students: "—" },
  { name: "TOEFL / STEP", status: "Active", students: "—" },
];

export default function AdminDashboardHome() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Admin";

  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-[#0d1b35] px-6 py-8 text-white sm:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9972c]">
          Admin overview
        </p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
          Manage Speakify programmes, users, and platform settings from one place.
          Links and actions will be added here as features are built.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl p-5 shadow-sm ${card.tone}`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                card.tone.includes("0d1b35") ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-extrabold">{card.value}</p>
            <p
              className={`mt-1 text-xs ${
                card.tone.includes("0d1b35") ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {card.hint}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="text-lg font-bold text-[#0d1b35]">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Shortcuts for common admin tasks — coming soon
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <div
                key={action.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="text-2xl">{action.icon}</span>
                <h3 className="mt-3 font-bold text-[#0d1b35]">{action.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{action.description}</p>
                <span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0d1b35]">System status</h2>
          <ul className="mt-4 space-y-4">
            {[
              { label: "Authentication", status: "Operational" },
              { label: "Database", status: "Operational" },
              { label: "Course content", status: "Operational" },
              { label: "AI services", status: "Configured" },
            ].map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-[#0d1b35]">Programmes</h2>
          <p className="mt-1 text-sm text-slate-500">
            All Speakify learning programmes on the platform
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Programme</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {PROGRAMMES.map((row) => (
                <tr key={row.name} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-4 font-semibold text-[#0d1b35]">{row.name}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-[#c9972c]/15 px-2.5 py-0.5 text-xs font-semibold text-[#0d1b35]">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{row.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
        <p className="text-sm font-semibold text-[#0d1b35]">More admin tools on the way</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
          User management, enrolments, content publishing, and analytics will be linked from
          the sidebar as each module is ready.
        </p>
      </section>
    </div>
  );
}
