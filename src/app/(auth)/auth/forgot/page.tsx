"use client";

import { CircleCheck } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { AuthButton, AuthField, AuthShell } from "@/components/auth/auth-shell";
import { checkOtp, DEMO_OTP_HINT, hasAccount, passwordProblem, resetPassword } from "@/store/account-store";

type Step = "identify" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (step === "identify") {
      if (!hasAccount(identifier)) return setError("No account found with that number or email");
      setStep("otp");
    } else if (step === "otp") {
      if (!checkOtp(otp)) return setError("That code isn't right");
      setStep("reset");
    } else if (step === "reset") {
      const problem = passwordProblem(password) || (password === confirm ? "" : "Passwords don't match");
      if (problem) return setError(problem);
      await resetPassword(identifier, password);
      setStep("done");
    }
  };

  const copy: Record<Step, [string, string]> = {
    identify: ["Forgot password?", "Enter your mobile number or email and we'll send you a code."],
    otp: ["Enter the code", `We sent a 4-digit code to ${identifier}.`],
    reset: ["Set a new password", "At least 8 characters, with a letter and a number."],
    done: ["Password updated", "You can log in with your new password now."],
  };

  return (
    <AuthShell
      title={copy[step][0]}
      subtitle={copy[step][1]}
      back={step === "identify" || step === "done" ? "/auth/login" : undefined}
      onBack={step === "otp" ? () => setStep("identify") : step === "reset" ? () => setStep("otp") : undefined}
    >
      {step === "done" ? (
        <div className="flex flex-col items-center text-center">
          <CircleCheck size={48} className="text-brand" />
          <p className="mt-3 text-[14px]">All set. Use your new password to log in.</p>
          <Link
            href="/auth/login"
            className="mt-5 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-brand text-[17px] font-semibold text-white"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {step === "identify" && (
            <AuthField
              label="Mobile number or email"
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="98765 43210 or you@email.com"
              error={error}
            />
          )}
          {step === "otp" && (
            <AuthField
              label="Verification code"
              autoFocus
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="• • • •"
              hint={`Demo: the code is ${DEMO_OTP_HINT}`}
              error={error}
            />
          )}
          {step === "reset" && (
            <>
              <AuthField
                label="New password"
                password
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <AuthField
                label="Confirm new password"
                password
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                error={error}
              />
            </>
          )}
          <AuthButton type="submit" className="mt-7">
            {step === "identify" ? "Send code" : step === "otp" ? "Verify" : "Update password"}
          </AuthButton>
        </form>
      )}
    </AuthShell>
  );
}
