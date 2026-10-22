"use client";

import { ChevronUp, ListChecks, Plus } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { getPerson, getPlace } from "@/lib/api/data";
import type { PlanState, Vote } from "@/lib/types";
import { rankShortlist } from "@/lib/votes";
import { ShortlistCard } from "./shortlist-card";

/** Slim bar under the chat header; opens the shortlist mini screen. */
export function ShortlistBar({ plan, onOpen }: { plan: PlanState; onOpen: () => void }) {
  const ranked = rankShortlist(plan, getPlace);
  const leader = ranked[0]?.tally.score ? ranked[0] : null;
  return (
    <button
      onClick={onOpen}
      className="card mx-5 mt-3 flex w-[calc(100%-2.5rem)] items-center gap-3 px-3 py-2 text-left"
      aria-label="Open shortlist"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-brand">
        <ListChecks size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">
          Shortlist · {plan.shortlist.length} place{plan.shortlist.length === 1 ? "" : "s"}
        </span>
        <span className="block truncate text-[11px] text-muted">
          {plan.decided
            ? "Voting closed"
            : leader
              ? `Leading: ${leader.place.name} (${leader.tally.in.length} In · ${leader.tally.maybe.length} Maybe)`
              : "Tap to vote In, Maybe or Can't"}
        </span>
      </span>
      <ChevronUp size={20} />
    </button>
  );
}

/** Mini screen with every shortlisted place, its votes, and Add place. */
export function ShortlistSheet({
  open,
  onClose,
  plan,
  viewerId,
  isAdmin,
  onVote,
  onAddPlace,
}: {
  open: boolean;
  onClose: () => void;
  plan: PlanState;
  viewerId: string;
  isAdmin: boolean;
  onVote: (placeId: string, vote: Vote) => void;
  onAddPlace: () => void;
}) {
  const ranked = rankShortlist(plan, getPlace);
  const leaderId = ranked[0]?.tally.score ? ranked[0].place.id : null;
  return (
    <Sheet open={open} onClose={onClose} title={`Shortlist (${plan.shortlist.length})`}>
      <p className="-mt-1 mb-3 text-[12px] text-muted">
        {plan.decided
          ? "Voting is closed."
          : isAdmin
            ? "Vote on each place. Tap Decide in the chat when the group is ready."
            : `Vote on each place. Only ${getPerson(plan.adminId).name} (admin) can decide.`}
      </p>
      <div className="space-y-3 pb-1">
        {ranked.map(({ place, tally }) => (
          <ShortlistCard
            key={place.id}
            className="w-full"
            place={place}
            tally={tally}
            total={plan.memberIds.length}
            myVote={plan.votes[place.id]?.[viewerId]}
            onVote={(v) => onVote(place.id, v)}
            locked={plan.decided}
            leading={place.id === leaderId}
          />
        ))}
      </div>
      {!plan.decided && (
        <button
          onClick={onAddPlace}
          className="mt-3 flex h-[46px] w-full items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-dashed border-brand bg-cream text-[14px] font-semibold"
        >
          <Plus size={18} className="text-brand" /> Add place
        </button>
      )}
    </Sheet>
  );
}
