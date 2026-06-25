import IELTSSidebar from "@/components/IELTSSidebar";
import IeltsOnboardingGate from "@/components/ielts/IeltsOnboardingGate";
import ProgramStudentLayout from "@/components/student/ProgramStudentLayout";

export default function IeltsStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
