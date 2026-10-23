import type { ReactNode } from "react";
import { AuthOnlyGate } from "@/components/layout/gates";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthOnlyGate>{children}</AuthOnlyGate>;
}
