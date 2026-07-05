import RegisterForm from "@/components/register/RegisterForm";

export default function RegisterIeltsAcceleratorPage({
  searchParams,
}: {
  searchParams: { track?: string };
}) {
  const track = String(searchParams?.track ?? "").trim().toLowerCase();
  return <RegisterForm slug="ielts" acceleratorTrack={track || undefined} />;
}
