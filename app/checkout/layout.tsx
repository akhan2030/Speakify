import { Suspense } from "react";

function CheckoutFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center text-white"
      style={{ backgroundColor: "#0d1b35" }}
    >
      <span
        className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
        style={{ borderColor: "#c9972c40", borderTopColor: "#c9972c" }}
      />
    </div>
  );
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<CheckoutFallback />}>{children}</Suspense>;
}
