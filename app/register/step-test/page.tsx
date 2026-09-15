import RegisterForm from "@/components/register/RegisterForm";
import ProgramComingSoon from "@/components/courses/ProgramComingSoon";
import { isStepRegistrationOpen } from "@/lib/step/launchGate";

export default function RegisterStepTestPage() {
  if (!isStepRegistrationOpen()) {
    return (
      <ProgramComingSoon
        title="Speakify STEP Accelerator"
        body="Speakify STEP preparation is not open for new registration. Existing students can still sign in."
      />
    );
  }
  return <RegisterForm slug="step-test" />;
}
