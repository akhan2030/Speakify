import { redirect } from "next/navigation";

export default function GtReadinessRedirect() {
  redirect("/dashboard/ielts-general/student/progress");
}
