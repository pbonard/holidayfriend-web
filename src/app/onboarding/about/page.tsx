import AboutStep from '@/components/onboarding/AboutStep';
import StepHeader from '@/components/onboarding/StepHeader';

export default function AboutPage() {
  return (
    <>
      <StepHeader
        title="About you"
        description="One of these may give people something to say hi about."
      />
      <AboutStep />
    </>
  );
}
