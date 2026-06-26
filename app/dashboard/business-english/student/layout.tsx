import SpecialtyStudentLayout from "@/components/specialty/SpecialtyStudentLayout";

export default function BusinessEnglishStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SpecialtyStudentLayout programId="business_english">{children}</SpecialtyStudentLayout>
  );
}
