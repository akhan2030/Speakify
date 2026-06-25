"use client";

import { Suspense } from "react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import PathwayLessonContent from "./PathwayLessonContent";

export default function PathwayLessonPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-slate-50">
          <StudentSidebar activePage="course" />
          <main className="ml-[200px] flex flex-1 items-center justify-center">
            <PageSpinner />
          </main>
        </div>
      }
    >
      <PathwayLessonContent />
    </Suspense>
  );
}
