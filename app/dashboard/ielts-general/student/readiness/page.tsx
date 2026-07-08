import { redirect } from "next/navigation";

export default function GtReadinessRedirect({
  searchParams,
}: {
  searchParams: { tab?: string; view?: string };
}) {
  const tab = searchParams?.tab;
  if (tab === "programme") {
    const view = searchParams?.view === "weekly" ? "&view=weekly" : "";
    redirect(`/dashboard/ielts-general/student/progress?tab=programme${view}`);
  }
  if (tab === "history" || tab === "achievements") {
    redirect(`/dashboard/ielts-general/student/progress?tab=${tab}`);
  }
  redirect("/dashboard/ielts-general/student/progress?tab=readiness");
}
