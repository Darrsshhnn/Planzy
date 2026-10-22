"use client";

import { Check, LocateFixed, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthField, AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { currentPosition, getAreas, nearestArea } from "@/lib/geo";
import { cleanPhone, isEmail, passwordProblem, signUp } from "@/store/account-store";

const STEPS = ["name", "number", "password", "email", "location"] as const;
type Step = (typeof STEPS)[number];

const COPY: Record<Step, { title: string; subtitle: string }> = {
  name: { title: "What's your name?", subtitle: "This is how friends will see you in groups." },
  number: { title: "Your mobile number", subtitle: "Friends can find and invite you with it." },
  password: { title: "Create a password", subtitle: "At least 8 characters, with a letter and a number." },
  email: { title: "Your email", subtitle: "For booking receipts and resetting your password." },
  location: { title: "Where do you usually head out from?", subtitle: "We'll suggest places near you." },
};

export default function SignupPage() {
  const [index, setIndex] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const step = STEPS[index];

  /** Returns an error message for the current step, or "". */
  const validate = (): string => {
    if (step === "name") return name.trim().length < 2 ? "Enter your name" : "";
    if (step === "number") return cleanPhone(phone) ? "" : "Enter a valid 10-digit mobile number";
    if (step === "password") {
      const problem = passwordProblem(password);
      if (problem) return problem;
      return password === confirm ? "" : "Passwords don't match";
    }
    if (step === "email") return isEmail(email) ? "" : "Enter a valid email address";
    return location ? "" : "Pick your area";
  };

  const next = async () => {
    const problem = validate();
    setError(problem);
    if (problem) return;
    if (index < STEPS.length - 1) {
      setIndex(index + 1);
      return;
    }
    setBusy(true);
    const ok = await signUp({ name, phone: cleanPhone(phone)!, password, email, location: `${location}, Ahmedabad` });
    setBusy(false);
    // On success the auth gate takes you to Home.
    if (!ok) setError("Couldn't save your account on this device. Check storage settings.");
  };

  const useMyLocation = async () => {
    setLocating(true);
    const pos = await currentPosition();
    setLocating(false);
    if (!pos) {
      setError("Couldn't get your location here. Pick your area below.");
      return;
    }
    setError("");
    setLocation(nearestArea({ lat: pos.coords.latitude, lng: pos.coords.longitude }).name);
  };

  return (
    <AuthShell
      title={COPY[step].title}
      subtitle={COPY[step].subtitle}
      step={[index + 1, STEPS.length]}
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
        {step === "location" && (
          <>
            <button
              type="button"
              onClick={useMyLocation}
              className="card flex w-full items-center justify-center gap-2 py-3 text-[14px] font-semibold"
            >
              {locating ? <Loader2 size={18} className="animate-spin text-brand" /> : <LocateFixed size={18} className="text-brand" />}
              Use my current location
            </button>
            <p className="mt-4 text-[13px] font-semibold">Or pick your area</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Area">
              {getAreas().map((a) => (
                <button
                  key={a.name}
                  type="button"
                  role="radio"
                  aria-checked={location === a.name}
                  onClick={() => setLocation(a.name)}
                  className={`flex h-[32px] items-center gap-1 rounded-full border border-ink px-3 text-[13px] ${location === a.name ? "bg-ink text-brand" : "bg-paper"}`}
                >
                  {location === a.name && <Check size={14} />}
                  {a.name}
                </button>
              ))}
            </div>
            {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
          </>
        )}

        <Button type="submit" block className="mt-6" disabled={busy}>
          {index < STEPS.length - 1 ? "Continue" : busy ? "Creating your account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-[13px]">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
