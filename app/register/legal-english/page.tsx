import ProgramComingSoon from "@/components/courses/ProgramComingSoon";
import { comingSoonForCourseSlug } from "@/lib/courses/enrolmentClosed";

export default function RegisterLegalEnglishPage() {
  const copy = comingSoonForCourseSlug("legal-english")!;
  return <ProgramComingSoon title={copy.title} body={copy.body} />;
}
