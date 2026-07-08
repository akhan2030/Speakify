import { redirect } from "next/navigation";

export default function GtReadinessRedirect({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams?.tab;
  if (tab === "history" || tab === "achievements") {
    redirect(`/dashboard/ielts-general/student/progress?tab=${tab}`);
  }
  redirect("/dashboard/ielts-general/student/progress?tab=readiness");
}
