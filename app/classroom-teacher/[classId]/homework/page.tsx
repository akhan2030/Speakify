import Link from "next/link";
import HomeworkAssigner from "@/components/classroom/teacher/HomeworkAssigner";

export default async function TeacherHomeworkPage({
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
      <h1 className="text-2xl font-semibold tracking-tight">Homework</h1>
      <HomeworkAssigner />
    </div>
  );
}
