import GeneralSidebar from "@/components/GeneralSidebar";
import ProgramStudentLayout from "@/components/student/ProgramStudentLayout";

export default function IeltsGeneralStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgramStudentLayout expectedProgram="ielts">
      <div className="program-student-layout flex min-h-screen bg-white">
        <GeneralSidebar />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
      </div>
    </ProgramStudentLayout>
  );
}
