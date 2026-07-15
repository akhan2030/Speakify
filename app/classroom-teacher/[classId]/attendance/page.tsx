import Link from "next/link";
import AttendanceTracker from "@/components/classroom/teacher/AttendanceTracker";

export default async function TeacherAttendancePage({
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
      <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
      <AttendanceTracker />
    </div>
  );
}
