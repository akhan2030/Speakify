"use client";

import Link from "next/link";
import {
  gradeFromScore,
  type GraduationSkill,
} from "@/lib/pathway/graduationTestConfig";

export type PathwayCertificateData = {
  certificateCode: string;
  studentName: string;
  levelName: string;
  overallScore: number;
  issuedDate: string;
  sectionGrades?: Record<
    string,
    { score: number; grade: string }
  >;
  nextLevel?: string | null;
  nextLevelName?: string | null;
  nextLevelSlug?: string | null;
};

const SKILL_LABELS: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

export default function PathwayCertificate({
  data,
  showActions = true,
}: {
  data: PathwayCertificateData;
  showActions?: boolean;
}) {
  const skills = Object.keys(SKILL_LABELS) as GraduationSkill[];

  return (
    <div
      id="pathway-certificate"
      className="certificate-print overflow-hidden rounded-2xl border-4 border-[#c9972c] bg-white shadow-xl"
    >
      <div className="bg-[#0d1b35] px-8 py-10 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-[#c9972c]" />
        <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-[#c9972c]">
          Speakify · Global Language Center
        </p>
        <h2 className="mt-4 text-2xl font-bold text-white">
          Level Completion Certificate
        </h2>
      </div>

      <div className="mx-auto h-1 w-32 bg-[#c9972c]" />

      <div className="px-8 py-10 text-center">
        <p className="text-lg italic text-[#c9972c]">Congratulations,</p>
        <p className="mt-3 text-3xl font-bold text-[#0d1b35]">{data.studentName}</p>
        <p className="mt-4 text-base text-slate-600">has successfully completed</p>
        <p className="mt-2 text-xl font-bold text-[#c9972c]">
          Speakify English Pathway — {data.levelName}
        </p>
        <p className="mt-4 text-sm text-slate-500">Issued {data.issuedDate}</p>

        <div className="mt-8 overflow-hidden rounded-xl border border-[#c9972c]/40">
          <table className="w-full text-sm">
            <thead className="bg-[#c9972c] text-left text-[#0d1b35]">
              <tr>
                <th className="px-4 py-2 font-bold">SKILL</th>
                <th className="px-4 py-2 font-bold">SCORE</th>
                <th className="px-4 py-2 font-bold">GRADE</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => {
                const row = data.sectionGrades?.[skill];
                const score = row?.score ?? 0;
                const grade = row?.grade ?? gradeFromScore(score);
                return (
                  <tr key={skill} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-[#0d1b35]">
                      {SKILL_LABELS[skill]}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{Math.round(score)}%</td>
                    <td className="px-4 py-2 font-semibold text-[#0d9488]">{grade}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-4xl font-bold text-[#c9972c]">
          {Math.round(data.overallScore)}%
        </p>
        <p className="text-xs uppercase tracking-wide text-slate-500">Overall score</p>

        {data.nextLevelName ? (
          <div className="mt-8 rounded-xl bg-[#0d9488]/10 px-5 py-4 text-[#0d9488]">
            <p className="text-sm font-semibold">
              Next Level Unlocked: {data.nextLevelName}
            </p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#0d1b35]/10 bg-[#0d1b35] px-8 py-6 text-center text-xs text-slate-300">
        <p className="font-semibold text-[#c9972c]">Speakify GLC Seal</p>
        <p className="mt-2 font-mono text-white">{data.certificateCode}</p>
        <p className="mt-2 text-slate-400">
          Empowering learners on the path to IELTS success
        </p>
      </div>

      {showActions && data.nextLevelSlug ? (
        <div className="flex flex-wrap justify-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-[#0d1b35] px-5 py-2.5 text-sm font-bold text-[#0d1b35]"
          >
            Download Certificate as PDF
          </button>
          <Link
            href={`/dashboard/student/pathway/${data.nextLevelSlug}`}
            className="rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35]"
          >
            Start Next Level: {data.nextLevelName} →
          </Link>
        </div>
      ) : showActions ? (
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-[#0d1b35] px-5 py-2.5 text-sm font-bold text-[#0d1b35]"
          >
            Download Certificate as PDF
          </button>
        </div>
      ) : null}
    </div>
  );
}
