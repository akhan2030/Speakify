"use client";

import Link from "next/link";

type CertificateData = {
  certificateCode: string;
  title: string;
  cefrSubLevel?: string;
  studentName?: string;
  score?: number;
  issuedDate?: string;
  nextLevel?: string | null;
  nextLevelSlug?: string | null;
};

export default function CourseCertificate({ data }: { data: CertificateData }) {
  return (
    <div className="certificate-print overflow-hidden rounded-2xl border-4 border-[#c9972c] bg-white shadow-lg">
      <div className="bg-[#0d1b35] px-6 py-8 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#c9972c]">
          Speakify Global Language Center
        </p>
        <h2 className="mt-4 text-2xl font-bold">Certificate of Achievement</h2>
        <p className="mt-2 text-sm text-slate-300">{data.title}</p>
      </div>

      <div className="px-6 py-8 text-center">
        <p className="text-sm text-slate-500">This certifies that</p>
        <p className="mt-2 text-2xl font-bold text-[#0d1b35]">
          {data.studentName ?? "Student"}
        </p>
        <p className="mt-4 text-sm text-slate-600">
          has successfully completed level{" "}
          <strong className="text-[#c9972c]">{data.cefrSubLevel ?? "—"}</strong>
          {data.score != null ? ` with a score of ${data.score}%` : ""}.
        </p>

        <div className="mt-8 inline-block rounded-full bg-[#0d9488]/10 px-6 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
            Certificate ID
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-[#0d1b35]">
            {data.certificateCode}
          </p>
        </div>

        {data.issuedDate ? (
          <p className="mt-6 text-xs text-slate-500">Issued {data.issuedDate}</p>
        ) : null}

        {data.nextLevel && data.nextLevelSlug ? (
          <Link
            href={`/dashboard/student/course/${data.nextLevelSlug}`}
            className="mt-6 inline-block rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35] hover:opacity-95"
          >
            Continue to {data.nextLevel} →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
