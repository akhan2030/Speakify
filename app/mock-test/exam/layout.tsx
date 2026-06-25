export default function MockExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#f8f9fa]">
      {children}
    </div>
  );
}
