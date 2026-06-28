import StepSidebar from "@/components/StepSidebar";
import ProgramStudentLayout from "@/components/student/ProgramStudentLayout";

export default function StepStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgramStudentLayout expectedProgram="ielts">
      <div className="program-student-layout flex min-h-screen bg-white">
        <StepSidebar />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
      </div>
    </ProgramStudentLayout>
  );
}
