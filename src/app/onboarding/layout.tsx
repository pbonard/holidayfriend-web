import type { Metadata } from "next";
import OnboardingShell from "@/components/onboarding/OnboardingShell";

export const metadata: Metadata = {
  title: "Set up your profile · Holidayfriend",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingShell>{children}</OnboardingShell>;
}
