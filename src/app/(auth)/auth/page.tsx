"use client";

import { useEffect, useState } from "react";
import { LoginScreen } from "@/components/auth/login-screen";
import { Splash } from "@/components/layout/gates";

const SEEN_KEY = "planzy:intro-seen";

/**
 * Landing: the logo animates on the orange brand screen, then the orange
 * slides away to reveal the login. Plays once per browser session.
 */
export default function LandingPage() {
  const [phase, setPhase] = useState<"intro" | "leaving" | "done">("intro");

  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
    const timers = seen
      ? [setTimeout(() => setPhase("done"), 0)]
      : [setTimeout(() => setPhase("leaving"), 1700), setTimeout(() => setPhase("done"), 2300)];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      <LoginScreen className={phase === "intro" ? "invisible" : ""} />
      {phase !== "done" && (
        <div
          className={`absolute inset-0 z-50 transition-transform duration-[600ms] ease-[cubic-bezier(0.7,0,0.3,1)] ${
            phase === "leaving" ? "-translate-y-full" : ""
          }`}
        >
          <Splash animate />
        </div>
      )}
    </>
  );
}
