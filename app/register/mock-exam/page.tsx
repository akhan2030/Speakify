import RegisterForm from "@/components/register/RegisterForm";

export const dynamic = "force-dynamic";

export default function RegisterMockExamPage({
  searchParams,
}: {
  searchParams: { product?: string; mock?: string; programme?: string };
}) {
  const product = String(searchParams?.product ?? "").trim().toLowerCase();
  const mock = String(searchParams?.mock ?? "").trim();
  const programme = String(searchParams?.programme ?? "").trim().toLowerCase();
  return (
    <RegisterForm
      slug="mock-exam"
      checkoutProduct={product || undefined}
      checkoutMock={mock || undefined}
      checkoutProgramme={programme || undefined}
    />
  );
}
