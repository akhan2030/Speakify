import { redirect } from "next/navigation";

export default function AcceleratorRedirect() {
  redirect("/dashboard/ielts/student/progress?tab=programme");
}
