"use client";

import Link from "next/link";
import { useMemo } from "react";
import MockCompletionCertificate, {
  printMockCertificate,
} from "@/components/mock-test/MockCompletionCertificate";
import { buildMockCertificateData } from "@/lib/mock-test/certificate";

const ACADEMIC_SAMPLE = buildMockCertificateData({
  programme: "ielts_academic",
  studentName: "Ahmed Al-Rashidi",
  completedAt: "2026-07-08T14:30:00.000Z",
  examReference: "SPK-MOCK-2026-48291",
  examDateTime: "Tuesday, 8 July 2026, 14:30",
  mockNumber: 1,
  skills: {
    listening: 7.0,
    reading: 6.5,
    writing: 6.0,
    speaking: 6.5,
  },
});

const GENERAL_SAMPLE = buildMockCertificateData({
  programme: "ielts_general",
  studentName: "Fatima Al-Qahtani",
  completedAt: "2026-07-08T16:15:00.000Z",
  examReference: "SPK-MOCK-2026-51734",
  examDateTime: "Tuesday, 8 July 2026, 16:15",
  mockNumber: 2,
  skills: {
    listening: 6.5,
    reading: 7.0,
    writing: 6.5,
    speaking: 7.0,
  },
});

export default function MockCertificateSamplePage() {
  const samples = useMemo(
    () => [
      { key: "academic", label: "IELTS Academic", data: ACADEMIC_SAMPLE },
      { key: "general", label: "IELTS General Training", data: GENERAL_SAMPLE },
    ],
    []
  );

  return (
    <main className="min-h-screen bg-slate-100 py-10 print:bg-white">
      <div className="mx-auto max-w-5xl px-4 print:max-w-none print:px-0">
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c9972c]">
            Speakify · Sample
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#0d1b35]">
            IELTS Mock Test Report Form (TRF)
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            This is a model certificate issued when a student completes a full Speakify mock exam.
            Real certificates appear at the top of the results page with the student&apos;s actual
            scores. Use <strong>Download Certificate (PDF)</strong> on each sample below, or your
            browser&apos;s Print → Save as PDF.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href="/dashboard/ielts/student/mock-exam"
              className="rounded-lg bg-[#0d1b35] px-4 py-2 font-semibold text-white hover:opacity-90"
            >
              Academic mock exams →
            </Link>
            <Link
              href="/dashboard/ielts-general/student/mock-exam"
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-[#0d1b35] hover:bg-slate-50"
            >
              GT mock exams →
            </Link>
          </div>
        </div>

        {samples.map((sample, index) => (
          <section
            key={sample.key}
            className={`mb-16 print:mb-0 ${index > 0 ? "print:break-before-page" : ""}`}
          >
            <h2 className="mb-4 text-lg font-bold text-[#0d1b35] print:hidden">
              {sample.label} — sample
            </h2>
            <div id={`mock-cert-${sample.key}`}>
              <MockCompletionCertificate
                data={sample.data}
                domId={`mock-cert-${sample.key}`}
                onPrint={() => printMockCertificate(`mock-cert-${sample.key}`)}
              />
            </div>
          </section>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          #mock-completion-certificate,
          #mock-completion-certificate * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}
