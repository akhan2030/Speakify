import Link from "next/link";

export default function TeacherReportsPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="max-w-md rounded-2xl border border-[#c9972c]/30 bg-white px-8 py-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0d1b35]">
          <span className="text-xl font-bold text-[#c9972c]">GLC</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-[#0d1b35] sm:text-3xl">
          Progress Reports
        </h1>
        <p className="mt-4 text-lg font-semibold text-[#c9972c]">
          Progress Reports coming soon
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Class-wide band trends, module breakdowns, and exportable reports will
          appear here.
        </p>
        <Link
          href="/dashboard/teacher"
          className="mt-8 inline-block rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#152a4d]"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
