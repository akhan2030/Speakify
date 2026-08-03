import MarketingShell from "@/components/marketing/MarketingShell";
import MockExamsLanding from "@/components/courses/MockExamsLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IELTS Academic & General Mock Exams | Speakify",
  description:
    "Buy full IELTS Academic (5) and General Training (3) mock exams from 169 SAR — all 4 skills, AI scoring, and human review. No course enrollment required.",
};

export default function MockExamsPage() {
  return (
    <MarketingShell>
      <MockExamsLanding />
    </MarketingShell>
  );
}
