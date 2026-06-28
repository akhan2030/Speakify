import { redirect } from "next/navigation";
import { STEP_STUDENT_BASE } from "@/lib/step/paths";

export default function StepDashboardRedirect() {
  redirect(STEP_STUDENT_BASE);
}
