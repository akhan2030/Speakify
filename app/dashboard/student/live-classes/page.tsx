"use client";

import StudentSidebar from "@/components/StudentSidebar";
import LiveClassesStudio from "@/components/live-classes/LiveClassesStudio";

export default function StudentLiveClassesPage() {
  return (
    <div className="flex min-h-screen bg-[#F7F5F0]">
      <StudentSidebar activePage="live-classes" />
      <main className="ml-[200px] flex-1">
        <LiveClassesStudio callbackPath="/dashboard/student/live-classes" />
      </main>
    </div>
  );
}
