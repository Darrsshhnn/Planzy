"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * "< Make a Plan" header. Pass `backHref` for a fixed flow step,
 * or omit it to go back in history (falls back to Home).
 */
export function PageHeader({
  title,
  backHref,
  right,
  subtitle,
}: {
  title: string;
  backHref?: string;
  right?: ReactNode;
  subtitle?: ReactNode;
}) {
  const router = useRouter();
  const icon = <ChevronLeft size={26} />;
  const backClass = "-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-ink/5";

  return (
    <header className="flex items-center gap-1.5 pb-4 pt-5 md:pt-4">
      {backHref ? (
        <Link href={backHref} aria-label="Back" className={backClass}>
          {icon}
        </Link>
      ) : (
        <button
          aria-label="Back"
          className={backClass}
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        >
          {icon}
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-heading text-[22px] font-bold leading-tight text-ink">{title}</h1>
        {subtitle && <div className="text-[12px] text-muted">{subtitle}</div>}
      </div>
      {right}
    </header>
  );
}
