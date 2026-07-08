import { redirect } from "next/navigation";

export default function ReadinessRedirect() {
  redirect("/dashboard/ielts/student/progress?tab=readiness");
}
