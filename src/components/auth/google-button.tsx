"use client";

import { ArrowLeft, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { googleAccountsOnDevice, isEmail, signInWithGoogle } from "@/store/account-store";

/**
 * Sign in / sign up with Google, the way most apps do it:
 *
 * - With NEXT_PUBLIC_GOOGLE_CLIENT_ID set, this is real Google Identity
 *   Services: One Tap on the sign-in screen, and the Google account popup on
 *   the button. Name, email and photo come from Google.
 * - Without it (local demo), a look-alike flow runs: choose an account, or use
 *   another one, then confirm what Planzy gets.
 *
 * Either way, a Google account that's new to Planzy is created and goes
 * through setup (area, interests); a known one just logs in.
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
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (res: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: "signin" | "signup" | "use";
          }) => void;
          prompt: () => void;
          cancel: () => void;
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

/** Reads name, email and photo from a Google ID token (One Tap). */
function fromIdToken(credential: string) {
  const part = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    [...atob(part)].map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
  );
  const claims = JSON.parse(json) as { name?: string; email: string; picture?: string };
  return { name: claims.name ?? "", email: claims.email, picture: claims.picture };
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

const AVATAR_TINTS = ["#1a73e8", "#e8710a", "#188038", "#a142f4", "#d93025"];

function AccountAvatar({ name, picture, size = 36 }: { name: string; picture?: string; size?: number }) {
  if (picture && /^(https?:|data:|\/)/.test(picture)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={picture} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const tint = AVATAR_TINTS[(name.charCodeAt(0) || 0) % AVATAR_TINTS.length];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-medium text-white"
      style={{ width: size, height: size, background: tint, fontSize: size * 0.45 }}
    >
      {name.trim().charAt(0).toUpperCase() || <UserRound size={size * 0.5} />}
    </span>
  );
}

type Who = { name: string; email: string; picture?: string };
type Screen = "choose" | "email" | "consent";

/** Demo stand-in for Google's popup: choose account → (add one) → consent. */
function DemoChooser({ onClose, mode }: { onClose: () => void; mode: "signin" | "signup" }) {
  const known = googleAccountsOnDevice();
  const [screen, setScreen] = useState<Screen>(known.length ? "choose" : "email");
  const [who, setWho] = useState<Who | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const addAccount = () => {
    const mail = email.trim();
    if (!isEmail(mail) || !/@(gmail|googlemail)\.com$/i.test(mail)) return setError("Enter a Gmail address");
    if (name.trim().length < 2) return setError("Enter your name");
    setWho({ name: name.trim(), email: mail.toLowerCase() });
    setScreen("consent");
  };

  const confirm = () => {
    if (!who) return;
    setBusy(true);
    // A moment for "Signing you in…", like the real popup.
    setTimeout(() => signInWithGoogle(who), 700);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/45 px-5" role="dialog" aria-modal="true" aria-label="Sign in with Google">
      <button aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <div className="animate-pop relative w-full max-w-[360px] overflow-hidden rounded-[22px] bg-white text-[#1f1f1f] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[#e0e0e0] px-5 py-3 text-[13px] text-[#444746]">
          <GoogleMark size={18} /> Sign in with Google
        </div>

        <div className="px-6 pb-6 pt-5">
          {screen === "choose" && (
            <>
              <h2 className="text-[22px] leading-tight">Choose an account</h2>
              <p className="mt-1 text-[14px] text-[#444746]">
                to continue to <span className="font-medium text-brand">Planzy</span>
              </p>
              <ul className="mt-4 divide-y divide-[#e0e0e0] border-y border-[#e0e0e0]">
                {known.map((a) => (
                  <li key={a.email}>
                    <button
                      type="button"
                      onClick={() => {
                        setWho(a);
                        setScreen("consent");
                      }}
                      className="flex w-full items-center gap-3 py-3 text-left hover:bg-[#f8f9fa]"
                    >
                      <AccountAvatar name={a.name} picture={a.picture} />
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-medium">{a.name}</span>
                        <span className="block truncate text-[12px] text-[#444746]">{a.email}</span>
                      </span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => setScreen("email")}
                    className="flex w-full items-center gap-3 py-3 text-left text-[14px] font-medium hover:bg-[#f8f9fa]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e0e0e0] text-[#444746]">
                      <UserRound size={18} />
                    </span>
                    Use another account
                  </button>
                </li>
              </ul>
            </>
          )}

          {screen === "email" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addAccount();
              }}
            >
              {known.length > 0 && (
                <button type="button" onClick={() => setScreen("choose")} aria-label="Back" className="-ml-1 mb-1 rounded-full p-1 hover:bg-[#f1f3f4]">
                  <ArrowLeft size={18} />
                </button>
              )}
              <h2 className="text-[22px] leading-tight">{mode === "signup" ? "Sign up" : "Sign in"}</h2>
              <p className="mt-1 text-[14px] text-[#444746]">
                Use your Google Account to continue to <span className="font-medium text-brand">Planzy</span>
              </p>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                type="email"
                placeholder="Email (you@gmail.com)"
                autoComplete="email"
                autoFocus
                className="mt-5 h-[50px] w-full rounded-[6px] border border-[#747775] px-3.5 text-[15px] outline-none focus:border-2 focus:border-[#0b57d0]"
              />
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Your name"
                autoComplete="name"
                className="mt-3 h-[50px] w-full rounded-[6px] border border-[#747775] px-3.5 text-[15px] outline-none focus:border-2 focus:border-[#0b57d0]"
              />
              {error && <p className="mt-2 text-[12px] text-[#b3261e]">{error}</p>}
              <div className="mt-6 flex items-center justify-between">
                <button type="button" onClick={onClose} className="rounded-full px-3 py-2 text-[14px] font-medium text-[#0b57d0] hover:bg-[#f1f3f4]">
                  Cancel
                </button>
                <button type="submit" className="rounded-full bg-[#0b57d0] px-6 py-2.5 text-[14px] font-medium text-white">
                  Next
                </button>
              </div>
            </form>
          )}

          {screen === "consent" && who && (
            <>
              <div className="flex items-center gap-3 rounded-full border border-[#e0e0e0] py-1.5 pl-1.5 pr-4 self-start">
                <AccountAvatar name={who.name} picture={who.picture} size={28} />
                <span className="truncate text-[13px] font-medium">{who.email}</span>
              </div>
              <h2 className="mt-4 text-[20px] leading-tight">
                {mode === "signup" ? "Sign up to" : "Sign in to"} <span className="text-brand">Planzy</span>
              </h2>
              <p className="mt-3 flex gap-2 text-[13px] leading-[19px] text-[#444746]">
                <ShieldCheck size={18} className="mt-px shrink-0 text-[#188038]" />
                Google will share your name, email address and profile picture with Planzy. Planzy never sees your
                Google password.
              </p>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => (known.length ? setScreen("choose") : onClose())}
                  disabled={busy}
                  className="rounded-full px-4 py-2 text-[14px] font-medium text-[#0b57d0] hover:bg-[#f1f3f4]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-full bg-[#0b57d0] px-6 py-2.5 text-[14px] font-medium text-white disabled:opacity-80"
                >
                  {busy && <Loader2 size={16} className="animate-spin" />}
                  {busy ? "Signing in…" : "Continue"}
                </button>
              </div>
            </>
          )}
          <p className="mt-5 text-center text-[10px] text-[#747775]">
            Demo mode: add a Google client ID to use your real Google account (see README).
          </p>
        </div>
      </div>
    </div>
  );
}

export function GoogleButton({ mode = "signin", oneTap = false }: { mode?: "signin" | "signup"; oneTap?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [chooser, setChooser] = useState(false);

  // Real mode: offer One Tap ("Continue as …") on the sign-in screen.
  useEffect(() => {
    if (!CLIENT_ID || !oneTap) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled) return;
        window.google!.accounts.id.initialize({
          client_id: CLIENT_ID,
          context: mode,
          cancel_on_tap_outside: true,
          callback: (res) => {
            if (res.credential) signInWithGoogle(fromIdToken(res.credential));
          },
        });
        window.google!.accounts.id.prompt();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      window.google?.accounts?.id?.cancel();
    };
  }, [oneTap, mode]);

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

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border-[1.5px] border-ink bg-white text-[16px] font-medium text-ink shadow-[0_3px_0_#242a2f] transition active:translate-y-[2px] active:shadow-none disabled:opacity-60"
      >
        {busy ? <Loader2 size={20} className="animate-spin" /> : <GoogleMark />}
        {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
      </button>
      {error && <p className="mt-2 text-center text-[12px] text-red-600">{error}</p>}
      {chooser && <DemoChooser mode={mode} onClose={() => setChooser(false)} />}
    </>
  );
}
