"use client";

import { House, MessageSquare, Plus, Search, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { needsLocation, useAuth } from "@/store/account-store";
import { BottomNav } from "./bottom-nav";

/** Orange brand screen shown while the session loads. */
export function Splash({ animate = false }: { animate?: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-brand">
      <Logo tone="light" width={230} animate={animate} />
    </div>
  );
}

/** The bar's look while the URL (and so the active tab) isn't known yet. */
function NavShell() {
  return (
    <nav
      aria-hidden
      className="absolute bottom-[22px] left-[15px] right-[15px] z-30 flex h-[70px] items-center rounded-[22px] bg-ink/75 text-cream backdrop-blur-md"
    >
      {[House, MessageSquare, Plus, Search, UserRound].map((Icon, i) => (
        <span key={i} className="flex flex-1 justify-center">
          <Icon size={24} />
        </span>
      ))}
    </nav>
  );
}

/** App screens: signed-in users who have picked their area. */
export function AppGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const redirect = !auth ? null : !auth.loggedIn ? "/auth" : needsLocation(auth) ? "/onboarding/location" : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (!auth || redirect) return <Splash />;
  return (
    <>
      {children}
      {/* Only the bar reads the URL, so only it waits on /chat/[id] etc. */}
      <Suspense fallback={<NavShell />}>
        <BottomNav />
      </Suspense>
    </>
  );
}

/** Welcome / log in / sign up: signed-out users only. */
export function AuthOnlyGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const redirect = auth?.loggedIn ? (needsLocation(auth) ? "/onboarding/location" : "/") : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (!auth) return <Splash />;
  if (redirect) return <Splash />;
  return <>{children}</>;
}

/** First-run setup after signing in (pick your area). */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const redirect = auth && !auth.loggedIn ? "/auth" : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (!auth || redirect) return <Splash />;
  return <>{children}</>;
}
