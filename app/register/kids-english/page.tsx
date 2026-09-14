import ProgramComingSoon from "@/components/courses/ProgramComingSoon";
import { comingSoonForCourseSlug } from "@/lib/courses/enrolmentClosed";

export default function RegisterKidsEnglishPage() {
  const copy = comingSoonForCourseSlug("kids-english")!;
  return <ProgramComingSoon title={copy.title} body={copy.body} />;
}
