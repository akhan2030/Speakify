import MarketingShell from "@/components/marketing/MarketingShell";
import MockExamsLanding from "@/components/courses/MockExamsLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IELTS Academic Mock Exams | Speakify",
  description:
    "Buy full IELTS Academic mock exams from 169 SAR — all 4 skills, AI scoring, and human review. No course enrollment required.",
};

export default function MockExamsPage() {
  return (
    <MarketingShell>
      <MockExamsLanding />
    </MarketingShell>
  );
}
