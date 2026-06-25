"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import StudentSidebar from "@/components/StudentSidebar";
import GraduationTestRunner from "@/components/pathway/GraduationTestRunner";

export default function PathwayGraduationTestPage() {
  const params = useParams();
  const levelId = String(params.levelId);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <StudentSidebar activePage="course" />
      <main className="ml-[200px] min-h-screen flex-1 p-6">
        <Link
          href={`/dashboard/student/pathway/${levelId}`}
          className="text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← Back to level
        </Link>
        <div className="mt-6">
          <GraduationTestRunner levelId={levelId} />
        </div>
      </main>
    </div>
  );
}
