"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { signInWithGoogle } from "@/store/account-store";

/**
 * Real "Sign in with Google" (Google Identity Services).
 *
 * Tapping the button opens Google's own account chooser, listing the Google
 * accounts on this device; the person picks one and confirms with Google. On
 * the sign-in screen Google One Tap may also offer "Continue as …". Google
 * returns a signed ID token, which our server checks with Google
 * (/api/auth/google) before signing in. Only accounts with a verified email
 * are accepted. A Google account that's new to Planzy gets set up (area,
 * interests); a known one just logs in.
 *
 * Needs NEXT_PUBLIC_GOOGLE_CLIENT_ID (see README).
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GsiButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (res: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: "signin" | "signup" | "use";
            ux_mode?: "popup" | "redirect";
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (el: HTMLElement, options: GsiButtonOptions) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

let gsiPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  gsiPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gsiPromise = null;
      reject(new Error("Couldn't load Google sign-in"));
    };
    document.head.appendChild(s);
  });
  return gsiPromise;
}

export function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Sends Google's ID token to our server, which verifies it with Google. */
async function finishSignIn(credential: string) {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const data = (await res.json().catch(() => ({}))) as { name?: string; email?: string; picture?: string; error?: string };
  if (!res.ok || !data.email) throw new Error(data.error ?? "Google sign-in failed. Try again.");
  signInWithGoogle({ name: data.name ?? "", email: data.email, picture: data.picture });
}

export function GoogleButton({ mode = "signin", oneTap = false }: { mode?: "signin" | "signup"; oneTap?: boolean }) {
  const slot = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [setupHelp, setSetupHelp] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !slot.current) return;
        const id = window.google!.accounts.id;
        id.initialize({
          client_id: CLIENT_ID,
          context: mode,
          ux_mode: "popup",
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
          callback: ({ credential }) => {
            if (!credential) return setError("Google sign-in was cancelled.");
            setError("");
            setBusy(true);
            finishSignIn(credential)
              .catch((e: Error) => setError(e.message))
              .finally(() => setBusy(false));
          },
        });
        // Google's own button: opens the account chooser for this device.
        id.renderButton(slot.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: mode === "signup" ? "signup_with" : "continue_with",
          logo_alignment: "center",
          width: Math.min(400, Math.max(200, slot.current.offsetWidth)),
        });
        setReady(true);
        if (oneTap) id.prompt();
      })
      .catch(() => !cancelled && setError("Couldn't reach Google. Check your connection."));
    return () => {
      cancelled = true;
      window.google?.accounts?.id?.cancel();
    };
  }, [mode, oneTap]);

  if (!CLIENT_ID) {
    return (
      <>
        <button
          type="button"
          onClick={() => setSetupHelp(true)}
          className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border-[1.5px] border-ink bg-white text-[16px] font-medium text-ink shadow-[0_3px_0_#242a2f] transition active:translate-y-[2px] active:shadow-none"
        >
          <GoogleMark />
          {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
        </button>
        <Sheet open={setupHelp} onClose={() => setSetupHelp(false)} title="Google sign-in">
          <p className="text-[14px] leading-[21px] text-ink/80">
            Google sign-in isn&apos;t switched on for this copy of Planzy yet. It needs a Google OAuth client ID so
            Google can show your accounts and confirm it&apos;s you.
          </p>
          <p className="mt-3 text-[13px] leading-[20px] text-muted">
            Add <code className="rounded bg-cream px-1">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> (see README), restart the
            app, and this button will open Google&apos;s account chooser. Until then, sign in with your phone number or
            email.
          </p>
        </Sheet>
      </>
    );
  }

  return (
    <div className="relative">
      {/* Google renders its button here; we keep the height so nothing jumps. */}
      <div ref={slot} className={`flex min-h-[44px] w-full justify-center ${busy ? "pointer-events-none opacity-50" : ""}`} />
      {(!ready || busy) && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-[13px] text-ink/70">
          <Loader2 size={18} className="animate-spin" /> {busy ? "Checking with Google…" : "Loading Google…"}
        </div>
      )}
      {error && <p className="mt-2 text-center text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
