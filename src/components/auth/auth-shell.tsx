"use client";

import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { AuthBackground } from "./auth-background";

/** White sign-in layout: drifting background, logo, progress, title, then the form. */
export function AuthShell({
  title,
  subtitle,
  back,
  onBack,
  step,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Link for the back arrow, or use onBack. */
  back?: string;
  onBack?: () => void;
  /** [current, total] shows a progress bar (sign-up steps). */
  step?: [number, number];
  children: ReactNode;
}) {
  const backClass = "flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-ink bg-white text-ink";
  return (
    <div className="absolute inset-0 overflow-y-auto bg-white">
      <AuthBackground />
      <div className="relative px-7 pb-10 pt-6">
        <div className="flex h-10 items-center justify-between">
          {back ? (
            <Link href={back} aria-label="Back" className={backClass}>
              <ChevronLeft size={22} />
            </Link>
          ) : onBack ? (
            <button onClick={onBack} aria-label="Back" className={backClass}>
              <ChevronLeft size={22} />
            </button>
          ) : (
            <span />
          )}
          <Logo width={96} />
        </div>
        {step && (
          <div className="mt-6 flex gap-1.5" aria-label={`Step ${step[0]} of ${step[1]}`}>
            {Array.from({ length: step[1] }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < step[0] ? "bg-brand" : "bg-ink/10"}`}
              />
            ))}
          </div>
        )}
        <h1 className="mt-7 font-heading text-[26px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14px] text-ink/65">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}

/** Orange primary button used on every sign-in screen. */
export function AuthButton({ className = "", ...rest }: ComponentProps<"button">) {
  return (
    <button
      {...rest}
      className={`h-[52px] w-full rounded-[14px] bg-brand text-[17px] font-semibold text-white transition active:scale-[0.99] disabled:opacity-60 ${className}`}
    />
  );
}

export function AuthField({
  label,
  error,
  hint,
  password,
  prefix,
  ...input
}: {
  label: string;
  error?: string;
  hint?: string;
  password?: boolean;
  prefix?: string;
} & ComponentProps<"input">) {
  const [show, setShow] = useState(false);
  return (
    <label className="mt-4 block first:mt-0">
      <span className="text-[13px] font-semibold">{label}</span>
      <span
        className={`mt-1.5 flex h-[52px] items-center gap-2 rounded-[14px] border-[1.5px] bg-white/90 px-4 focus-within:border-brand ${error ? "border-red-500" : "border-ink"}`}
      >
        {prefix && <span className="text-[15px] font-medium text-ink/70">{prefix}</span>}
        <input
          {...input}
          type={password ? (show ? "text" : "password") : input.type}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink/35"
        />
        {password && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="text-ink/60"
          >
            {show ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        )}
      </span>
      {error ? (
        <span className="mt-1 block text-[12px] text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>
      )}
    </label>
  );
}
