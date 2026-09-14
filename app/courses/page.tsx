import MarketingShell from "@/components/marketing/MarketingShell";
import CoursesHub from "@/components/courses/CoursesHub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Speakify — Find your programme",
  description:
    "Pick the path that matches your goal — exam preparation, General English pathway, or English for work, life, and family.",
};

export default function CoursesHubPage() {
  return (
    <MarketingShell chrome="none">
      <CoursesHub />
    </MarketingShell>
  );
}
