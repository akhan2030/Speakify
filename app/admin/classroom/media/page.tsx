import MediaUploader from "@/components/classroom/admin/MediaUploader";

export default function AdminClassroomMediaPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
      <p className="text-slate-600">
        Upload listening audio, images, and worksheet PDFs for classroom units.
      </p>
      <MediaUploader />
    </div>
  );
}
