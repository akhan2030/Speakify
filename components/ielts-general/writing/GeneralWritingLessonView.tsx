"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  GT_WRITING_LESSON_COUNT,
  markLessonComplete,
  type WritingLesson,
} from "@/lib/ielts-general/writingLessons";

const WRITING_LESSONS_HREF = "/dashboard/ielts-general/student/writing?tab=lessons";

export default function GeneralWritingLessonView({ lesson }: { lesson: WritingLesson }) {
  const router = useRouter();
  const [practiceText, setPracticeText] = useState("");
  const [completed, setCompleted] = useState(false);

  function handleMarkComplete() {
    markLessonComplete(lesson.slug);
    setCompleted(true);
    router.push(WRITING_LESSONS_HREF);
  }

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href={WRITING_LESSONS_HREF}
          className="text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← Back to Writing Lessons
        </Link>

        <div className="mt-4 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
          Lesson {lesson.number} of {GT_WRITING_LESSON_COUNT}
        </div>

        <header className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#c9972c]">{lesson.minutes} min</p>
          <h1 className="mt-1 text-2xl font-bold text-[#0d1b35]">{lesson.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{lesson.desc}</p>
        </header>

        <div className="mt-6 space-y-5">
          {lesson.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-bold text-[#0d1b35]">{section.title}</h2>
              {section.paragraphs?.map((p) => (
                <p key={p} className="mt-3 text-sm leading-relaxed text-slate-700">
                  {p}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9972c]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.table ? (
                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[280px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Meaning</th>
                        <th className="px-3 py-2">Formal</th>
                        <th className="px-3 py-2">Informal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.map((row) => (
                        <tr key={row.label} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-[#0d1b35]">
                            {row.label}
                          </td>
                          <td className="px-3 py-2 text-slate-700">{row.formal}</td>
                          <td className="px-3 py-2 text-slate-700">{row.informal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-xl border border-[#c9972c]/40 bg-[#c9972c]/5 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#0d1b35]">{lesson.practice.title}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {lesson.practice.prompt}
          </p>
          <label className="mt-4 block">
            <span className="sr-only">Your answer</span>
            <textarea
              value={practiceText}
              onChange={(e) => setPracticeText(e.target.value)}
              rows={8}
              placeholder={lesson.practice.placeholder}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0d1b35] placeholder:text-slate-400 focus:border-[#0d9488] focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
            />
          </label>
          <button
            type="button"
            onClick={handleMarkComplete}
            className="mt-4 w-full rounded-xl bg-[#0d1b35] px-5 py-3 text-sm font-bold text-white hover:bg-[#152a4d] sm:w-auto"
          >
            Mark as complete
          </button>
          {completed ? (
            <p className="mt-2 text-sm font-semibold text-[#0d9488]">
              Lesson marked complete — returning to lessons…
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
