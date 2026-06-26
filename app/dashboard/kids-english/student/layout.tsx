import SpecialtyStudentLayout from "@/components/specialty/SpecialtyStudentLayout";

export default function KidsEnglishStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SpecialtyStudentLayout programId="kids_english">{children}</SpecialtyStudentLayout>;
}
