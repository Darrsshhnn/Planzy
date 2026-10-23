"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { isEmail, signInWithGoogle } from "@/store/account-store";

/**
 * Google sign-in. With NEXT_PUBLIC_GOOGLE_CLIENT_ID set, this opens the real
 * Google account popup (Google Identity Services) and reads the name, email
 * and photo. Without it (local demo), a stand-in account chooser is shown.
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface TokenClient {
  requestAccessToken: () => void;
}
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (res: { access_token?: string; error?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) return resolve();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load Google sign-in"));
    document.head.appendChild(s);
  });
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

export function GoogleButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [chooser, setChooser] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const start = async () => {
    setError("");
    if (!CLIENT_ID) return setChooser(true);
    setBusy(true);
    try {
      await loadGsi();
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "openid email profile",
        callback: async (res) => {
          try {
            if (!res.access_token) throw new Error(res.error ?? "cancelled");
            const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${res.access_token}` },
            }).then((r) => r.json());
            signInWithGoogle({ name: info.name, email: info.email, picture: info.picture });
          } catch {
            setError("Google sign-in was cancelled or failed. Try again.");
          } finally {
            setBusy(false);
          }
        },
      });
      client.requestAccessToken();
    } catch {
      setBusy(false);
      setError("Couldn't reach Google. Check your connection.");
    }
  };

  const demoSignIn = () => {
    if (name.trim().length < 2) return setError("Enter your name");
    if (!isEmail(email) || !/@(gmail|googlemail)\.com$/i.test(email.trim())) return setError("Enter a Gmail address");
    signInWithGoogle({ name, email });
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border-[1.5px] border-ink bg-[#e3e3e3] text-[16px] font-medium text-ink/80 transition active:scale-[0.99] disabled:opacity-60"
      >
        {busy ? <Loader2 size={20} className="animate-spin" /> : <GoogleMark />}
        Continue with Google
      </button>
      {error && !chooser && <p className="mt-2 text-center text-[12px] text-red-600">{error}</p>}

      <Sheet open={chooser} onClose={() => setChooser(false)} title="Sign in with Google">
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <GoogleMark size={18} /> Choose the Google account to use with Planzy
        </div>
        <p className="mt-2 rounded-[10px] bg-cream px-3 py-2 text-[11px] text-ink/70">
          Demo mode: real Google sign-in turns on when the app has a Google client ID (see README).
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            demoSignIn();
          }}
          className="mt-3 space-y-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="h-[48px] w-full rounded-[14px] border border-ink bg-white px-4 text-[15px] outline-none focus:border-brand"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@gmail.com"
            autoComplete="email"
            className="h-[48px] w-full rounded-[14px] border border-ink bg-white px-4 text-[15px] outline-none focus:border-brand"
          />
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <button type="submit" className="h-[48px] w-full rounded-[14px] bg-brand text-[16px] font-semibold text-white">
            Continue
          </button>
        </form>
      </Sheet>
    </>
  );
}
