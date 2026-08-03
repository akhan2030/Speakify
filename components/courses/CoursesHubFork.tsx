"use client";

import Link from "next/link";
import { useMarketingLocale } from "@/components/marketing/MarketingLocale";

export default function CoursesHubFork() {
  const { t } = useMarketingLocale();

  return (
    <section className="mb-12" aria-labelledby="hub-fork-heading">
      <p className="text-xs font-bold uppercase tracking-widest text-[#c9972c]">
        {t("hub.forkEyebrow")}
      </p>
      <h2 id="hub-fork-heading" className="sr-only">
        {t("hub.forkEyebrow")}
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-2xl" aria-hidden>
            📚
          </p>
          <h3 className="mt-3 text-lg font-bold text-[#0d1b35]">
            {t("hub.forkCoursesTitle")}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
            {t("hub.forkCoursesBody")}
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            {t("hub.forkCoursesMeta")}
          </p>
          <a
            href="#test-prep"
            className="mt-5 inline-flex w-fit rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#0d1b35] hover:bg-slate-50"
          >
            {t("hub.forkCoursesCta")}
          </a>
        </article>

        <article
          className="flex flex-col rounded-2xl border-2 p-6 shadow-md"
          style={{ borderColor: "#0d9488", backgroundColor: "rgba(13,148,136,0.06)" }}
        >
          <p className="text-2xl" aria-hidden>
            📝
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#0d9488]">
            {t("hub.forkMockEyebrow")}
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#0d1b35]">
            {t("hub.forkMockTitle")}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-700">
            {t("hub.forkMockBody")}
          </p>
          <p className="mt-3 text-sm font-semibold text-[#0d9488]">
            {t("hub.forkMockMeta")}
          </p>
          <Link
            href="/courses/mock-exams"
            className="mt-5 inline-flex w-fit rounded-xl px-5 py-2.5 text-sm font-bold text-white hover:opacity-95"
            style={{ backgroundColor: "#0d9488" }}
          >
            {t("hub.forkMockCta")}
          </Link>
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/courses/mock-exams#academic" className="text-[#0d1b35] underline hover:text-[#0d9488]">
              Academic mocks
            </Link>
            <Link href="/courses/mock-exams/general" className="text-[#0d1b35] underline hover:text-[#0d9488]">
              General mocks
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
