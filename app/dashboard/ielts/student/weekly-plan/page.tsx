import { redirect } from "next/navigation";

export default function WeeklyPlanRedirect() {
  redirect("/dashboard/ielts/student/progress?tab=programme&view=weekly");
}
