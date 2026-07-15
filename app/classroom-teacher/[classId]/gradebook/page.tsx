import Link from "next/link";
import QuizResultsGrid from "@/components/classroom/teacher/QuizResultsGrid";

export default async function TeacherGradebookPage({
  params,
}: {
  params: { classId: string };
}) {
  const { classId } = params;
  return (
    <div className="space-y-4">
      <Link
        href={`/classroom-teacher/${encodeURIComponent(classId)}`}
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Class home
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Gradebook</h1>
      <p className="text-slate-600">
        Quiz scores and unit completion. Persist to DB after classroom migration.
      </p>
      <QuizResultsGrid unitLabel="All units (preview)" />
    </div>
  );
}
