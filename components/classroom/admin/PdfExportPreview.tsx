"use client";

export default function PdfExportPreview({
  unitTitle = "Selected unit",
}: {
  unitTitle?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold">PDF export preview</h2>
      <p className="mt-1 text-sm text-slate-500">
        Browser print for {unitTitle}. Student version hides answer keys;
        teacher version includes keys and notes.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Print student PDF
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Print teacher PDF (with keys)
        </button>
      </div>
      <div className="classroom-print-area mt-6 rounded-lg border border-dashed border-slate-300 bg-[#f7f4ef] p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8a6a1f]">
          Speakify Classroom
        </p>
        <h3 className="mt-2 text-xl font-semibold">{unitTitle}</h3>
        <p className="mt-2 text-sm text-slate-600">
          Preview page — open a unit editor and use these buttons to generate a
          printable worksheet.
        </p>
      </div>
    </div>
  );
}
