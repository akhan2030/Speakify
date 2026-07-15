import PdfExportPreview from "@/components/classroom/admin/PdfExportPreview";

export default function AdminClassroomPdfExportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">PDF export</h1>
      <p className="text-slate-600">
        Generate printable student worksheets or teacher packs with answer keys.
      </p>
      <PdfExportPreview unitTitle="B1.1 · Unit 1 · Identity & Background" />
    </div>
  );
}
