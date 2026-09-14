import GeneralSidebar from "@/components/GeneralSidebar";
import GeneralProgrammeMarker from "@/components/ielts-general/GeneralProgrammeMarker";
import ProgramStudentLayout from "@/components/student/ProgramStudentLayout";
import SpeakifyDashChrome from "@/components/dashboards/SpeakifyDashChrome";

export default function IeltsGeneralStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgramStudentLayout expectedProgram="ielts_general">
      <GeneralProgrammeMarker />
      <SpeakifyDashChrome className="program-student-layout flex min-h-screen">
        <GeneralSidebar />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
      </SpeakifyDashChrome>
    </ProgramStudentLayout>
  );
}
