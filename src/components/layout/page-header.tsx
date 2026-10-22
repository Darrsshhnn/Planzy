"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Screen header. Pass `backHref` for a fixed destination, omit it to go back
 * in history, or set `noBack` on tab root screens. `titleHref` makes the title
 * tappable (e.g. the group name opens group details).
 */
export function PageHeader({
  title,
  backHref,
  noBack,
  titleHref,
  right,
  subtitle,
}: {
  title: string;
  backHref?: string;
  noBack?: boolean;
  titleHref?: string;
  right?: ReactNode;
  subtitle?: ReactNode;
}) {
  const router = useRouter();
  const icon = <ChevronLeft size={24} />;
  const backClass = "-ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink hover:bg-ink/5";

  const heading = (
    <>
      <h1 className="flex items-center gap-0.5 font-heading text-[19px] font-bold leading-tight text-ink">
        <span className="truncate">{title}</span>
        {titleHref && <ChevronRight size={18} className="shrink-0 text-ink/50" />}
      </h1>
      {subtitle && <div className="truncate text-[12px] text-muted">{subtitle}</div>}
    </>
  );

  return (
    <header className="flex items-center gap-1.5 pb-2.5 pt-4 md:pt-3">
      {noBack ? null : backHref ? (
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
      {titleHref ? (
        <Link href={titleHref} className="min-w-0 flex-1" aria-label={`${title}: group details`}>
          {heading}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{heading}</div>
      )}
      {right}
    </header>
  );
}
