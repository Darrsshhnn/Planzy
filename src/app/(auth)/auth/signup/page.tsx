"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthButton, AuthField, AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { cleanPhone, isEmail, passwordProblem, signUp } from "@/store/account-store";

const STEPS = ["name", "number", "password", "email"] as const;
type Step = (typeof STEPS)[number];

const COPY: Record<Step, { title: string; subtitle: string }> = {
  name: { title: "What's your name?", subtitle: "This is how friends will see you in groups." },
  number: { title: "Your mobile number", subtitle: "Friends can find and invite you with it." },
  password: { title: "Create a password", subtitle: "At least 8 characters, with a letter and a number." },
  email: { title: "Your email", subtitle: "For booking receipts and resetting your password." },
};

/** Sign up: name → number → password → email. Your area is picked right after. */
export default function SignupPage() {
  const [index, setIndex] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const step = STEPS[index];

  const validate = (): string => {
    if (step === "name") return name.trim().length < 2 ? "Enter your name" : "";
    if (step === "number") return cleanPhone(phone) ? "" : "Enter a valid 10-digit mobile number";
    if (step === "password") return passwordProblem(password) || (password === confirm ? "" : "Passwords don't match");
    return isEmail(email) ? "" : "Enter a valid email address";
  };

  const next = async () => {
    const problem = validate();
    setError(problem);
    if (problem) return;
    if (index < STEPS.length - 1) return setIndex(index + 1);
    setBusy(true);
    const err = await signUp({ name, phone: cleanPhone(phone)!, password, email });
    setBusy(false);
    // On success the gate opens the location screen.
    if (err) setError(err);
  };

  return (
    <AuthShell
      title={COPY[step].title}
      subtitle={COPY[step].subtitle}
      step={[index + 1, STEPS.length + 1]}
      back={index === 0 ? "/auth" : undefined}
      onBack={index > 0 ? () => (setError(""), setIndex(index - 1)) : undefined}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        {step === "name" && (
          <AuthField
            label="Full name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Darshan Patel"
            maxLength={30}
            error={error}
          />
        )}
        {step === "number" && (
          <AuthField
            label="Mobile number"
            autoFocus
            prefix="+91"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel-national"
            placeholder="98765 43210"
            error={error}
          />
        )}
        {step === "password" && (
          <>
            <AuthField
              label="Password"
              password
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <AuthField
              label="Confirm password"
              password
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Type it again"
              error={error}
            />
          </>
        )}
        {step === "email" && (
          <AuthField
            label="Email"
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@email.com"
            error={error}
          />
        )}
        <AuthButton type="submit" className="mt-7" disabled={busy}>
          {index < STEPS.length - 1 ? "Continue" : busy ? "Creating your account…" : "Create account"}
        </AuthButton>
      </form>
      {index === 0 && (
        <>
          <div className="my-4 flex items-center gap-3 text-[14px] text-ink/70" aria-hidden>
            <span className="h-px flex-1 bg-ink/35" /> or <span className="h-px flex-1 bg-ink/35" />
          </div>
          <GoogleButton />
        </>
      )}
      <p className="mt-6 text-center text-[14px]">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-brand underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
