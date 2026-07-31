"use client";

import { usePathname } from "next/navigation";
import IELTSSidebar from "@/components/IELTSSidebar";
import IeltsOnboardingGate from "@/components/ielts/IeltsOnboardingGate";
import ProgramStudentLayout from "@/components/student/ProgramStudentLayout";
import IeltsMockExamShell from "@/components/mock-test/IeltsMockExamShell";
import { isIeltsAcademicMockPath } from "@/lib/mock-test/ieltsMockRoutes";

export default function IeltsStudentLayoutSwitch({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMockProduct = Boolean(pathname && isIeltsAcademicMockPath(pathname));

  if (isMockProduct) {
    return (
      <ProgramStudentLayout expectedProgram="ielts">
        <IeltsMockExamShell>{children}</IeltsMockExamShell>
      </ProgramStudentLayout>
    );
  }

  return (
    <ProgramStudentLayout expectedProgram="ielts">
      <div className="program-student-layout flex min-h-screen bg-white">
        <IELTSSidebar />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          <IeltsOnboardingGate>{children}</IeltsOnboardingGate>
        </div>
      </div>
    </ProgramStudentLayout>
  );
}
