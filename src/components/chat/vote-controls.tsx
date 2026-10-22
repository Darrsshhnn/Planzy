"use client";

import { Check, CircleHelp, X, type LucideIcon } from "lucide-react";
import { VOTE_LABEL, type Tally } from "@/lib/votes";
import type { Vote } from "@/lib/types";

const VOTE_STYLE: Record<Vote, { on: string; icon: LucideIcon }> = {
  in: { on: "bg-brand border-brand text-white", icon: Check },
  maybe: { on: "bg-navy border-navy text-white", icon: CircleHelp },
  cant: { on: "bg-ink border-ink text-white", icon: X },
};

export function VoteButtons({
  value,
  onVote,
  disabled,
}: {
  value?: Vote;
  onVote: (v: Vote) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Your vote">
      {(Object.keys(VOTE_STYLE) as Vote[]).map((v) => {
        const { on, icon: Icon } = VOTE_STYLE[v];
        const active = value === v;
        return (
          <button
            key={v}
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onVote(v)}
            className={[
              "flex h-[30px] flex-1 items-center justify-center gap-1 rounded-full border text-[12px] font-medium transition active:scale-95 disabled:opacity-50",
              active ? on : "border-ink bg-paper text-ink",
            ].join(" ")}
          >
            <Icon size={13} />
            {VOTE_LABEL[v]}
          </button>
        );
      })}
    </div>
  );
}

/** Stacked bar of In / Maybe / Can't with counts. */
export function TallyBar({ tally, total }: { tally: Tally; total: number }) {
  const pct = (n: number) => `${(n / Math.max(total, 1)) * 100}%`;
  return (
    <div>
      <div className="flex h-[6px] overflow-hidden rounded-full bg-ink/10">
        <span className="bg-brand" style={{ width: pct(tally.in.length) }} />
        <span className="bg-navy" style={{ width: pct(tally.maybe.length) }} />
        <span className="bg-ink/60" style={{ width: pct(tally.cant.length) }} />
      </div>
      <p className="mt-1 text-[11px] text-muted">
        <span className="font-semibold text-brand">{tally.in.length} In</span> · {tally.maybe.length} Maybe ·{" "}
        {tally.cant.length} Can&apos;t
        {tally.pending.length > 0 && <> · {tally.pending.length} yet to vote</>}
      </p>
    </div>
  );
}
