"use client";

import { forwardRef } from "react";
import {
  formatCertificateBand,
  type MockCertificateData,
} from "@/lib/mock-test/certificate";
import { ACCELERATOR_TRACKS, acceleratorTrackIdForBand } from "@/lib/accelerator/tracks";
import { PLACEMENT_ESTIMATE_DISCLAIMER } from "@/lib/claims/studentLevelCopy";

type Props = {
  data: MockCertificateData;
  showActions?: boolean;
  onPrint?: () => void;
  domId?: string;
};

const MockCompletionCertificate = forwardRef<HTMLDivElement, Props>(
  function MockCompletionCertificate(
    { data, showActions = true, onPrint, domId = "mock-completion-certificate" },
    ref
  ) {
    return (
      <div className="mock-certificate-wrap mx-auto max-w-4xl">
        {showActions ? (
          <div className="mb-4 print:hidden">
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs leading-relaxed text-amber-950">
              If you saved a PDF of this report earlier, it may have said letter codes were
              aligned to the Council of Europe CEFR framework. That claim was incorrect. This
              page now shows mock band scores and the Speakify Foundation / Plus / Elite
              grouping only. Please use a new download if you still have the old file.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onPrint}
                className="rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35] hover:opacity-90"
              >
                Download Certificate (PDF)
              </button>
            </div>
          </div>
        ) : null}

        <div
          ref={ref}
          id={domId}
          className="mock-certificate-print overflow-hidden rounded-sm border border-slate-300 bg-white shadow-lg"
        >
          {/* TRF-style top band */}
          <div className="border-b-4 border-[#c9972c] bg-[#0d1b35] px-6 py-5 text-white sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-[#c9972c]">
                  Speakify
                </p>
                <p className="text-xs font-semibold text-slate-300">
                  Global Language Center
                </p>
                <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                  Test Report Form
                </h1>
                <p className="mt-1 text-sm text-slate-300">{data.programmeSubtitle}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
                  Exam reference
                </p>
                <p className="font-mono text-sm font-bold text-[#c9972c]">
                  {data.examReference}
                </p>
                {data.mockNumber != null ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Mock #{String(data.mockNumber).padStart(2, "0")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Candidate details — official TRF grid */}
          <div className="grid gap-0 border-b border-slate-200 sm:grid-cols-2">
            <div className="border-b border-slate-200 px-6 py-4 sm:border-b-0 sm:border-r">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                Centre
              </p>
              <p className="mt-1 text-sm font-semibold text-[#0d1b35]">{data.centreName}</p>
              <p className="text-xs text-slate-600">{data.centreCountry}</p>
            </div>
            <div className="px-6 py-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                Test date
              </p>
              <p className="mt-1 text-sm font-semibold text-[#0d1b35]">{data.testDate}</p>
              <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                Date of issue
              </p>
              <p className="mt-1 text-sm text-slate-700">{data.issuedDate}</p>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
              Name of candidate
            </p>
            <p className="mt-1 text-2xl font-bold uppercase tracking-wide text-[#0d1b35] sm:text-3xl">
              {data.studentName}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#c9972c]">{data.programmeTitle}</p>
            <p className="mt-1 text-xs text-slate-600">{data.testFormat}</p>
          </div>

          {/* Module scores — IELTS TRF table layout */}
          <div className="px-6 py-6 sm:px-8">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Results
            </p>

            <div className="mt-4 overflow-hidden rounded border-2 border-[#0d1b35]">
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr className="bg-[#0d1b35] text-white">
                    {data.skillRows.map((row) => (
                      <th
                        key={row.key}
                        className="border-r border-white/20 px-2 py-3 text-[0.65rem] font-bold uppercase tracking-wide last:border-r-0 sm:px-4 sm:text-xs"
                      >
                        {row.label}
                      </th>
                    ))}
                    <th className="bg-[#c9972c] px-2 py-3 text-[0.65rem] font-bold uppercase tracking-wide text-[#0d1b35] sm:px-4 sm:text-xs">
                      Overall
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {data.skillRows.map((row) => (
                      <td
                        key={row.key}
                        className="border-r border-slate-200 px-2 py-5 text-2xl font-bold text-[#0d1b35] sm:px-4 sm:text-3xl"
                      >
                        {formatCertificateBand(row.band)}
                      </td>
                    ))}
                    <td className="bg-[#c9972c]/10 px-2 py-5 text-3xl font-extrabold text-[#c9972c] sm:px-4 sm:text-4xl">
                      {formatCertificateBand(data.overallBand)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-center text-[0.65rem] text-slate-500">
              {PLACEMENT_ESTIMATE_DISCLAIMER}
            </p>
          </div>

          <div className="border-t border-slate-200 bg-white px-6 py-4 sm:px-8">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
              Speakify track grouping (not an official CEFR or IELTS scale)
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] font-semibold">
              {(["foundation", "plus", "elite"] as const).map((id) => (
                <span
                  key={id}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600"
                >
                  {ACCELERATOR_TRACKS[id].name}: {ACCELERATOR_TRACKS[id].target}
                </span>
              ))}
              {data.overallBand != null ? (
                <span className="rounded border border-[#c9972c]/40 bg-[#c9972c]/10 px-2 py-1 text-[#0d1b35]">
                  This mock: {ACCELERATOR_TRACKS[acceleratorTrackIdForBand(data.overallBand)].name}
                </span>
              ) : null}
            </div>
          </div>

          {/* Footer seal */}
          <div className="flex flex-col gap-4 border-t-2 border-[#c9972c] bg-[#0d1b35] px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-[#c9972c] text-center"
                aria-hidden
              >
                <span className="text-lg text-[#c9972c]">★</span>
                <span className="px-1 text-[0.45rem] font-extrabold uppercase leading-tight tracking-widest text-[#c9972c]">
                  Speakify
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#c9972c]">Authorised simulation report</p>
                <p className="mt-1 text-[0.65rem] leading-relaxed text-slate-300">
                  Issued by Speakify Global Language Center for accelerator programme progress
                  tracking.
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-mono text-xs text-[#c9972c]">{data.certificateId}</p>
              <p className="mt-1 text-[0.6rem] text-slate-400">Certificate / TRF reference</p>
            </div>
          </div>

          <p className="border-t border-slate-200 px-6 py-3 text-center text-[0.6rem] leading-relaxed text-slate-500 sm:px-8">
            {data.disclaimer}
          </p>
        </div>
      </div>
    );
  }
);

export default MockCompletionCertificate;

export function printMockCertificate(domId = "mock-completion-certificate") {
  const el = document.getElementById(domId);
  if (!el) {
    window.print();
    return;
  }
  const prevTitle = document.title;
  document.title = "Speakify IELTS Mock Test Report";
  window.print();
  document.title = prevTitle;
}
