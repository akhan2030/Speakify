import { redirect } from "next/navigation";

export default function AchievementsRedirect() {
  redirect("/dashboard/ielts/student/progress?tab=achievements");
}
