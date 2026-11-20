import Link from "next/link";
import type { ReactNode } from "react";

/** Plain, readable page for the privacy policy and terms (open without signing in). */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-white">
      <article className="px-6 pb-16 pt-8 text-[14px] leading-[22px] text-ink/85 [&_h2]:mt-7 [&_h2]:font-heading [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
        <Link href="/auth" className="text-[13px] font-semibold text-brand">
          ← Back to Planzy
        </Link>
        <h1 className="mt-4 font-heading text-[26px] font-bold text-ink">{title}</h1>
        <p className="!mt-1 text-[12px] text-muted">Last updated {updated}</p>
        {children}
        <p className="!mt-10 text-[12px] text-muted">
          Questions? Open an issue on{" "}
          <a href="https://github.com/Darrsshhnn/Planzy" className="text-navy underline underline-offset-2">
            Planzy on GitHub
          </a>
          .
        </p>
      </article>
    </div>
  );
}
