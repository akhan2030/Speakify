import ProgramStudentLayout from "@/components/student/ProgramStudentLayout";
import SpecialtySidebar from "@/components/specialty/SpecialtySidebar";
import type { SpecialtyProgramId } from "@/lib/specialtyPrograms";
import type { ProgramType } from "@/lib/programType";

export default function SpecialtyStudentLayout({
  children,
  programId,
}: {
  children: React.ReactNode;
  programId: SpecialtyProgramId;
}) {
  return (
    <ProgramStudentLayout expectedProgram={programId as ProgramType}>
      <div className="flex min-h-screen bg-[#f8fafc]">
        <SpecialtySidebar programId={programId} />
        <main className="min-w-0 flex-1 md:ml-[260px]">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>
      </div>
    </ProgramStudentLayout>
  );
}
