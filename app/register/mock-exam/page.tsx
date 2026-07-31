import RegisterForm from "@/components/register/RegisterForm";

export const dynamic = "force-dynamic";

export default function RegisterMockExamPage({
  searchParams,
}: {
  searchParams: { product?: string; mock?: string };
}) {
  const product = String(searchParams?.product ?? "").trim().toLowerCase();
  const mock = String(searchParams?.mock ?? "").trim();
  return (
    <RegisterForm
      slug="mock-exam"
      checkoutProduct={product || undefined}
      checkoutMock={mock || undefined}
    />
  );
}
