import MarketingShell from "@/components/marketing/MarketingShell";
import CoursesHub from "@/components/courses/CoursesHub";
import { getRecommendedCourse } from "@/lib/courses/getRecommendedCourse";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses | Speakify LMS",
  description:
    "Browse all Speakify programmes — IELTS, TOEFL, STEP, English Pathway, Business English, and more.",
};

export default async function CoursesHubPage() {
  const recommended = await getRecommendedCourse();

  return (
    <MarketingShell>
      <CoursesHub recommended={recommended} />
    </MarketingShell>
  );
}
