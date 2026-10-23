import type { ReactNode } from "react";
import { AppIntro } from "@/components/brand/app-intro";
import { StatusBar } from "./status-bar";

/**
 * Full-screen on phones; a centred 430x932 phone frame on desktop.
 * Route-group layouts decide what's inside (sign-in check, bottom bar).
 */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center md:py-6">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white md:h-[932px] md:max-h-[calc(100dvh-3rem)] md:rounded-[48px] md:border md:border-black/10 md:shadow-[0_30px_80px_-20px_rgba(36,42,47,0.35)]">
        <StatusBar />
        <div className="relative min-h-0 flex-1">{children}</div>
        <AppIntro />
      </div>
    </div>
  );
}
