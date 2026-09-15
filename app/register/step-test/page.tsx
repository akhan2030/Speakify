import ProgramComingSoon from "@/components/courses/ProgramComingSoon";
import { comingSoonForCourseSlug } from "@/lib/courses/enrolmentClosed";

export default function RegisterStepTestPage() {
  const copy = comingSoonForCourseSlug("step-preparation")!;
  return <ProgramComingSoon title={copy.title} body={copy.body} />;
}
