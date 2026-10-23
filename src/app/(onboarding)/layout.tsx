import type { ReactNode } from "react";
import { OnboardingGate } from "@/components/layout/gates";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingGate>{children}</OnboardingGate>;
}
