import { Suspense } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import IeltsMyProgressPage from "@/components/ielts/progress/IeltsMyProgressPage";

export default function ProgressPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <PageSpinner />
        </div>
      }
    >
      <IeltsMyProgressPage />
    </Suspense>
  );
}
