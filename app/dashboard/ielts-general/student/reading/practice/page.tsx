import Link from "next/link";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";
import { GT_READING_SECTIONS } from "@/lib/ielts-general/readingContent";

const BASE = `${GENERAL_STUDENT_BASE}/reading/practice`;

const SECTIONS = [
  { slug: "section-a", key: "sectionA" as const, color: "#c9972c" },
  { slug: "section-b", key: "sectionB" as const, color: "#0d9488" },
  { slug: "section-c", key: "sectionC" as const, color: "#7c3aed" },
];

export default function GtReadingPracticeIndexPage() {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <Link
        href={`${GENERAL_STUDENT_BASE}/reading`}
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← Back to Reading
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">GT Reading practice</h1>
      <p className="mt-2 text-sm text-slate-600">
        Choose a section — everyday texts, workplace documents, or extended general
        interest.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {SECTIONS.map(({ slug, key, color }) => {
          const meta = GT_READING_SECTIONS[key];
          return (
            <Link
              key={slug}
              href={`${BASE}/${slug}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              style={{ borderTopWidth: 4, borderTopColor: color }}
            >
              <p className="text-xs font-bold uppercase" style={{ color }}>
                {meta.label}
              </p>
              <p className="mt-2 text-sm text-slate-600">{meta.description}</p>
              <p className="mt-3 text-xs font-semibold text-[#0d9488]">Start practice →</p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
