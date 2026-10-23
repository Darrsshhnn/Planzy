"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { logIn } from "@/store/account-store";
import { AuthBackground } from "./auth-background";
import { GoogleButton } from "./google-button";

const INPUT =
  "h-[52px] w-full rounded-[14px] border-[1.5px] border-ink bg-white/90 px-4 text-[16px] outline-none placeholder:text-ink/45 focus:border-brand";

/** Log in (matches the Figma login): logo, email/phone, password, Google, sign up. */
export function LoginScreen({ className = "" }: { className?: string }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!identifier.trim() || !password) return setError("Enter your email or phone number and password");
    setBusy(true);
    const problem = await logIn(identifier, password);
    setBusy(false);
    // On success the auth gate takes you on.
    if (problem) setError(problem);
  };

  return (
    <div className={`absolute inset-0 overflow-y-auto bg-white ${className}`}>
      <AuthBackground />
      <div className="relative flex min-h-full flex-col px-7 pb-10 pt-[14vh]">
        <div className="flex justify-center">
          <Logo width={200} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-auto space-y-4 pt-16"
        >
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email / Phone Number"
            aria-label="Email or phone number"
            autoComplete="username"
            className={INPUT}
          />
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              placeholder="Password"
              aria-label="Password"
              autoComplete="current-password"
              className={`${INPUT} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink/55"
            >
              {show ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          <div className="-mt-2 text-right">
            <Link href="/auth/forgot" className="text-[13px] text-ink underline underline-offset-2">
              Forgot Password
            </Link>
          </div>
          {error && <p className="text-[13px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="h-[52px] w-full rounded-[14px] bg-brand text-[17px] font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <div className="my-4 flex items-center gap-3 text-[14px] text-ink/70" aria-hidden>
          <span className="h-px flex-1 bg-ink/35" /> or <span className="h-px flex-1 bg-ink/35" />
        </div>
        <GoogleButton />
        <Link href="/auth/signup" className="mt-6 self-center text-[14px] text-ink underline underline-offset-2">
          Create a new account
        </Link>
      </div>
    </div>
  );
}
