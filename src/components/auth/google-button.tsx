"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { signInWithGoogle } from "@/store/account-store";

/**
 * "Continue with Google", through Firebase Authentication.
 *
 * Tapping it opens Google's own account chooser with the Google accounts on
 * the device; the person picks one and confirms with Google. Our server then
 * checks the sign-in with Google (/api/auth/google) and only accepts Google
 * accounts with a verified email. A Google account that's new to Planzy gets
 * set up (area, interests); a known one just logs in. Planzy keeps its own
 * session, so Firebase is signed out again right after.
 */
const REDIRECT_FLAG = "planzy:google-redirect";

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

/** Our server checks the Firebase token with Google, then we sign in to Planzy. */
async function finishSignIn(idToken: string) {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = (await res.json().catch(() => ({}))) as { name?: string; email?: string; picture?: string; error?: string };
  if (!res.ok || !data.email) throw new Error(data.error ?? "Google sign-in failed. Try again.");
  signInWithGoogle({ name: data.name ?? "", email: data.email, picture: data.picture });
}

/** Friendly text for Firebase's error codes; null means stay quiet (the person closed it). */
function messageFor(error: unknown): string | null {
  const code = (error as { code?: string })?.code ?? "";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" || code === "auth/user-cancelled") return null;
  if (code === "auth/unauthorized-domain") {
    return `Google sign-in isn't allowed on ${window.location.hostname} yet. Add it in Firebase → Authentication → Settings → Authorized domains.`;
  }
  if (code === "auth/network-request-failed") return "No connection. Check your internet and try again.";
  if (code === "auth/operation-not-allowed") return "Google sign-in is turned off in Firebase (Authentication → Sign-in method → Google).";
  if (error instanceof Error && !code) return error.message;
  return "Google sign-in didn't work. Please try again.";
}

export function GoogleButton({ mode = "signin" }: { mode?: "signin" | "signup"; oneTap?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Coming back from the redirect fallback: finish signing in.
  useEffect(() => {
    let flagged = false;
    try {
      flagged = window.sessionStorage.getItem(REDIRECT_FLAG) === "1";
      window.sessionStorage.removeItem(REDIRECT_FLAG);
    } catch {
      // storage blocked
    }
    if (!flagged) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const { firebaseAuth } = await import("@/lib/firebase");
        const { getRedirectResult, signOut } = await import("firebase/auth");
        const auth = firebaseAuth();
        const result = await getRedirectResult(auth);
        if (result && !cancelled) {
          await finishSignIn(await result.user.getIdToken());
          await signOut(auth);
        }
      } catch (e) {
        if (!cancelled) setError(messageFor(e) ?? "");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const start = async () => {
    setError("");
    setBusy(true);
    try {
      const { firebaseAuth, googleProvider } = await import("@/lib/firebase");
      const { signInWithPopup, signInWithRedirect, signOut } = await import("firebase/auth");
      const auth = firebaseAuth();
      try {
        const result = await signInWithPopup(auth, googleProvider());
        await finishSignIn(await result.user.getIdToken());
        await signOut(auth);
      } catch (e) {
        // Popups blocked (some in-app browsers): go to Google and come back.
        if ((e as { code?: string })?.code === "auth/popup-blocked") {
          try {
            window.sessionStorage.setItem(REDIRECT_FLAG, "1");
          } catch {
            // storage blocked
          }
          await signInWithRedirect(auth, googleProvider());
          return;
        }
        throw e;
      }
    } catch (e) {
      setError(messageFor(e) ?? "");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border-[1.5px] border-ink bg-white text-[16px] font-medium text-ink shadow-[0_3px_0_#242a2f] transition active:translate-y-[2px] active:shadow-none disabled:opacity-60"
      >
        {busy ? <Loader2 size={20} className="animate-spin" /> : <GoogleMark />}
        {busy ? "Waiting for Google…" : mode === "signup" ? "Sign up with Google" : "Continue with Google"}
      </button>
      {error && <p className="mt-2 text-center text-[12px] leading-[17px] text-red-600">{error}</p>}
    </>
  );
}
