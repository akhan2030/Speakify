import { redirect } from "next/navigation";
import { STEP_ROUTES } from "@/lib/step/paths";

export default function AcceleratorRedirect() {
  redirect(STEP_ROUTES.myJourney);
}
