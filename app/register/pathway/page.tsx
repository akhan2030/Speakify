import ProgramComingSoon from "@/components/courses/ProgramComingSoon";
import { comingSoonForCourseSlug } from "@/lib/courses/enrolmentClosed";

export default function RegisterPathwayPage() {
  const copy = comingSoonForCourseSlug("english-pathway")!;
  return <ProgramComingSoon title={copy.title} body={copy.body} />;
}
