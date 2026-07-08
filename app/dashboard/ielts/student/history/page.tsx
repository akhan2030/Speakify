import { redirect } from "next/navigation";

export default function HistoryRedirect() {
  redirect("/dashboard/ielts/student/progress?tab=history");
}
