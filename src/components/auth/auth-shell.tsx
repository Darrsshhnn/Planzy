"use client";

import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Screen } from "@/components/layout/screen";

/** Brand header + content area shared by the welcome, log-in, sign-up and reset screens. */
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
  const backClass = "flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white";
  return (
    <Screen padded={false} className="!pb-10">
      <div className="relative overflow-hidden bg-ink px-6 pb-14 pt-6 text-white">
        <span className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-brand/30" aria-hidden />
        <span className="absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-navy/60" aria-hidden />
        <div className="relative flex h-9 items-center justify-between">
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
          <span className="font-heading text-[18px] font-bold text-brand">Planzy</span>
        </div>
        {step && (
          <div className="relative mt-5 flex gap-1.5" aria-label={`Step ${step[0]} of ${step[1]}`}>
            {Array.from({ length: step[1] }).map((_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i < step[0] ? "bg-brand" : "bg-white/20"}`} />
            ))}
          </div>
        )}
        <h1 className="relative mt-5 font-heading text-[26px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="relative mt-1.5 text-[13px] text-white/75">{subtitle}</p>}
      </div>
      <div className="card relative -mt-8 mx-5 bg-cream! px-5 pb-6 pt-5">{children}</div>
    </Screen>
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
        className={`mt-1.5 flex h-[48px] items-center gap-2 rounded-[12px] border bg-paper px-4 shadow-[0_2px_0_#242a2f] ${error ? "border-red-500" : "border-ink"}`}
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
