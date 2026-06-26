import SpecialtyStudentLayout from "@/components/specialty/SpecialtyStudentLayout";

export default function LegalEnglishStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SpecialtyStudentLayout programId="legal_english">{children}</SpecialtyStudentLayout>;
}
