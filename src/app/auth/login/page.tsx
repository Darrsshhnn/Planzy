"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthField, AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { logIn } from "@/store/account-store";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!identifier.trim() || !password) return setError("Enter your number or email and password");
    setBusy(true);
    const problem = await logIn(identifier, password);
    setBusy(false);
    // On success the auth gate takes you to Home.
    if (problem) setError(problem);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in with your mobile number or email." back="/auth">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <AuthField
          label="Mobile number or email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          placeholder="98765 43210 or you@email.com"
        />
        <AuthField
          label="Password"
          password
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Your password"
        />
        <div className="mt-2 text-right">
          <Link href="/auth/forgot" className="text-[13px] font-semibold text-brand">
            Forgot password?
          </Link>
        </div>
        {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
        <Button type="submit" block className="mt-5" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-5 text-center text-[13px]">
        New to Planzy?{" "}
        <Link href="/auth/signup" className="font-semibold text-brand">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
