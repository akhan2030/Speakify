import Link from "next/link";

export default function ClassroomPlacementPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
        Placement
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        In-person placement test — coming next
      </h1>
      <p className="text-lg leading-relaxed text-slate-600">
        Your teacher assigns a micro-CEFR level (for example B1.1) after an
        in-person placement. Until then, use the pilot B1.1 unit list if your
        class has started.
      </p>
      <Link
        href={`/classroom/${encodeURIComponent("b1-1")}`}
        className="inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Open B1.1 placeholder
      </Link>
    </div>
  );
}
