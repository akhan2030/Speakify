import GeneralIeltsReadinessMeter from "@/components/ielts-general/GeneralIeltsReadinessMeter";
import GeneralSkillBandHeader from "@/components/ielts-general/GeneralSkillBandHeader";

export default function GtReadinessPage() {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <GeneralSkillBandHeader
        skill="reading"
        title="IELTS Readiness"
        subtitle="General Training progress — letters, GT reading sections, listening & speaking"
      />
      <GeneralIeltsReadinessMeter />
    </main>
  );
}
