import StepSidebar from "@/components/StepSidebar";
import ProgramStudentLayout from "@/components/student/ProgramStudentLayout";
import SpeakifyDashChrome from "@/components/dashboards/SpeakifyDashChrome";

export default function StepStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgramStudentLayout expectedProgram="step">
      <SpeakifyDashChrome className="program-student-layout flex min-h-screen">
        <StepSidebar />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
      </SpeakifyDashChrome>
    </ProgramStudentLayout>
  );
}
