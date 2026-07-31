import IeltsStudentLayoutSwitch from "@/components/ielts/IeltsStudentLayoutSwitch";

export default function IeltsStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IeltsStudentLayoutSwitch>{children}</IeltsStudentLayoutSwitch>;
}
