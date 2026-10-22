"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/store/account-store";
import { BottomNav } from "./bottom-nav";

/** Shown while the session loads (and while URL-dependent routes stream in). */
export function Splash() {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="font-heading text-[28px] font-bold text-brand">Planzy</span>
    </div>
  );
}

/**
 * Signed-out users only see /auth screens; signed-in users skip them.
 * Renders nothing until the browser has read the saved session.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const onAuth = pathname.startsWith("/auth");
  const loggedIn = !!auth?.loggedIn;

  useEffect(() => {
    if (!auth) return;
    if (!loggedIn && !onAuth) router.replace("/auth");
    if (loggedIn && onAuth) router.replace("/");
  }, [auth, loggedIn, onAuth, router]);

  if (!auth || loggedIn === onAuth) return <Splash />;
  return (
    <>
      {children}
      {!onAuth && <BottomNav />}
    </>
  );
}
