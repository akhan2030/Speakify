import MarketingShell from "@/components/marketing/MarketingShell";
import GeneralMockExamsLanding from "@/components/courses/GeneralMockExamsLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IELTS General Training Mock Exams | Speakify",
  description:
    "Buy 3 full timed IELTS General Training mock exams from 169 SAR — letter Task 1, Reading A/B/C, AI scoring, and human review.",
};

export default function GeneralMockExamsPage() {
  return (
    <MarketingShell>
      <GeneralMockExamsLanding />
    </MarketingShell>
  );
}
