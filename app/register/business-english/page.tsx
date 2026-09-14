import ProgramComingSoon from "@/components/courses/ProgramComingSoon";
import { comingSoonForCourseSlug } from "@/lib/courses/enrolmentClosed";

export default function RegisterBusinessEnglishPage() {
  const copy = comingSoonForCourseSlug("business-english")!;
  return <ProgramComingSoon title={copy.title} body={copy.body} />;
}
