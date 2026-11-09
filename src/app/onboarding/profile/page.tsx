import ProfileStep from '@/components/onboarding/ProfileStep';
import StepHeader from '@/components/onboarding/StepHeader';

export default function ProfilePage() {
  return (
    <>
      <StepHeader
        title="Set up your profile"
        description="Tell us a little about yourself."
      />
      <ProfileStep />
    </>
  );
}
